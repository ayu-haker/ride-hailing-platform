export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  FREE_RIDE = 'free_ride',
  REFERRAL = 'referral',
}

export interface ICoupon {
  id: string;
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  maxUses: number;
  maxUsesPerUser: number;
  totalUses: number;
  applicableRideTypes?: string[];
  isActive: boolean;
  startsAt: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface IApplyCouponRequest {
  code: string;
  rideType: string;
  fareAmount: number;
  userId: string;
}

export interface ICouponValidationResult {
  isValid: boolean;
  discount: number;
  finalAmount: number;
  message?: string;
}
