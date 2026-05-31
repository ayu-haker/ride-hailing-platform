import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WithdrawalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('withdrawal_requests')
export class WithdrawalRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'driver_id', type: 'uuid' })
  @Index()
  driverId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: WithdrawalStatus,
    default: WithdrawalStatus.PENDING,
  })
  status: WithdrawalStatus;

  @Column({ name: 'account_holder_name', length: 255 })
  accountHolderName: string;

  @Column({ name: 'account_number', length: 100 })
  accountNumber: string;

  @Column({ name: 'ifsc_code', length: 20 })
  ifscCode: string;

  @Column({ name: 'bank_name', length: 255 })
  bankName: string;

  @Column({ name: 'upi_id', length: 255, nullable: true })
  upiId?: string;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt?: Date;

  @Column({ name: 'processed_by', type: 'uuid', nullable: true })
  processedBy?: string;

  @Column({ name: 'rejection_reason', length: 500, nullable: true })
  rejectionReason?: string;

  @Column({ name: 'transaction_id', type: 'uuid', nullable: true })
  transactionId?: string;

  @Column({ name: 'reference_number', length: 255, nullable: true })
  referenceNumber?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
