export enum DriverStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  BLOCKED = 'blocked',
}

export enum KYCStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum VehicleType {
  BIKE = 'bike',
  AUTO = 'auto',
  CAB = 'cab',
  SUV = 'suv',
  PREMIUM = 'premium',
}

export enum VehicleStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export interface IDriver {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  rating: number;
  ratingCount: number;
  totalRides: number;
  totalEarnings: number;
  walletBalance: number;
  status: DriverStatus;
  kycStatus: KYCStatus;
  isVerified: boolean;
  isActive: boolean;
  commissionRate: number;
  currentLatitude?: number;
  currentLongitude?: number;
  lastHeartbeat?: Date;
  incentiveEarned: number;
  acceptanceRate: number;
  cancellationRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVehicle {
  id: string;
  driverId: string;
  vehicleType: VehicleType;
  registrationNumber: string;
  model: string;
  make: string;
  year: number;
  color?: string;
  status: VehicleStatus;
  isActive: boolean;
}
