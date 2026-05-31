import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  REFUND = 'refund',
  BONUS = 'bonus',
  REFERRAL = 'referral',
  WITHDRAWAL = 'withdrawal',
  COMMISSION = 'commission',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'wallet_id', type: 'uuid' })
  @Index()
  walletId: string;

  @Column({ name: 'payment_id', type: 'uuid', nullable: true })
  @Index()
  paymentId?: string;

  @Column({ name: 'ride_id', type: 'uuid', nullable: true })
  @Index()
  rideId?: string;

  @Column({ name: 'withdrawal_id', type: 'uuid', nullable: true })
  @Index()
  withdrawalId?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'balance_before', type: 'decimal', precision: 12, scale: 2, default: 0 })
  balanceBefore: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 12, scale: 2, default: 0 })
  balanceAfter: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @Column({ length: 500, nullable: true })
  description?: string;

  @Column({ name: 'reference_id', length: 255, nullable: true })
  referenceId?: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
