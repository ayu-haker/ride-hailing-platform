export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  WALLET = 'wallet',
  CASH = 'cash',
  CARD = 'card',
  UPI = 'upi',
  RAZORPAY = 'razorpay',
  COD = 'cod',
}

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  REFUND = 'refund',
  BONUS = 'bonus',
  REFERRAL = 'referral',
  WITHDRAWAL = 'withdrawal',
  COMMISSION = 'commission',
}

export interface IPayment {
  id: string;
  rideId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  refundAmount: number;
  paidAt?: Date;
  createdAt: Date;
}

export interface IWallet {
  id: string;
  userId?: string;
  driverId?: string;
  balance: number;
  totalCredited: number;
  totalDebited: number;
  totalWithdrawn: number;
  currency: string;
  isActive: boolean;
}

export interface ITransaction {
  id: string;
  walletId: string;
  rideId?: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  type: TransactionType;
  status: string;
  description?: string;
  createdAt: Date;
}
