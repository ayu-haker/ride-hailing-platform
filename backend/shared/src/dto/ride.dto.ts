import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  Min,
  Max,
  IsObject,
  ValidateNested,
  IsBoolean,
  IsArray,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RideType } from '../interfaces';

export class LocationDto {
  @IsNumber() @Min(-90) @Max(90)
  latitude!: number;
  @IsNumber() @Min(-180) @Max(180)
  longitude!: number;
  @IsString() @IsOptional()
  address?: string;
  @IsString() @IsOptional()
  placeId?: string;
  @IsString() @IsOptional()
  city?: string;
  @IsString() @IsOptional()
  state?: string;
  @IsString() @IsOptional()
  pincode?: string;
}

export class EstimateFareDto {
  @ValidateNested() @Type(() => LocationDto)
  pickup!: LocationDto;
  @ValidateNested() @Type(() => LocationDto)
  dropoff!: LocationDto;
  @IsEnum(RideType)
  rideType!: RideType;
}

export class FareEstimateResponseDto {
  @IsNumber()
  estimatedFare!: number;
  @IsNumber()
  baseFare!: number;
  @IsNumber()
  distanceFare!: number;
  @IsNumber()
  timeFare!: number;
  @IsNumber()
  surgeMultiplier!: number;
  @IsNumber()
  estimatedDistance!: number;
  @IsNumber()
  estimatedDuration!: number;
  @IsArray()
  rideTypeEstimates!: Array<{ rideType: RideType; estimatedFare: number; estimatedDistance: number; estimatedDuration: number; surgeMultiplier: number }>;
}

export class BookRideDto {
  @ValidateNested() @Type(() => LocationDto)
  pickup!: LocationDto;
  @ValidateNested() @Type(() => LocationDto)
  dropoff!: LocationDto;
  @IsEnum(RideType)
  rideType!: RideType;
  @IsString() @IsOptional()
  couponCode?: string;
  @IsUUID() @IsOptional()
  driverId?: string;
  @IsBoolean() @IsOptional()
  isScheduled?: boolean;
  @IsString() @IsOptional()
  scheduledAt?: string;
}

export class RideResponseDto {
  @IsUUID()
  id!: string;
  @IsUUID()
  riderId!: string;
  @IsUUID() @IsOptional()
  driverId?: string;
  @IsEnum(RideType)
  rideType!: RideType;
  @IsString()
  status!: string;
  @IsObject()
  pickupLocation!: LocationDto;
  @IsObject() @IsOptional()
  dropoffLocation?: LocationDto;
  @IsNumber() @IsOptional()
  estimatedFare?: number;
  @IsNumber() @IsOptional()
  actualFare?: number;
  @IsObject() @IsOptional()
  driver?: any;
  @IsObject() @IsOptional()
  fareBreakdown?: any;
  createdAt!: Date;
}

export class UpdateRideStatusDto {
  @IsEnum(['driver_assigned', 'arrived', 'in_progress', 'completed', 'cancelled'])
  status!: string;
  @IsString() @IsOptional()
  cancellationReason?: string;
  @IsNumber() @IsOptional()
  actualDistance?: number;
  @IsNumber() @IsOptional()
  actualDuration?: number;
}

export class CancelRideDto {
  @IsString() @IsNotEmpty()
  cancellationReason!: string;
  @IsString() @IsOptional()
  cancelledBy?: string;
}

export class RateRideDto {
  @IsNumber() @Min(1) @Max(5)
  rating!: number;
  @IsString() @IsOptional() @MaxLength(500)
  comment?: string;
  @IsObject() @IsOptional()
  categories?: Record<string, number>;
}

export class NearbyDriversDto {
  @IsNumber() @Min(-90) @Max(90)
  latitude!: number;
  @IsNumber() @Min(-180) @Max(180)
  longitude!: number;
  @IsEnum(RideType) @IsOptional()
  rideType?: RideType;
  @IsNumber() @IsOptional() @Min(1) @Max(50)
  radiusKm?: number;
  @IsNumber() @IsOptional() @Min(1) @Max(50)
  limit?: number;
}
