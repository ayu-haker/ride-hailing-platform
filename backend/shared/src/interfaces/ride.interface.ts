import { VehicleType } from './driver.interface';

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

export interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
  placeId?: string;
}

export interface IFareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  waitingCharge: number;
  tollCharge: number;
  serviceTax: number;
  gst: number;
  discount: number;
  couponDiscount: number;
  finalFare: number;
}

export interface IRide {
  id: string;
  riderId: string;
  driverId?: string;
  vehicleId?: string;
  rideType: RideType;
  status: RideStatus;
  pickupLocation: ILocation;
  dropoffLocation?: ILocation;
  currentLocation?: ILocation;
  scheduledAt?: Date;
  startedAt?: Date;
  arrivedAt?: Date;
  pickedUpAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  estimatedDistanceMeters: number;
  actualDistanceMeters?: number;
  estimatedDurationSeconds: number;
  actualDurationSeconds?: number;
  estimatedFare: number;
  actualFare?: number;
  fareBreakdown?: IFareBreakdown;
  paymentStatus: string;
  paymentMethod?: string;
  isSOSTriggered: boolean;
  isRatedByRider: boolean;
  isRatedByDriver: boolean;
  riderRating?: number;
  driverRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface INearbyDriver {
  driverId: string;
  userId: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
  rating: number;
  vehicleType: VehicleType;
  vehicleNumber: string;
  vehicleModel: string;
  vehicleColor?: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  etaSeconds: number;
}
