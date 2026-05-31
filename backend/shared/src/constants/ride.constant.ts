export const RIDE_CONSTANTS = {
  SEARCH_RADIUS_KM: 5,
  MAX_SEARCH_RADIUS_KM: 20,
  SEARCH_TIMEOUT_SECONDS: 30,
  DRIVER_RESPONSE_TIMEOUT_SECONDS: 15,
  LOCATION_UPDATE_INTERVAL_MS: 5000,
  HEARTBEAT_INTERVAL_MS: 10000,
  NEARBY_DRIVER_CACHE_TTL_SECONDS: 10,
  RIDE_CACHE_TTL_SECONDS: 300,
  MAX_CANCELLATION_RATE: 20,
  MIN_ACCEPTANCE_RATE: 50,
  MIN_RATING: 4.0,
  SOS_NOTIFICATION_TIMEOUT_SECONDS: 30,
  FREE_WAITING_MINUTES: 5,
  MAX_WAITING_MINUTES: 15,
  WAITING_CHARGE_PER_MINUTE: 2,
  SURGE_THRESHOLD_MULTIPLIER: 1.5,
  PEAK_HOUR_MULTIPLIER: 1.2,
  NIGHT_CHARGE_MULTIPLIER: 1.25,
  NIGHT_CHARGE_START_HOUR: 23,
  NIGHT_CHARGE_END_HOUR: 5,
  COMMISSION_RATE: 20,
  MINIMUM_FARE: {
    BIKE: 10,
    AUTO: 15,
    CAB: 25,
    PREMIUM: 50,
    SUV: 75,
  },
  BASE_FARE: {
    BIKE: 15,
    AUTO: 25,
    CAB: 40,
    PREMIUM: 80,
    SUV: 120,
  },
  PER_KM_RATE: {
    BIKE: 5,
    AUTO: 8,
    CAB: 12,
    PREMIUM: 20,
    SUV: 25,
  },
  PER_MINUTE_RATE: {
    BIKE: 1,
    AUTO: 1.5,
    CAB: 2,
    PREMIUM: 3,
    SUV: 4,
  },
} as const;

export const RIDE_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['searching', 'cancelled'],
  searching: ['driver_assigned', 'cancelled'],
  driver_assigned: ['arrived', 'cancelled'],
  arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
  scheduled: ['searching', 'cancelled'],
};

export const SOS_CONTACTS_LIMIT = 5;
export const MAX_OTP_ATTEMPTS = 5;
export const OTP_EXPIRY_MINUTES = 5;
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;
export const ACCESS_TOKEN_EXPIRY_MINUTES = 15;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 30;
