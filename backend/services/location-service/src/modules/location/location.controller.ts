import {
  Controller,
  Get,
  Put,
  Query,
  Param,
  UseGuards,
  Body,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LocationService } from './location.service';

@Controller('location')
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Put('driver')
  @HttpCode(200)
  async updateDriverLocation(
    @Body() body: {
      driverId: string;
      latitude: number;
      longitude: number;
      speed: number;
      heading: number;
    },
  ) {
    return this.locationService.updateDriverLocation(
      body.driverId,
      body.latitude,
      body.longitude,
      body.speed,
      body.heading,
    );
  }

  @Get('driver/:driverId')
  async getDriverLocation(@Param('driverId') driverId: string) {
    return this.locationService.getDriverLocation(driverId);
  }

  @Get('nearby-drivers')
  async findNearbyDrivers(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radiusKm') radiusKm: number,
    @Query('vehicleType') vehicleType?: string,
    @Query('limit') limit?: number,
  ) {
    return this.locationService.findNearbyDrivers(
      latitude,
      longitude,
      radiusKm,
      vehicleType,
      limit,
    );
  }

  @Get('geocode/reverse')
  async reverseGeocode(
    @Query('lat') lat: number,
    @Query('lon') lon: number,
  ) {
    return this.locationService.reverseGeocode(lat, lon);
  }

  @Get('geocode/search')
  async searchPlaces(
    @Query('query') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.locationService.searchPlaces(query, limit);
  }

  @Get('route')
  async getRoutePolyline(
    @Query('originLat') originLat: number,
    @Query('originLon') originLon: number,
    @Query('destLat') destLat: number,
    @Query('destLon') destLon: number,
  ) {
    return this.locationService.getRoutePolyline(
      { lat: originLat, lon: originLon },
      { lat: destLat, lon: destLon },
    );
  }

  @Get('heatmap')
  async getHeatmapData(
    @Query('zoneId') zoneId: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.locationService.getHeatmapData(zoneId, startTime, endTime);
  }
}
