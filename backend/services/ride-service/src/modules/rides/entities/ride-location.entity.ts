import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('ride_locations')
export class RideLocationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ride_id', type: 'uuid' })
  @Index()
  rideId: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  speed?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  heading?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  accuracy?: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  altitude?: number;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  timestamp: Date;
}
