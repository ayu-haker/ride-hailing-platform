import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleType } from '../interfaces';

export class RegisterDriverDto {
  @IsString() @IsNotEmpty()
  firstName!: string;
  @IsString() @IsOptional()
  lastName?: string;
  @IsString() @IsNotEmpty()
  phone!: string;
  @IsString() @IsOptional()
  email?: string;
  @IsString() @IsOptional()
  avatarUrl?: string;
}

export class RegisterVehicleDto {
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;
  @IsString() @IsNotEmpty()
  registrationNumber!: string;
  @IsString() @IsNotEmpty()
  model!: string;
  @IsString() @IsNotEmpty()
  make!: string;
  @IsNumber() @Min(2000) @Max(2030)
  year!: number;
  @IsString() @IsOptional()
  color?: string;
  @IsString() @IsOptional()
  imageUrl?: string;
}

export class UpdateDriverLocationDto {
  @IsNumber() @Min(-90) @Max(90)
  latitude!: number;
  @IsNumber() @Min(-180) @Max(180)
  longitude!: number;
  @IsNumber() @IsOptional()
  speed?: number;
  @IsNumber() @IsOptional()
  heading?: number;
  @IsNumber() @IsOptional()
  accuracy?: number;
}

export class DriverStatusDto {
  @IsEnum(['online', 'offline'])
  status!: string;
}

export class UploadKYCDto {
  @IsEnum(['aadhar', 'pan', 'driving_license', 'rc', 'bank_account', 'photo'])
  kycType!: string;
  @IsString() @IsOptional()
  documentNumber?: string;
  @IsString() @IsNotEmpty()
  documentUrl!: string;
  @IsString() @IsOptional()
  backDocumentUrl?: string;
  @IsString() @IsOptional()
  selfieUrl?: string;
  @IsDateString() @IsOptional()
  expiresAt?: string;
}

export class DriverEarningsDto {
  @IsString() @IsOptional()
  startDate?: string;
  @IsString() @IsOptional()
  endDate?: string;
}

export class DriverEarningsResponseDto {
  @IsNumber()
  totalEarnings!: number;
  @IsNumber()
  totalRides!: number;
  @IsNumber()
  totalHours!: number;
  @IsNumber()
  totalDistance!: number;
  @IsNumber()
  averageRating!: number;
  @IsNumber()
  incentiveEarned!: number;
  @IsNumber()
  cashCollected!: number;
  dailyBreakdown!: Array<{ date: string; earnings: number; rides: number; hours: number; distance: number }>;
}

export class AcceptRideDto {
  @IsUUID()
  rideId!: string;
  @IsNumber() @IsOptional()
  etaToPickup?: number;
}

export class DriverDashboardDto {
  @IsNumber() todayEarnings!: number;
  @IsNumber() weekEarnings!: number;
  @IsNumber() monthEarnings!: number;
  @IsNumber() todayRides!: number;
  @IsNumber() weekRides!: number;
  @IsNumber() monthRides!: number;
  @IsNumber() acceptanceRate!: number;
  @IsNumber() cancellationRate!: number;
  @IsNumber() rating!: number;
  @IsNumber() onlineHours!: number;
  @IsNumber() walletBalance!: number;
  @IsBoolean() isOnline!: boolean;
}
