import { Module, Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';

@Controller()
@ApiTags('Admin')
export class AdminController {
  private serviceUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.serviceUrl = this.configService.get<string>(
      'ADMIN_SERVICE_URL',
      'http://admin-service:3000',
    );
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  async dashboard(@Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.serviceUrl}/admin/dashboard`, { headers }),
    );
    return data;
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users (admin)' })
  async listUsers(@Query() query: any, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.serviceUrl}/admin/users`, { params: query, headers }),
    );
    return data;
  }

  @Patch('users/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user status' })
  async updateUserStatus(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.patch(`${this.serviceUrl}/admin/users/${id}/status`, body, { headers }),
    );
    return data;
  }

  @Get('rides')
  @ApiOperation({ summary: 'List all rides (admin)' })
  async listRides(@Query() query: any, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.serviceUrl}/admin/rides`, { params: query, headers }),
    );
    return data;
  }
}

@Module({
  imports: [HttpModule],
  controllers: [AdminController],
  providers: [],
})
export class AdminModule {}
