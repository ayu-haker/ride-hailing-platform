import { Module, Controller, Get, Post, Put, Body, Param, Query, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller()
@ApiTags('Payment')
export class PaymentController {
  private serviceUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.serviceUrl = this.configService.get<string>(
      'PAYMENT_SERVICE_URL',
      'http://payment-service:3000',
    );
  }

  private headers(req: any) {
    return req.headers?.authorization ? { Authorization: req.headers.authorization } : {};
  }

  @Post('create-order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment order' })
  async createOrder(@Body() body: any, @Req() req: any) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.serviceUrl}/payments/create-order`, body, { headers: this.headers(req) }),
    );
    return data;
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify payment' })
  async verifyPayment(@Body() body: any, @Req() req: any) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.serviceUrl}/payments/verify`, body, { headers: this.headers(req) }),
    );
    return data;
  }

  @Post('refund/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process refund' })
  async refund(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.serviceUrl}/payments/refund/${id}`, body, { headers: this.headers(req) }),
    );
    return data;
  }

  @Get('wallet')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get wallet' })
  async getWallet(@Query() query: any, @Req() req: any) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.serviceUrl}/payments/wallet`, { params: query, headers: this.headers(req) }),
    );
    return data;
  }

  @Post('wallet/add')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add balance to wallet' })
  async addBalance(@Body() body: any, @Req() req: any) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.serviceUrl}/payments/wallet/add`, body, { headers: this.headers(req) }),
    );
    return data;
  }

  @Get('wallet/transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get wallet transactions' })
  async getTransactions(@Query() query: any, @Req() req: any) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.serviceUrl}/payments/wallet/transactions`, { params: query, headers: this.headers(req) }),
    );
    return data;
  }

  @Post('withdrawal')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create withdrawal request' })
  async createWithdrawal(@Body() body: any, @Req() req: any) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.serviceUrl}/payments/withdrawal`, body, { headers: this.headers(req) }),
    );
    return data;
  }

  @Put('withdrawal/:id/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process withdrawal request' })
  async processWithdrawal(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const { data } = await firstValueFrom(
      this.httpService.put(`${this.serviceUrl}/payments/withdrawal/${id}/process`, body, { headers: this.headers(req) }),
    );
    return data;
  }
}

@Module({
  imports: [HttpModule],
  controllers: [PaymentController],
  providers: [],
})
export class PaymentModule {}
