import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ride_pricing')
export class RidePricingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ride_type', type: 'varchar', length: 20 })
  rideType: string;

  @Column({ name: 'base_fare', type: 'decimal', precision: 10, scale: 2 })
  baseFare: number;

  @Column({ name: 'per_km_rate', type: 'decimal', precision: 10, scale: 2 })
  perKmRate: number;

  @Column({ name: 'per_minute_rate', type: 'decimal', precision: 10, scale: 2 })
  perMinuteRate: number;

  @Column({ name: 'minimum_fare', type: 'decimal', precision: 10, scale: 2 })
  minimumFare: number;

  @Column({ name: 'cancellation_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  cancellationFee: number;

  @Column({ name: 'waiting_charge_per_min', type: 'decimal', precision: 10, scale: 2, default: 0 })
  waitingChargePerMin: number;

  @Column({ name: 'night_charge_multiplier', type: 'decimal', precision: 4, scale: 2, default: 1 })
  nightChargeMultiplier: number;

  @Column({ name: 'surge_multiplier', type: 'decimal', precision: 4, scale: 2, default: 1 })
  surgeMultiplier: number;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2, default: 20 })
  commissionRate: number;

  @Column({ name: 'service_tax_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  serviceTaxPercent: number;

  @Column({ name: 'gst_percent', type: 'decimal', precision: 5, scale: 2, default: 5 })
  gstPercent: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
