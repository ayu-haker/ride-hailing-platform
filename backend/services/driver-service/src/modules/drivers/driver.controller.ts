import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Drivers')
@Controller('drivers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all drivers' })
  async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10, @Query('status') status?: string) {
    const drivers = await this.driverService.findAll(page, limit, status);
    return { success: true, data: drivers };
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get driver dashboard' })
  async dashboard(@Req() req: any) {
    const result = await this.driverService.getDriverDashboard(req.user.id);
    return { success: true, data: result };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get driver by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const driver = await this.driverService.findById(id);
    return { success: true, data: driver };
  }

  @Get(':id/earnings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get driver earnings' })
  async earnings(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.driverService.getDriverEarnings(id, startDate, endDate);
    return { success: true, data: result };
  }

  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create driver profile' })
  async createProfile(@Req() req: any, @Body() body: any) {
    const driver = await this.driverService.createDriverProfile({ ...body, userId: req.user.id });
    return { success: true, data: driver };
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update driver status' })
  async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: string) {
    const driver = await this.driverService.updateStatus(id, status);
    return { success: true, data: driver };
  }

  @Patch(':id/location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update driver location' })
  async updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
  ) {
    await this.driverService.updateLocation(id, latitude, longitude);
    return { success: true, message: 'Location updated' };
  }

  @Post(':id/toggle-online')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle driver online/offline status' })
  async toggleOnline(@Param('id', ParseUUIDPipe) id: string) {
    const driver = await this.driverService.toggleOnline(id);
    return { success: true, data: driver };
  }
}
