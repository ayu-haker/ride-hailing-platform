import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  CreatePaymentOrderDto,
  VerifyPaymentDto,
  AddBalanceDto,
  WithdrawalRequestDto,
  ProcessWithdrawalDto,
} from '@ride/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment order via Razorpay' })
  async createOrder(@Req() req: any, @Body() dto: CreatePaymentOrderDto) {
    const result = await this.paymentService.createPaymentOrder(dto, req.user.id);
    return { success: true, data: result };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Razorpay payment signature' })
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    const result = await this.paymentService.verifyPayment(dto);
    return { success: true, data: result };
  }

  @Post('refund/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process refund for a payment' })
  async refund(
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Body('amount') amount?: number,
    @Body('reason') reason?: string,
  ) {
    const result = await this.paymentService.processRefund(paymentId, amount, reason);
    return { success: true, data: result };
  }

  @Get('wallet')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get rider or driver wallet' })
  async getWallet(@Req() req: any, @Query('type') type?: string) {
    let result;
    if (type === 'driver') {
      result = await this.paymentService.getDriverWallet(req.user.id);
    } else {
      result = await this.paymentService.getRiderWallet(req.user.id);
    }
    return { success: true, data: result };
  }

  @Post('wallet/add')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add balance to wallet' })
  async addBalance(@Req() req: any, @Body() dto: AddBalanceDto) {
    let wallet = await this.paymentService.getRiderWallet(req.user.id);
    if (!wallet) {
      wallet = await this.paymentService.getDriverWallet(req.user.id);
    }
    const result = await this.paymentService.addBalance(
      wallet.id,
      dto.amount,
      dto.paymentMethod ? `Added via ${dto.paymentMethod}` : 'Wallet top-up',
    );
    return { success: true, data: result };
  }

  @Get('wallet/transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get wallet transaction history' })
  async getTransactions(
    @Req() req: any,
    @Query('walletId') walletId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const id = walletId || (await this.paymentService.getRiderWallet(req.user.id))?.id;
    const result = await this.paymentService.getTransactionHistory(id, page, limit);
    return { success: true, data: result };
  }

  @Post('withdrawal')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create withdrawal request' })
  async createWithdrawal(@Req() req: any, @Body() dto: WithdrawalRequestDto) {
    const result = await this.paymentService.createWithdrawalRequest(req.user.id, dto);
    return { success: true, data: result };
  }

  @Put('withdrawal/:id/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject withdrawal request' })
  async processWithdrawal(
    @Param('id', ParseUUIDPipe) withdrawalId: string,
    @Body() dto: ProcessWithdrawalDto,
  ) {
    const result = await this.paymentService.processWithdrawal(withdrawalId, dto);
    return { success: true, data: result };
  }
}
