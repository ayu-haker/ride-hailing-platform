import { Module, Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';

@Controller()
@ApiTags('Authentication')
export class AuthController {
  private authServiceUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>(
      'AUTH_SERVICE_URL',
      'http://auth-service:3000',
    );
  }

  @Post('send-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  @ApiBody({ schema: { properties: { phone: { type: 'string' } } } })
  async sendOtp(@Body() body: any) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/auth/send-otp`, body),
    );
    return data;
  }

  @Get('dev-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get dev OTP (development only)' })
  async devOtp(@Query('phone') phone: string) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.authServiceUrl}/auth/dev-otp`, { params: { phone } }),
    );
    return data;
  }

  @Post('verify-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP' })
  async verifyOtp(@Body() body: any) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/auth/verify-otp`, body),
    );
    return data;
  }

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  async register(@Body() body: any) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/auth/register`, body),
    );
    return data;
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone and password' })
  async login(@Body() body: any) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/auth/login`, body),
    );
    return data;
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() body: any) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/auth/refresh`, body),
    );
    return data;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Body() body: any) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/auth/logout`, body),
    );
    return data;
  }
}

@Module({
  imports: [HttpModule],
  controllers: [AuthController],
  providers: [],
})
export class AuthModule {}
