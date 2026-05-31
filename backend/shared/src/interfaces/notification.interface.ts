export enum NotificationType {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
}

export enum NotificationChannel {
  RIDE_UPDATE = 'ride_update',
  PROMOTION = 'promotion',
  PAYMENT = 'payment',
  KYC = 'kyc',
  SYSTEM = 'system',
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  type: NotificationType;
  channel: NotificationChannel;
  isRead: boolean;
  isSent: boolean;
  sentAt?: Date;
  readAt?: Date;
  imageUrl?: string;
  deepLink?: string;
  createdAt: Date;
}

export interface IPushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  fcmTokens: string[];
}

export interface ISendNotificationRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  type: NotificationType;
  channel: NotificationChannel;
  imageUrl?: string;
  deepLink?: string;
}
