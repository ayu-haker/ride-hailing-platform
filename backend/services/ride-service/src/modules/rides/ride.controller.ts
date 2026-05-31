import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { RideService } from './ride.service';
import {
  BookRideDto,
  EstimateFareDto,
  UpdateRideStatusDto,
  CancelRideDto,
  RateRideDto,
  NearbyDriversDto,
} from '@ride/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Rides')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rides')
export class RideController {
  constructor(private readonly rideService: RideService) {}

  @Post('estimate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Estimate fare for a ride' })
  async estimateFare(@Body() dto: EstimateFareDto) {
    const result = await this.rideService.estimateFare(dto);
    return { success: true, data: result };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Book a new ride' })
  async bookRide(@Request() req: any, @Body() dto: BookRideDto) {
    const result = await this.rideService.bookRide(req.user.id, dto);
    return { success: true, data: result };
  }

  @Get('nearby-drivers')
  @ApiOperation({ summary: 'Get nearby available drivers' })
  async getNearbyDrivers(@Query() dto: NearbyDriversDto) {
    const result = await this.rideService.getNearbyDrivers(dto);
    return { success: true, data: result };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get current active ride' })
  async getActiveRide(@Request() req: any) {
    const result = await this.rideService.getActiveRide(req.user.id);
    return { success: true, data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Get user ride history' })
  async getUserRides(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const role = req.user.role === 'driver' ? 'driver' : 'rider';
    const result = await this.rideService.getUserRides(req.user.id, role, page || 1, limit || 10);
    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ride details' })
  async getRide(@Param('id') id: string) {
    const result = await this.rideService.getRide(id);
    return { success: true, data: result };
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update ride status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRideStatusDto,
    @Request() req: any,
  ) {
    const result = await this.rideService.updateRideStatus(id, dto, req.user.id);
    return { success: true, data: result };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a ride' })
  async cancelRide(
    @Param('id') id: string,
    @Body() dto: CancelRideDto,
    @Request() req: any,
  ) {
    const result = await this.rideService.cancelRide(id, dto, req.user.id);
    return { success: true, data: result };
  }

  @Post(':id/rate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rate a completed ride' })
  async rateRide(
    @Param('id') id: string,
    @Body() dto: RateRideDto,
    @Request() req: any,
  ) {
    await this.rideService.rateRide(id, dto, req.user.id, req.user.role);
    return { success: true, message: 'Rating submitted successfully' };
  }

  @Post(':id/sos')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger SOS for a ride' })
  async triggerSOS(@Param('id') id: string) {
    await this.rideService.triggerSOS(id);
    return { success: true, message: 'SOS alert sent' };
  }
}
