export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  role: 'rider' | 'driver' | 'admin';
  isActive: boolean;
  isBlocked: boolean;
  createdAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string;
  phone: string;
  rating: number;
  totalRides: number;
  totalEarnings: number;
  walletBalance: number;
  status: 'online' | 'offline' | 'busy' | 'blocked';
  kycStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  isVerified: boolean;
  commissionRate: number;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  driverId: string;
  vehicleType: 'bike' | 'auto' | 'cab' | 'premium' | 'suv';
  registrationNumber: string;
  model: string;
  make: string;
  year: number;
  color?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
}

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  rideType: string;
  status: string;
  pickupAddress: string;
  dropoffAddress?: string;
  estimatedFare: number;
  actualFare?: number;
  paymentStatus: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  rideId: string;
  userId: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalDrivers: number;
  totalRides: number;
  totalRevenue: number;
  activeRides: number;
  pendingKyc: number;
  onlineDrivers: number;
  completionRate: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  usersToday: number;
  driversToday: number;
  ridesToday: number;
}

export interface KYC {
  id: string;
  driverId: string;
  kycType: string;
  documentNumber?: string;
  documentUrl: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'free_ride' | 'referral';
  value: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  maxUses: number;
  totalUses: number;
  isActive: boolean;
  startsAt: string;
  expiresAt?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string };
}
