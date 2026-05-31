import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsUrl,
  MaxLength,
  MinLength,
  IsUUID,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString() @IsOptional() @MinLength(2) @MaxLength(50)
  firstName?: string;
  @IsString() @IsOptional() @MaxLength(50)
  lastName?: string;
  @IsEmail() @IsOptional()
  email?: string;
  @IsUrl() @IsOptional()
  avatarUrl?: string;
  @IsString() @IsOptional()
  preferredLanguage?: string;
  @IsBoolean() @IsOptional()
  darkMode?: boolean;
}

export class UserProfileResponseDto {
  @IsUUID()
  id!: string;
  @IsString()
  phone!: string;
  @IsString()
  firstName!: string;
  @IsString() @IsOptional()
  lastName?: string;
  @IsString() @IsOptional()
  email?: string;
  @IsString() @IsOptional()
  avatarUrl?: string;
  @IsString()
  role!: string;
  @IsBoolean()
  isPhoneVerified!: boolean;
  @IsBoolean()
  isEmailVerified!: boolean;
  @IsString() @IsOptional()
  referralCode?: string;
  @IsString()
  preferredLanguage!: string;
  @IsBoolean()
  darkMode!: boolean;
  @IsNumber()
  walletBalance!: number;
  createdAt!: Date;
}

export class UpdateFcmTokenDto {
  @IsString() @IsNotEmpty()
  fcmToken!: string;
  @IsString() @IsOptional()
  deviceId?: string;
  @IsString() @IsOptional()
  deviceType?: string;
  @IsString() @IsOptional()
  appVersion?: string;
}

export class AddressDto {
  @IsString() @IsNotEmpty()
  label!: string;
  @IsString() @IsNotEmpty()
  address!: string;
  @IsNumber()
  latitude!: number;
  @IsNumber()
  longitude!: number;
  @IsString() @IsOptional()
  placeId?: string;
  @IsString() @IsOptional()
  city?: string;
  @IsString() @IsOptional()
  state?: string;
  @IsString() @IsOptional()
  pincode?: string;
  @IsBoolean() @IsOptional()
  isDefault?: boolean;
}
