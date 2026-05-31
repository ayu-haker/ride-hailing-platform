import { Module, Controller, Get, Post, Patch, Body, Param, Query, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';

@Controller()
@ApiTags('Driver')
export class DriverController {
  private serviceUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.serviceUrl = this.configService.get<string>(
      'DRIVER_SERVICE_URL',
      'http://driver-service:3000',
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all drivers' })
  async findAll(@Query() query: any, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.serviceUrl}/drivers`, { params: query, headers }),
    );
    return data;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get driver by ID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.serviceUrl}/drivers/${id}`, { headers }),
    );
    return data;
  }

  @Get(':id/earnings')
  @ApiOperation({ summary: 'Get driver earnings' })
  async earnings(@Param('id') id: string, @Query() query: any, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.serviceUrl}/drivers/${id}/earnings`, { params: query, headers }),
    );
    return data;
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update driver status' })
  async updateStatus(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.patch(`${this.serviceUrl}/drivers/${id}/status`, body, { headers }),
    );
    return data;
  }
}

@Module({
  imports: [HttpModule],
  controllers: [DriverController],
  providers: [],
})
export class DriverModule {}
