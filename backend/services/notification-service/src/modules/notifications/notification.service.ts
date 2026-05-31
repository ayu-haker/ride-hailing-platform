import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  NotificationEntity,
  NotificationChannel,
  NotificationType,
} from './entities/notification.entity';
import { FIREBASE_MESSAGING, FirebaseMessaging } from './firebase.provider';
import { MAIL_TRANSPORT, MailTransport } from './mail.provider';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly twilioClient: any;

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @Inject(FIREBASE_MESSAGING)
    private readonly firebase: FirebaseMessaging,
    @Inject(MAIL_TRANSPORT)
    private readonly mailer: MailTransport,
    private readonly configService: ConfigService,
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    if (accountSid && authToken) {
      try {
        const twilio = require('twilio');
        this.twilioClient = twilio(accountSid, authToken);
      } catch {
        this.logger.warn('Twilio SDK failed to load');
      }
    }
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    deviceToken?: string,
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      const token = deviceToken || this.configService.get<string>(`FCM_TOKEN_${userId}`);
      if (!token) {
        this.logger.warn(`No FCM token found for user ${userId}`);
        return { success: false };
      }

      const message: any = {
        token,
        notification: { title, body },
        data: data || {},
        android: { priority: 'high' },
        apns: {
          payload: { aps: { sound: 'default', badge: 1 } },
        },
      };

      const messageId = await this.firebase.send(message);
      this.logger.log(`Push sent to ${userId}: ${messageId}`);
      return { success: true, messageId };
    } catch (error: any) {
      this.logger.error(`Push notification failed for user ${userId}: ${error.message}`);
      return { success: false };
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      const result = await this.mailer.sendMail({
        to,
        subject,
        html: body,
      });
      this.logger.log(`Email sent to ${to}: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      this.logger.error(`Email failed to ${to}: ${error.message}`);
      return { success: false };
    }
  }

  async sendSms(
    phone: string,
    message: string,
  ): Promise<{ success: boolean; sid?: string }> {
    try {
      if (!this.twilioClient) {
        this.logger.warn(`Twilio not configured, SMS to ${phone} skipped`);
        return { success: false };
      }

      const from = this.configService.get<string>('TWILIO_PHONE_NUMBER', '+1234567890');
      const result = await this.twilioClient.messages.create({
        body: message,
        from,
        to: phone,
      });
      this.logger.log(`SMS sent to ${phone}: ${result.sid}`);
      return { success: true, sid: result.sid };
    } catch (error: any) {
      this.logger.error(`SMS failed to ${phone}: ${error.message}`);
      return { success: false };
    }
  }

  async createNotification(
    userId: string,
    title: string,
    body: string,
    type: NotificationType = NotificationType.SYSTEM,
    channel: NotificationChannel = NotificationChannel.IN_APP,
    data?: Record<string, any>,
  ): Promise<NotificationEntity> {
    const notification = this.notificationRepo.create({
      userId,
      title,
      body,
      type,
      channel,
      data,
    });

    const saved = await this.notificationRepo.save(notification);

    if (channel === NotificationChannel.PUSH) {
      this.sendPushNotification(userId, title, body, data as Record<string, string>);
    }

    if (channel === NotificationChannel.EMAIL && data?.email) {
      this.sendEmail(data.email as string, title, body);
    }

    if (channel === NotificationChannel.SMS && data?.phone) {
      this.sendSms(data.phone as string, body);
    }

    return saved;
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationEntity> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'NOTIF_001',
          message: 'Notification not found',
        },
      });
    }

    if (notification.isRead) {
      return notification;
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepo.save(notification);
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    notifications: NotificationEntity[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const safePage = page || 1;
    const safeLimit = limit || 20;
    const skip = (safePage - 1) * safeLimit;

    const [notifications, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: safeLimit,
    });

    return {
      notifications,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
        hasNextPage: safePage * safeLimit < total,
        hasPreviousPage: safePage > 1,
      },
    };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async sendRideNotification(
    rideId: string,
    type: NotificationType,
    data: Record<string, any>,
  ): Promise<void> {
    const notificationMap: Record<NotificationType, { title: string; body: string }> = {
      [NotificationType.RIDE_REQUEST]: {
        title: 'New Ride Request',
        body: `A passenger wants to go from ${data.pickupLocation || 'pickup'} to ${data.dropoffLocation || 'dropoff'}`,
      },
      [NotificationType.RIDE_ACCEPTED]: {
        title: 'Ride Accepted',
        body: `Your driver ${data.driverName || ''} is on the way`,
      },
      [NotificationType.RIDE_STARTED]: {
        title: 'Ride Started',
        body: 'Your ride has started',
      },
      [NotificationType.RIDE_COMPLETED]: {
        title: 'Ride Completed',
        body: 'You have reached your destination',
      },
      [NotificationType.RIDE_CANCELLED]: {
        title: 'Ride Cancelled',
        body: data.reason ? `Ride cancelled: ${data.reason}` : 'Your ride has been cancelled',
      },
      [NotificationType.PAYMENT_RECEIVED]: {
        title: 'Payment Received',
        body: `Payment of ${data.amount || '0'} ${data.currency || ''} received`,
      },
      [NotificationType.PAYMENT_REFUND]: {
        title: 'Refund Processed',
        body: `Refund of ${data.amount || '0'} ${data.currency || ''} processed`,
      },
      [NotificationType.PROMOTION]: {
        title: data.title || 'Special Offer',
        body: data.body || 'Check out our latest offers',
      },
      [NotificationType.SYSTEM]: {
        title: data.title || 'Notification',
        body: data.body || '',
      },
      [NotificationType.ALERT]: {
        title: data.title || 'Alert',
        body: data.body || '',
      },
    };

    const template = notificationMap[type] || notificationMap[NotificationType.SYSTEM];

    const userIds: string[] = [];
    if (data.riderId) userIds.push(data.riderId);
    if (data.driverId) userIds.push(data.driverId);

    for (const userId of userIds) {
      await this.createNotification(
        userId,
        template.title,
        template.body,
        type,
        NotificationChannel.PUSH,
        { ...data, rideId },
      );
    }
  }
}
