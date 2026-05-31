import { Module, Controller, Get, Post, Patch, Body, Param, Query, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';

@Controller()
@ApiTags('Ride')
export class RideController {
  private serviceUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.serviceUrl = this.configService.get<string>(
      'RIDE_SERVICE_URL',
      'http://ride-service:3000',
    );
  }

  @Post()
  @ApiOperation({ summary: 'Request a ride' })
  async create(@Body() body: any, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.serviceUrl}/rides`, body, { headers }),
    );
    return data;
  }

  @Get()
  @ApiOperation({ summary: 'List rides' })
  async findAll(@Query() query: any, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.serviceUrl}/rides`, { params: query, headers }),
    );
    return data;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ride by ID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.serviceUrl}/rides/${id}`, { headers }),
    );
    return data;
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a ride' })
  async cancel(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.patch(`${this.serviceUrl}/rides/${id}/cancel`, body, { headers }),
    );
    return data;
  }

  @Post(':id/rate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rate a ride' })
  async rate(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.serviceUrl}/rides/${id}/rate`, body, { headers }),
    );
    return data;
  }
}

@Module({
  imports: [HttpModule],
  controllers: [RideController],
  providers: [],
})
export class RideModule {}
