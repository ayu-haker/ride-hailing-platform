import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RideStatus {
  PENDING = 'pending',
  SEARCHING = 'searching',
  DRIVER_ASSIGNED = 'driver_assigned',
  ARRIVED = 'arrived',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SCHEDULED = 'scheduled',
}

export enum RideType {
  BIKE = 'bike',
  AUTO = 'auto',
  CAB = 'cab',
  PREMIUM = 'premium',
  SUV = 'suv',
}

@Entity('rides')
export class RideEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'rider_id', type: 'uuid' })
  @Index()
  riderId: string;

  @Column({ name: 'driver_id', type: 'uuid', nullable: true })
  @Index()
  driverId?: string;

  @Column({ name: 'vehicle_id', type: 'uuid', nullable: true })
  vehicleId?: string;

  @Column({ name: 'ride_type', type: 'enum', enum: RideType })
  @Index()
  rideType: RideType;

  @Column({ type: 'enum', enum: RideStatus, default: RideStatus.PENDING })
  @Index()
  status: RideStatus;

  @Column({ name: 'pickup_address', type: 'text' })
  pickupAddress: string;

  @Column({ name: 'pickup_latitude', type: 'decimal', precision: 10, scale: 7 })
  pickupLatitude: number;

  @Column({ name: 'pickup_longitude', type: 'decimal', precision: 10, scale: 7 })
  pickupLongitude: number;

  @Column({ name: 'dropoff_address', type: 'text', nullable: true })
  dropoffAddress?: string;

  @Column({ name: 'dropoff_latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  dropoffLatitude?: number;

  @Column({ name: 'dropoff_longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  dropoffLongitude?: number;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  @Index()
  scheduledAt?: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'arrived_at', type: 'timestamptz', nullable: true })
  arrivedAt?: Date;

  @Column({ name: 'picked_up_at', type: 'timestamptz', nullable: true })
  pickedUpAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'cancelled_by', length: 20, nullable: true })
  cancelledBy?: string;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ name: 'estimated_distance_meters', type: 'decimal', precision: 10, scale: 2 })
  estimatedDistanceMeters: number;

  @Column({ name: 'actual_distance_meters', type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualDistanceMeters?: number;

  @Column({ name: 'estimated_duration_seconds', type: 'int' })
  estimatedDurationSeconds: number;

  @Column({ name: 'actual_duration_seconds', type: 'int', nullable: true })
  actualDurationSeconds?: number;

  @Column({ name: 'estimated_fare', type: 'decimal', precision: 10, scale: 2 })
  estimatedFare: number;

  @Column({ name: 'actual_fare', type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualFare?: number;

  @Column({ name: 'base_fare', type: 'decimal', precision: 10, scale: 2, nullable: true })
  baseFare?: number;

  @Column({ name: 'distance_fare', type: 'decimal', precision: 10, scale: 2, nullable: true })
  distanceFare?: number;

  @Column({ name: 'time_fare', type: 'decimal', precision: 10, scale: 2, nullable: true })
  timeFare?: number;

  @Column({ name: 'surge_multiplier', type: 'decimal', precision: 4, scale: 2, default: 1.0 })
  surgeMultiplier: number;

  @Column({ name: 'waiting_charge', type: 'decimal', precision: 10, scale: 2, default: 0 })
  waitingCharge: number;

  @Column({ name: 'toll_charge', type: 'decimal', precision: 10, scale: 2, default: 0 })
  tollCharge: number;

  @Column({ name: 'service_tax', type: 'decimal', precision: 10, scale: 2, default: 0 })
  serviceTax: number;

  @Column({ name: 'gst', type: 'decimal', precision: 10, scale: 2, default: 0 })
  gst: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'coupon_id', type: 'uuid', nullable: true })
  couponId?: string;

  @Column({ name: 'coupon_discount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  couponDiscount: number;

  @Column({ name: 'final_fare', type: 'decimal', precision: 10, scale: 2, nullable: true })
  finalFare?: number;

  @Column({ name: 'driver_commission', type: 'decimal', precision: 10, scale: 2, nullable: true })
  driverCommission?: number;

  @Column({ name: 'driver_payout', type: 'decimal', precision: 10, scale: 2, nullable: true })
  driverPayout?: number;

  @Column({ name: 'payment_status', length: 20, default: 'pending' })
  paymentStatus: string;

  @Column({ name: 'payment_method', length: 20, nullable: true })
  paymentMethod?: string;

  @Column({ name: 'is_sos_triggered', default: false })
  isSOSTriggered: boolean;

  @Column({ name: 'sos_triggered_at', type: 'timestamptz', nullable: true })
  sosTriggeredAt?: Date;

  @Column({ name: 'is_rated_by_rider', default: false })
  isRatedByRider: boolean;

  @Column({ name: 'is_rated_by_driver', default: false })
  isRatedByDriver: boolean;

  @Column({ name: 'rider_rating', type: 'int', nullable: true })
  riderRating?: number;

  @Column({ name: 'driver_rating', type: 'int', nullable: true })
  driverRating?: number;

  @Column({ name: 'is_scheduled', default: false })
  isScheduled: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
