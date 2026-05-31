import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as crypto from 'crypto';
import {
  ERROR_CODES,
  CreatePaymentOrderDto,
  VerifyPaymentDto,
  WithdrawalRequestDto,
  ProcessWithdrawalDto,
} from '@ride/shared';
import { RAZORPAY_CLIENT, RazorpayInstance } from './razorpay.provider';
import { PaymentEntity, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { WalletEntity } from './entities/wallet.entity';
import { TransactionEntity, TransactionType, TransactionStatus } from './entities/transaction.entity';
import {
  WithdrawalRequestEntity,
  WithdrawalStatus,
} from './entities/withdrawal-request.entity';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepo: Repository<WalletEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
    @InjectRepository(WithdrawalRequestEntity)
    private readonly withdrawalRepo: Repository<WithdrawalRequestEntity>,
    @Inject(RAZORPAY_CLIENT)
    private readonly razorpay: RazorpayInstance,
    private readonly dataSource: DataSource,
  ) {}

  async createPaymentOrder(dto: CreatePaymentOrderDto, userId: string) {
    const receipt = `rcpt_${dto.rideId}_${Date.now()}`;

    let razorpayOrder: any;
    try {
      razorpayOrder = await this.razorpay.orders.create({
        amount: Math.round(dto.amount * 100),
        currency: dto.currency || 'INR',
        receipt,
        notes: { rideId: dto.rideId, userId },
      });
    } catch (error: any) {
      this.logger.error(`Razorpay order creation failed: ${error.message}`, error.stack);
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.PAYMENT_FAILED,
          message: 'Failed to create payment order',
        },
      });
    }

    const payment = this.paymentRepo.create({
      rideId: dto.rideId,
      userId,
      amount: dto.amount,
      currency: dto.currency || 'INR',
      status: PaymentStatus.PENDING,
      razorpayOrderId: razorpayOrder.id,
      notes: dto.notes,
    });

    await this.paymentRepo.save(payment);

    return {
      orderId: razorpayOrder.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: dto.amount,
      currency: dto.currency || 'INR',
      receipt,
      paymentId: payment.id,
    };
  }

  async verifyPayment(dto: VerifyPaymentDto): Promise<any> {
    const payment = await this.paymentRepo.findOne({
      where: { rideId: dto.rideId, razorpayOrderId: dto.razorpayOrderId },
    });

    if (!payment) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.PAYMENT_INVALID,
          message: 'Payment record not found',
        },
      });
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new ConflictException({
        success: false,
        error: {
          code: ERROR_CODES.PAYMENT_INVALID,
          message: 'Payment already verified',
        },
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      payment.status = PaymentStatus.FAILED;
      payment.failedAt = new Date();
      payment.failureReason = 'Signature mismatch';
      await this.paymentRepo.save(payment);

      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.PAYMENT_VERIFICATION_FAILED,
          message: 'Payment signature verification failed',
        },
      });
    }

    payment.razorpayPaymentId = dto.razorpayPaymentId;
    payment.razorpaySignature = dto.razorpaySignature;
    payment.status = PaymentStatus.COMPLETED;
    payment.paymentMethod = PaymentMethod.RAZORPAY;
    payment.paidAt = new Date();
    await this.paymentRepo.save(payment);

    return {
      paymentId: payment.id,
      rideId: payment.rideId,
      amount: payment.amount,
      status: payment.status,
      paidAt: payment.paidAt,
    };
  }

  async processRefund(paymentId: string, amount?: number, reason?: string) {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });

    if (!payment) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.PAYMENT_INVALID,
          message: 'Payment record not found',
        },
      });
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new ConflictException({
        success: false,
        error: {
          code: ERROR_CODES.PAYMENT_INVALID,
          message: 'Payment already fully refunded',
        },
      });
    }

    const refundAmount = amount || payment.amount;
    if (refundAmount > Number(payment.amount) - Number(payment.refundAmount)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.PAYMENT_REFUND_FAILED,
          message: 'Refund amount exceeds remaining payable amount',
        },
      });
    }

    if (payment.razorpayPaymentId) {
      try {
        await this.razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: Math.round(refundAmount * 100),
          notes: { reason: reason || '' },
        });
      } catch (error: any) {
        this.logger.error(`Razorpay refund failed: ${error.message}`, error.stack);
        throw new BadRequestException({
          success: false,
          error: {
            code: ERROR_CODES.PAYMENT_REFUND_FAILED,
            message: 'Failed to process refund with payment gateway',
          },
        });
      }
    }

    payment.refundAmount = Number(payment.refundAmount) + refundAmount;
    payment.refundReason = reason;
    payment.refundedAt = new Date();

    if (Number(payment.refundAmount) >= Number(payment.amount)) {
      payment.status = PaymentStatus.REFUNDED;
    } else {
      payment.status = PaymentStatus.PARTIALLY_REFUNDED;
    }

    await this.paymentRepo.save(payment);

    return {
      paymentId: payment.id,
      refundAmount,
      totalRefunded: payment.refundAmount,
      status: payment.status,
      refundedAt: payment.refundedAt,
    };
  }

  async getRiderWallet(userId: string) {
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) {
      return this.createWalletForUser(userId);
    }
    return wallet;
  }

  async getDriverWallet(driverId: string) {
    const wallet = await this.walletRepo.findOne({ where: { driverId } });
    if (!wallet) {
      return this.createWalletForDriver(driverId);
    }
    return wallet;
  }

  private async createWalletForUser(userId: string): Promise<WalletEntity> {
    const existing = await this.walletRepo.findOne({ where: { userId } });
    if (existing) return existing;

    const wallet = this.walletRepo.create({ userId, balance: 0, currency: 'INR' });
    return this.walletRepo.save(wallet);
  }

  private async createWalletForDriver(driverId: string): Promise<WalletEntity> {
    const existing = await this.walletRepo.findOne({ where: { driverId } });
    if (existing) return existing;

    const wallet = this.walletRepo.create({ driverId, balance: 0, currency: 'INR' });
    return this.walletRepo.save(wallet);
  }

  async addBalance(walletId: string, amount: number, description?: string, metadata?: Record<string, any>) {
    const wallet = await this.walletRepo.findOne({ where: { id: walletId } });
    if (!wallet) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.WALLET_NOT_FOUND,
          message: 'Wallet not found',
        },
      });
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const prevBalance = Number(wallet.balance);
      const newBalance = prevBalance + amount;

      await queryRunner.manager.update(
        WalletEntity,
        { id: walletId },
        {
          balance: newBalance,
          totalCredited: Number(wallet.totalCredited) + amount,
          lastTransactionAt: new Date(),
        },
      );

      const transaction = queryRunner.manager.create(TransactionEntity, {
        walletId,
        amount,
        balanceBefore: prevBalance,
        balanceAfter: newBalance,
        type: TransactionType.CREDIT,
        status: TransactionStatus.COMPLETED,
        description: description || 'Wallet credit',
        metadata,
      });
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return {
        walletId: wallet.id,
        balance: newBalance,
        amount,
        type: 'credit',
        transactionId: transaction.id,
        description: description || 'Wallet credit',
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Add balance failed: ${error.message}`, error.stack);
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.WALLET_TRANSACTION_FAILED,
          message: 'Failed to add balance',
        },
      });
    } finally {
      await queryRunner.release();
    }
  }

  async deductBalance(walletId: string, amount: number, description?: string, metadata?: Record<string, any>) {
    const wallet = await this.walletRepo.findOne({ where: { id: walletId } });
    if (!wallet) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.WALLET_NOT_FOUND,
          message: 'Wallet not found',
        },
      });
    }

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.WALLET_INSUFFICIENT_BALANCE,
          message: 'Insufficient balance in wallet',
        },
      });
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const prevBalance = Number(wallet.balance);
      const newBalance = prevBalance - amount;

      await queryRunner.manager.update(
        WalletEntity,
        { id: walletId },
        {
          balance: newBalance,
          totalDebited: Number(wallet.totalDebited) + amount,
          lastTransactionAt: new Date(),
        },
      );

      const transaction = queryRunner.manager.create(TransactionEntity, {
        walletId,
        amount,
        balanceBefore: prevBalance,
        balanceAfter: newBalance,
        type: TransactionType.DEBIT,
        status: TransactionStatus.COMPLETED,
        description: description || 'Wallet debit',
        metadata,
      });
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return {
        walletId: wallet.id,
        balance: newBalance,
        amount,
        type: 'debit',
        transactionId: transaction.id,
        description: description || 'Wallet debit',
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Deduct balance failed: ${error.message}`, error.stack);
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.WALLET_TRANSACTION_FAILED,
          message: 'Failed to deduct balance',
        },
      });
    } finally {
      await queryRunner.release();
    }
  }

  async createWithdrawalRequest(driverId: string, dto: WithdrawalRequestDto) {
    const wallet = await this.walletRepo.findOne({ where: { driverId } });
    if (!wallet) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.WALLET_NOT_FOUND,
          message: 'Driver wallet not found',
        },
      });
    }

    if (Number(wallet.balance) < dto.amount) {
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.WALLET_INSUFFICIENT_BALANCE,
          message: 'Insufficient balance for withdrawal',
        },
      });
    }

    const pendingWithdrawals = await this.withdrawalRepo.count({
      where: { driverId, status: WithdrawalStatus.PENDING },
    });

    if (pendingWithdrawals > 0) {
      throw new ConflictException({
        success: false,
        error: {
          code: ERROR_CODES.WALLET_TRANSACTION_FAILED,
          message: 'A withdrawal request is already pending',
        },
      });
    }

    const withdrawal = this.withdrawalRepo.create({
      driverId,
      amount: dto.amount,
      status: WithdrawalStatus.PENDING,
      accountHolderName: dto.accountHolderName,
      accountNumber: dto.accountNumber,
      ifscCode: dto.ifscCode,
      bankName: dto.bankName,
      upiId: dto.upiId,
    });

    await this.withdrawalRepo.save(withdrawal);
    return withdrawal;
  }

  async processWithdrawal(withdrawalId: string, dto: ProcessWithdrawalDto) {
    const withdrawal = await this.withdrawalRepo.findOne({ where: { id: withdrawalId } });

    if (!withdrawal) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.WALLET_NOT_FOUND,
          message: 'Withdrawal request not found',
        },
      });
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new ConflictException({
        success: false,
        error: {
          code: ERROR_CODES.WALLET_TRANSACTION_FAILED,
          message: `Withdrawal already ${withdrawal.status}`,
        },
      });
    }

    if (dto.status === 'rejected') {
      withdrawal.status = WithdrawalStatus.REJECTED;
      withdrawal.rejectionReason = dto.rejectionReason || '';
      withdrawal.processedAt = new Date();
      await this.withdrawalRepo.save(withdrawal);

      return {
        withdrawalId: withdrawal.id,
        status: withdrawal.status,
        rejectionReason: withdrawal.rejectionReason,
        processedAt: withdrawal.processedAt,
      };
    }

    if (dto.status === 'approved') {
      const wallet = await this.walletRepo.findOne({ where: { driverId: withdrawal.driverId } });
      if (!wallet) {
        throw new NotFoundException({
          success: false,
          error: {
            code: ERROR_CODES.WALLET_NOT_FOUND,
            message: 'Driver wallet not found',
          },
        });
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const prevBalance = Number(wallet.balance);
        const withdrawalAmount = Number(withdrawal.amount);

        if (prevBalance < withdrawalAmount) {
          throw new BadRequestException({
            success: false,
            error: {
              code: ERROR_CODES.WALLET_INSUFFICIENT_BALANCE,
              message: 'Insufficient balance to process withdrawal',
            },
          });
        }

        const newBalance = prevBalance - withdrawalAmount;

        await queryRunner.manager.update(
          WalletEntity,
          { id: wallet.id },
          {
            balance: newBalance,
            totalDebited: Number(wallet.totalDebited) + withdrawalAmount,
            totalWithdrawn: Number(wallet.totalWithdrawn) + withdrawalAmount,
            lastTransactionAt: new Date(),
          },
        );

        const transaction = queryRunner.manager.create(TransactionEntity, {
          walletId: wallet.id,
          withdrawalId: withdrawal.id,
          amount: withdrawalAmount,
          balanceBefore: prevBalance,
          balanceAfter: newBalance,
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.COMPLETED,
          description: `Withdrawal to ${withdrawal.accountHolderName} - ${withdrawal.bankName}`,
        });
        await queryRunner.manager.save(transaction);

        withdrawal.status = WithdrawalStatus.APPROVED;
        withdrawal.processedAt = new Date();
        withdrawal.transactionId = transaction.id;
        await queryRunner.manager.save(withdrawal);

        await queryRunner.commitTransaction();

        return {
          withdrawalId: withdrawal.id,
          status: withdrawal.status,
          amount: withdrawalAmount,
          balance: newBalance,
          transactionId: transaction.id,
          processedAt: withdrawal.processedAt,
        };
      } catch (error: any) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`Withdrawal processing failed: ${error.message}`, error.stack);
        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    throw new BadRequestException({
      success: false,
      error: {
        code: ERROR_CODES.INVALID_INPUT,
        message: 'Invalid withdrawal status',
      },
    });
  }

  async getTransactionHistory(walletId: string, page: number = 1, limit: number = 20) {
    const wallet = await this.walletRepo.findOne({ where: { id: walletId } });
    if (!wallet) {
      throw new NotFoundException({
        success: false,
        error: {
          code: ERROR_CODES.WALLET_NOT_FOUND,
          message: 'Wallet not found',
        },
      });
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await this.transactionRepo.findAndCount({
      where: { walletId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }
}
