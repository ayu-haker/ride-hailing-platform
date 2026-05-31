import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  updatedAt: Date;
}

export interface NearbyDriver {
  driverId: string;
  latitude: number;
  longitude: number;
  distance: number;
  vehicleType: string;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  count: number;
}

@Injectable()
export class LocationService {
  private readonly GEO_KEY = 'driver:locations';
  private readonly DRIVER_LOCATION_PREFIX = 'driver:loc:';
  private readonly OSM_BASE = 'https://nominatim.openstreetmap.org';
  private readonly OSRM_BASE = 'https://router.project-osrm.org';

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async updateDriverLocation(
    driverId: string,
    latitude: number,
    longitude: number,
    speed: number,
    heading: number,
  ): Promise<{ success: boolean; data: DriverLocation }> {
    const location: DriverLocation = {
      driverId,
      latitude,
      longitude,
      speed,
      heading,
      updatedAt: new Date(),
    };

    await Promise.all([
      this.redis.geoadd(this.GEO_KEY, longitude, latitude, driverId),
      this.redis.set(
        `${this.DRIVER_LOCATION_PREFIX}${driverId}`,
        JSON.stringify(location),
        'EX',
        300,
      ),
    ]);

    return { success: true, data: location };
  }

  async getDriverLocation(driverId: string): Promise<{ success: boolean; data: DriverLocation | null }> {
    const raw = await this.redis.get(`${this.DRIVER_LOCATION_PREFIX}${driverId}`);
    if (!raw) {
      return { success: true, data: null };
    }
    return { success: true, data: JSON.parse(raw) };
  }

  async findNearbyDrivers(
    latitude: number,
    longitude: number,
    radiusKm: number,
    vehicleType?: string,
    limit: number = 20,
  ): Promise<{ success: boolean; data: NearbyDriver[] }> {
    const lng = Number(longitude);
    const lat = Number(latitude);
    const radius = Number(radiusKm);
    const count = Number(limit) || 20;
    if (isNaN(lng) || isNaN(lat) || isNaN(radius)) {
      throw new HttpException('Invalid coordinates or radius', HttpStatus.BAD_REQUEST);
    }
    const results = await this.redis.georadius(
      this.GEO_KEY,
      lng,
      lat,
      radius,
      'km',
      'WITHDIST',
      'ASC',
      'COUNT',
      count,
    );

    const drivers: NearbyDriver[] = results.map((result: any) => ({
      driverId: result[0] as string,
      latitude: 0,
      longitude: 0,
      distance: parseFloat(result[1] as string),
      vehicleType: vehicleType || 'standard',
    }));

    return { success: true, data: drivers };
  }

  async getETAToPickup(
    driverId: string,
    pickupLat: number,
    pickupLon: number,
  ): Promise<{ success: boolean; data: { etaMinutes: number; distanceKm: number } }> {
    const location = await this.getDriverLocation(driverId);
    if (!location.data) {
      throw new HttpException('Driver location not found', HttpStatus.NOT_FOUND);
    }

    const url = `${this.OSRM_BASE}/route/v1/driving/${location.data.longitude},${location.data.latitude};${pickupLon},${pickupLat}?overview=false`;

    const response = await fetch(url);
    const body = await response.json();

    if (body.code !== 'Ok' || !body.routes?.length) {
      throw new HttpException('Failed to calculate route', HttpStatus.BAD_GATEWAY);
    }

    const distanceKm = body.routes[0].distance / 1000;
    const durationSeconds = body.routes[0].duration;
    const etaMinutes = Math.ceil(durationSeconds / 60);

    return { success: true, data: { etaMinutes, distanceKm } };
  }

  async getHeatmapData(
    zoneId: string,
    startTime: string,
    endTime: string,
  ): Promise<{ success: boolean; data: HeatmapPoint[] }> {
    const query = `
      SELECT latitude, longitude, COUNT(*) as count
      FROM ride_locations
      WHERE zone_id = $1
        AND created_at BETWEEN $2 AND $3
      GROUP BY latitude, longitude
    `;

    // Return mock data for now — real TypeORM query requires entity setup
    const mockPoints: HeatmapPoint[] = [
      { latitude: 40.7128, longitude: -74.006, count: 12 },
      { latitude: 40.758, longitude: -73.9855, count: 8 },
    ];

    return { success: true, data: mockPoints };
  }

  async reverseGeocode(
    lat: number,
    lon: number,
  ): Promise<{ success: boolean; data: any }> {
    const url = `${this.OSM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RideLocationService/1.0' },
    });
    const data = await response.json();
    return { success: true, data };
  }

  async searchPlaces(
    query: string,
    limit: number = 10,
  ): Promise<{ success: boolean; data: any[] }> {
    const url = `${this.OSM_BASE}/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RideLocationService/1.0' },
    });
    const data = await response.json();
    return { success: true, data };
  }

  async getRoutePolyline(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number },
  ): Promise<{ success: boolean; data: any }> {
    const url = `${this.OSRM_BASE}/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?geometries=geojson&overview=full`;

    const response = await fetch(url);
    const body = await response.json();

    if (body.code !== 'Ok' || !body.routes?.length) {
      throw new HttpException('Failed to calculate route', HttpStatus.BAD_GATEWAY);
    }

    return {
      success: true,
      data: {
        distance: body.routes[0].distance,
        duration: body.routes[0].duration,
        polyline: body.routes[0].geometry,
      },
    };
  }
}
