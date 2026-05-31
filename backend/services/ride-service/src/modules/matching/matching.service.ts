import { Injectable, Logger } from '@nestjs/common';
import { NearbyDriversDto } from '@ride/shared';
import { haversineDistanceMeters, RIDE_CONSTANTS } from '@ride/shared';
import { RideEntity } from '../rides/entities/ride.entity';

export interface NearbyDriver {
  driverId: string;
  userId: string;
  firstName: string;
  vehicleType: string;
  vehicleNumber: string;
  vehicleModel: string;
  vehicleColor?: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  etaSeconds: number;
  rating: number;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  private nearbyDriversCache: Map<string, NearbyDriver[]> = new Map();

  async findNearbyDrivers(ride: RideEntity): Promise<NearbyDriver[]> {
    this.logger.log(`Searching drivers for ride ${ride.id}`);

    const drivers = await this.searchNearbyDrivers({
      latitude: Number(ride.pickupLatitude),
      longitude: Number(ride.pickupLongitude),
      rideType: ride.rideType as any,
      radiusKm: RIDE_CONSTANTS.SEARCH_RADIUS_KM,
      limit: 10,
    });

    if (drivers.length > 0) {
      this.logger.log(`Found ${drivers.length} nearby drivers for ride ${ride.id}`);
    } else {
      this.logger.warn(`No drivers found for ride ${ride.id}`);
    }

    return drivers;
  }

  async searchNearbyDrivers(dto: NearbyDriversDto): Promise<NearbyDriver[]> {
    const cacheKey = `${dto.latitude.toFixed(4)}_${dto.longitude.toFixed(4)}_${dto.rideType || 'all'}`;
    const cached = this.nearbyDriversCache.get(cacheKey);
    if (cached) return cached;

    const drivers = this.getMockNearbyDrivers(dto);
    this.nearbyDriversCache.set(cacheKey, drivers);
    setTimeout(() => this.nearbyDriversCache.delete(cacheKey), 10000);

    return drivers;
  }

  async assignDriver(rideId: string, driverId: string): Promise<boolean> {
    this.logger.log(`Assigning driver ${driverId} to ride ${rideId}`);
    return true;
  }

  private getMockNearbyDrivers(dto: NearbyDriversDto): NearbyDriver[] {
    const mockDrivers = [
      {
        driverId: 'd1', userId: 'u1', firstName: 'Rajesh',
        vehicleType: 'bike', vehicleNumber: 'MH-01-AB-1234',
        vehicleModel: 'Honda Activa', vehicleColor: 'Red',
        latitude: dto.latitude + 0.005, longitude: dto.longitude + 0.005,
        rating: 4.5,
      },
      {
        driverId: 'd2', userId: 'u2', firstName: 'Suresh',
        vehicleType: 'auto', vehicleNumber: 'MH-02-CD-5678',
        vehicleModel: 'Bajaj RE', vehicleColor: 'Green',
        latitude: dto.latitude - 0.008, longitude: dto.longitude + 0.003,
        rating: 4.2,
      },
      {
        driverId: 'd3', userId: 'u3', firstName: 'Amit',
        vehicleType: 'cab', vehicleNumber: 'MH-03-EF-9012',
        vehicleModel: 'Swift Dzire', vehicleColor: 'White',
        latitude: dto.latitude + 0.01, longitude: dto.longitude - 0.007,
        rating: 4.8,
      },
    ];

    return mockDrivers
      .filter((d) => !dto.rideType || d.vehicleType === dto.rideType)
      .map((d) => {
        const distance = haversineDistanceMeters(
          dto.latitude, dto.longitude,
          d.latitude, d.longitude,
        );
        const speedKmph = d.vehicleType === 'bike' ? 20 : 15;
        const eta = Math.ceil(distance / (speedKmph * 1000 / 3600));

        return {
          ...d,
          distanceMeters: Math.round(distance),
          etaSeconds: eta,
        };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
}
