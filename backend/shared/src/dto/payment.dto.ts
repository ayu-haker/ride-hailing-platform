import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  Min,
  IsObject,
} from 'class-validator';

export class CreatePaymentOrderDto {
  @IsUUID()
  rideId!: string;
  @IsNumber() @Min(1)
  amount!: number;
  @IsString() @IsOptional()
  currency?: string;
  @IsObject() @IsOptional()
  notes?: Record<string, string>;
}

export class CreatePaymentOrderResponseDto {
  @IsString() @IsNotEmpty()
  orderId!: string;
  @IsString() @IsNotEmpty()
  razorpayKey!: string;
  @IsNumber()
  amount!: number;
  @IsString()
  currency!: string;
  @IsString() @IsOptional()
  receipt?: string;
}

export class VerifyPaymentDto {
  @IsString() @IsNotEmpty()
  razorpayPaymentId!: string;
  @IsString() @IsNotEmpty()
  razorpayOrderId!: string;
  @IsString() @IsNotEmpty()
  razorpaySignature!: string;
  @IsUUID()
  rideId!: string;
}

export class WalletTransactionDto {
  @IsNumber() @Min(1)
  amount!: number;
  @IsString() @IsOptional()
  description?: string;
}

export class WithdrawalRequestDto {
  @IsNumber() @Min(1)
  amount!: number;
  @IsString() @IsNotEmpty()
  accountHolderName!: string;
  @IsString() @IsNotEmpty()
  accountNumber!: string;
  @IsString() @IsNotEmpty()
  ifscCode!: string;
  @IsString() @IsNotEmpty()
  bankName!: string;
  @IsString() @IsOptional()
  upiId?: string;
}

export class ProcessWithdrawalDto {
  @IsUUID()
  withdrawalId!: string;
  @IsString() @IsEnum(['approved', 'rejected'])
  status!: string;
  @IsString() @IsOptional()
  rejectionReason?: string;
}

export class AddBalanceDto {
  @IsNumber() @Min(1)
  amount!: number;
  @IsString() @IsOptional()
  paymentMethod?: string;
}
