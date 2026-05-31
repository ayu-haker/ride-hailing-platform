import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getUserNotifications(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const result = await this.notificationService.getUserNotifications(
      req.user.id,
      page,
      limit,
    );
    return { success: true, data: result };
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  async getUnreadCount(@Req() req: any) {
    const result = await this.notificationService.getUnreadCount(req.user.id);
    return { success: true, data: result };
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.notificationService.markAsRead(id, req.user.id);
    return { success: true, data: result };
  }

  @Post('test')
  @HttpCode(HttpStatus.CREATED)
  async sendTestNotification(
    @Req() req: any,
    @Body()
    body: {
      title: string;
      body: string;
      type?: string;
      channel?: string;
      data?: Record<string, any>;
    },
  ) {
    const result = await this.notificationService.createNotification(
      req.user.id,
      body.title,
      body.body,
      body.type as any,
      body.channel as any,
      body.data,
    );
    return { success: true, data: result };
  }
}
