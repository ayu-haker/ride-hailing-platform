export interface IGeoPoint {
  latitude: number;
  longitude: number;
}

export interface ILocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: Date;
}

export interface INearbySearchRequest {
  latitude: number;
  longitude: number;
  radiusKm: number;
  vehicleType?: string;
  limit?: number;
}

export interface IETAResponse {
  distanceMeters: number;
  durationSeconds: number;
  polyline?: string;
}

export interface IGeocodingResult {
  displayName: string;
  address: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

export interface IHeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  timeSlot: string;
}

export interface ICoordinates {
  latitude: number;
  longitude: number;
}
