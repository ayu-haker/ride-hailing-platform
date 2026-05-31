import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('wallets')
export class WalletEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true, unique: true })
  @Index()
  userId?: string;

  @Column({ name: 'driver_id', type: 'uuid', nullable: true, unique: true })
  @Index()
  driverId?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'total_credited', type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalCredited: number;

  @Column({ name: 'total_debited', type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalDebited: number;

  @Column({ name: 'total_withdrawn', type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalWithdrawn: number;

  @Column({ name: 'bonus_earned', type: 'decimal', precision: 12, scale: 2, default: 0 })
  bonusEarned: number;

  @Column({ name: 'referral_earned', type: 'decimal', precision: 12, scale: 2, default: 0 })
  referralEarned: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_transaction_at', type: 'timestamptz', nullable: true })
  lastTransactionAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
