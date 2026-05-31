import { Module, Controller, Get, Put, Param, Query, Body, Req, HttpCode } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';

@Controller()
@ApiTags('Location')
export class LocationController {
  private locationServiceUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.locationServiceUrl = this.configService.get<string>(
      'LOCATION_SERVICE_URL',
      'http://location-service:3000',
    );
  }

  @Put('driver')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update driver location' })
  async updateDriverLocation(@Body() body: any, @Req() req: Request) {
    const headers: any = {};
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    const { data } = await firstValueFrom(
      this.httpService.put(`${this.locationServiceUrl}/location/driver`, body, { headers }),
    );
    return data;
  }

  @Get('driver/:driverId')
  @ApiOperation({ summary: 'Get driver location' })
  async getDriverLocation(@Param('driverId') driverId: string, @Req() req: Request) {
    const headers: any = {};
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.locationServiceUrl}/location/driver/${driverId}`, { headers }),
    );
    return data;
  }

  @Get('nearby-drivers')
  @ApiOperation({ summary: 'Find nearby drivers' })
  async findNearbyDrivers(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radiusKm') radiusKm: number,
    @Query('vehicleType') vehicleType: string,
    @Query('limit') limit: number,
    @Req() req: Request,
  ) {
    const headers: any = {};
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.locationServiceUrl}/location/nearby-drivers`, {
        params: { latitude, longitude, radiusKm, vehicleType, limit },
        headers,
      }),
    );
    return data;
  }

  @Get('geocode/reverse')
  @ApiOperation({ summary: 'Reverse geocode coordinates' })
  async reverseGeocode(@Query('lat') lat: number, @Query('lon') lon: number, @Req() req: Request) {
    const headers: any = {};
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.locationServiceUrl}/location/geocode/reverse`, {
        params: { lat, lon },
        headers,
      }),
    );
    return data;
  }

  @Get('geocode/search')
  @ApiOperation({ summary: 'Search places' })
  async searchPlaces(@Query('query') query: string, @Query('limit') limit: number, @Req() req: Request) {
    const headers: any = {};
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.locationServiceUrl}/location/geocode/search`, {
        params: { query, limit },
        headers,
      }),
    );
    return data;
  }

  @Get('route')
  @ApiOperation({ summary: 'Get route polyline' })
  async getRoutePolyline(
    @Query('originLat') originLat: number,
    @Query('originLon') originLon: number,
    @Query('destLat') destLat: number,
    @Query('destLon') destLon: number,
    @Req() req: Request,
  ) {
    const headers: any = {};
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.locationServiceUrl}/location/route`, {
        params: { originLat, originLon, destLat, destLon },
        headers,
      }),
    );
    return data;
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Get heatmap data' })
  async getHeatmapData(
    @Query('zoneId') zoneId: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Req() req: Request,
  ) {
    const headers: any = {};
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.locationServiceUrl}/location/heatmap`, {
        params: { zoneId, startTime, endTime },
        headers,
      }),
    );
    return data;
  }

}

@Module({
  imports: [HttpModule],
  controllers: [LocationController],
  providers: [],
})
export class LocationModule {}
