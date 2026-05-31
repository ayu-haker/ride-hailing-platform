import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

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

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ride_id', type: 'uuid' })
  @Index()
  rideId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId?: string;

  @Column({ name: 'driver_id', type: 'uuid', nullable: true })
  @Index()
  driverId?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod?: PaymentMethod;

  @Column({ name: 'razorpay_payment_id', length: 255, nullable: true })
  @Index()
  razorpayPaymentId?: string;

  @Column({ name: 'razorpay_order_id', length: 255, nullable: true })
  @Index()
  razorpayOrderId?: string;

  @Column({ name: 'razorpay_signature', length: 255, nullable: true })
  razorpaySignature?: string;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ name: 'refund_reason', length: 500, nullable: true })
  refundReason?: string;

  @Column({ name: 'refunded_at', type: 'timestamptz', nullable: true })
  refundedAt?: Date;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({ name: 'failed_at', type: 'timestamptz', nullable: true })
  failedAt?: Date;

  @Column({ name: 'failure_reason', length: 500, nullable: true })
  failureReason?: string;

  @Column({ name: 'invoice_url', length: 500, nullable: true })
  invoiceUrl?: string;

  @Column({ name: 'notes', type: 'jsonb', nullable: true })
  notes?: Record<string, string>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
