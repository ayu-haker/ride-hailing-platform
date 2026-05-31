import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboardStats() {
    const data = await this.adminService.getDashboardStats();
    return { success: true, data };
  }

  @Get('users')
  async getUserManagement(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.adminService.getUserManagement(
      page || 1,
      limit || 20,
      search,
      status,
    );
    return { success: true, data };
  }

  @Get('drivers')
  async getDriverManagement(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('kycStatus') kycStatus?: string,
  ) {
    const data = await this.adminService.getDriverManagement(
      page || 1,
      limit || 20,
      search,
      status,
      kycStatus,
    );
    return { success: true, data };
  }

  @Get('rides')
  async getRideMonitoring(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const data = await this.adminService.getRideMonitoring(
      page || 1,
      limit || 20,
      status,
    );
    return { success: true, data };
  }

  @Get('revenue')
  async getRevenueAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.adminService.getRevenueAnalytics(startDate, endDate);
    return { success: true, data };
  }

  @Put('drivers/:id/commission')
  async updateCommissionRate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { rate: number },
  ) {
    const data = await this.adminService.updateCommissionRate(id, body.rate);
    return { success: true, data };
  }

  @Put('drivers/:id/kyc')
  async processKYC(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { documentId: string; status: string; rejectionReason?: string },
  ) {
    const data = await this.adminService.processKYC(
      id,
      body.documentId,
      body.status,
      body.rejectionReason,
    );
    return { success: true, data };
  }

  @Post('coupons')
  @HttpCode(HttpStatus.CREATED)
  async createCoupon(@Body() body: any) {
    const data = await this.adminService.createCoupon(body);
    return { success: true, data };
  }

  @Put('coupons/:id')
  async updateCoupon(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    const data = await this.adminService.updateCoupon(id, body);
    return { success: true, data };
  }

  @Delete('coupons/:id')
  @HttpCode(HttpStatus.OK)
  async deleteCoupon(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.adminService.deleteCoupon(id);
    return { success: true, data };
  }

  @Get('coupons')
  async getCoupons(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.adminService.getCoupons(page || 1, limit || 20);
    return { success: true, data };
  }

  @Post('config')
  @HttpCode(HttpStatus.CREATED)
  async createSystemConfig(
    @Body() body: { key: string; value: string; description?: string },
  ) {
    const data = await this.adminService.createSystemConfig(
      body.key,
      body.value,
      body.description,
    );
    return { success: true, data };
  }

  @Get('config/:key')
  async getSystemConfig(@Param('key') key: string) {
    const data = await this.adminService.getSystemConfig(key);
    return { success: true, data };
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
  ) {
    const data = await this.adminService.getAuditLogs(
      page || 1,
      limit || 20,
      entityType,
      action,
    );
    return { success: true, data };
  }
}
