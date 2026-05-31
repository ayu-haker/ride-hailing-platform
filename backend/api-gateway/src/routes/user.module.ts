import { Module, Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';

@Controller()
@ApiTags('User')
export class UserController {
  private serviceUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.serviceUrl = this.configService.get<string>(
      'USER_SERVICE_URL',
      'http://user-service:3002',
    );
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.serviceUrl}/users/profile`, { headers }),
    );
    return data;
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(@Body() body: any, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.patch(`${this.serviceUrl}/users/profile`, body, { headers }),
    );
    return data;
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  async findAll(@Query() query: any, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.serviceUrl}/users`, { params: query, headers }),
    );
    return data;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.serviceUrl}/users/${id}`, { headers }),
    );
    return data;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const headers = req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
    const { data } = await firstValueFrom(
      this.httpService.delete(`${this.serviceUrl}/users/${id}`, { headers }),
    );
    return data;
  }
}

@Module({
  imports: [HttpModule],
  controllers: [UserController],
  providers: [],
})
export class UserModule {}
