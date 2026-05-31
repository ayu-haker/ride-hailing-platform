import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('drivers')
export class DriverEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  @Index()
  userId: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName?: string;

  @Column({ length: 15 })
  phone: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  rating: number;

  @Column({ name: 'rating_count', default: 0 })
  ratingCount: number;

  @Column({ name: 'total_rides', default: 0 })
  totalRides: number;

  @Column({ name: 'total_earnings', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ name: 'wallet_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  walletBalance: number;

  @Column({ type: 'varchar', length: 20, default: 'offline' })
  @Index()
  status: string;

  @Column({ name: 'kyc_status', type: 'varchar', length: 20, default: 'not_submitted' })
  kycStatus: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2, default: 20.0 })
  commissionRate: number;

  @Column({ name: 'current_latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLatitude?: number;

  @Column({ name: 'current_longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLongitude?: number;

  @Column({ name: 'last_heartbeat', type: 'timestamptz', nullable: true })
  lastHeartbeat?: Date;

  @Column({ name: 'incentive_earned', type: 'decimal', precision: 12, scale: 2, default: 0 })
  incentiveEarned: number;

  @Column({ name: 'acceptance_rate', type: 'decimal', precision: 5, scale: 2, default: 100 })
  acceptanceRate: number;

  @Column({ name: 'cancellation_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  cancellationRate: number;

  @Column({ name: 'online_duration_seconds', default: 0 })
  onlineDurationSeconds: number;

  @Column({ name: 'fcm_token', type: 'text', nullable: true })
  fcmToken?: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
