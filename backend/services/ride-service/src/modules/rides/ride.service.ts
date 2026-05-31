import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { RideEntity, RideStatus, RideType } from './entities/ride.entity';
import { RideLocationEntity } from './entities/ride-location.entity';
import {
  BookRideDto,
  EstimateFareDto,
  UpdateRideStatusDto,
  CancelRideDto,
  RateRideDto,
  NearbyDriversDto,
  FareEstimateResponseDto,
  RideResponseDto,
  haversineDistanceMeters,
  calculateETA,
  RIDE_CONSTANTS,
} from '@ride/shared';
import { PricingService } from '../pricing/pricing.service';
import { MatchingService } from '../matching/matching.service';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class RideService {
  private readonly logger = new Logger(RideService.name);

  constructor(
    @InjectRepository(RideEntity)
    private rideRepository: Repository<RideEntity>,
    @InjectRepository(RideLocationEntity)
    private rideLocationRepository: Repository<RideLocationEntity>,
    private pricingService: PricingService,
    private matchingService: MatchingService,
    @Inject(forwardRef(() => TrackingGateway))
    private trackingGateway: TrackingGateway,
  ) {}

  async estimateFare(dto: EstimateFareDto): Promise<FareEstimateResponseDto> {
    const distance = haversineDistanceMeters(
      dto.pickup.latitude,
      dto.pickup.longitude,
      dto.dropoff.latitude,
      dto.dropoff.longitude,
    );

    const duration = calculateETA(distance);

    const estimate = await this.pricingService.calculateFare(
      dto.rideType,
      distance,
      duration,
    );

    const allEstimates = await Promise.all(
      Object.values(RideType).map(async (type) => {
        const fare = await this.pricingService.calculateFare(type, distance, duration);
        return {
          rideType: type,
          estimatedFare: fare.finalFare,
          estimatedDistance: distance,
          estimatedDuration: duration,
          surgeMultiplier: fare.surgeMultiplier,
        };
      }),
    );

    return {
      estimatedFare: estimate.finalFare,
      baseFare: estimate.baseFare,
      distanceFare: estimate.distanceFare,
      timeFare: estimate.timeFare,
      surgeMultiplier: estimate.surgeMultiplier,
      estimatedDistance: distance,
      estimatedDuration: duration,
      rideTypeEstimates: allEstimates,
    };
  }

  async bookRide(riderId: string, dto: BookRideDto): Promise<RideResponseDto> {
    const distance = haversineDistanceMeters(
      dto.pickup.latitude,
      dto.pickup.longitude,
      dto.dropoff.latitude,
      dto.dropoff.longitude,
    );

    if (distance < 100) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VAL_002', message: 'Pickup and dropoff are too close' },
      });
    }

    const duration = calculateETA(distance);
    const fare = await this.pricingService.calculateFare(
      dto.rideType,
      distance,
      duration,
    );

    const ride = this.rideRepository.create({
      riderId,
      rideType: dto.rideType,
      status: RideStatus.SEARCHING,
      pickupAddress: dto.pickup.address || 'Pickup location',
      pickupLatitude: dto.pickup.latitude,
      pickupLongitude: dto.pickup.longitude,
      dropoffAddress: dto.dropoff.address || 'Dropoff location',
      dropoffLatitude: dto.dropoff.latitude,
      dropoffLongitude: dto.dropoff.longitude,
      estimatedDistanceMeters: distance,
      estimatedDurationSeconds: duration,
      estimatedFare: fare.finalFare,
      baseFare: fare.baseFare,
      distanceFare: fare.distanceFare,
      timeFare: fare.timeFare,
      surgeMultiplier: fare.surgeMultiplier,
      finalFare: fare.finalFare,
      isScheduled: dto.isScheduled || false,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      metadata: { fareBreakdown: fare },
    });

    const savedRide = await this.rideRepository.save(ride);

    this.matchingService.findNearbyDrivers(savedRide).catch((err) => {
      this.logger.error(`Driver matching failed: ${err.message}`);
    });

    return this.mapRideToResponse(savedRide);
  }

  async getRide(rideId: string): Promise<RideResponseDto> {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException({
        success: false,
        error: { code: 'RID_001', message: 'Ride not found' },
      });
    }
    return this.mapRideToResponse(ride);
  }

  async getUserRides(
    userId: string,
    role: 'rider' | 'driver',
    page: number = 1,
    limit: number = 10,
  ) {
    const column = role === 'rider' ? 'riderId' : 'driverId';
    const [rides, total] = await this.rideRepository.findAndCount({
      where: { [column]: userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: rides.map((r) => this.mapRideToResponse(r)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async updateRideStatus(
    rideId: string,
    dto: UpdateRideStatusDto,
    actorId: string,
  ): Promise<RideResponseDto> {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException({
        success: false,
        error: { code: 'RID_001', message: 'Ride not found' },
      });
    }

    const validTransitions: Record<string, string[]> = {
      searching: ['driver_assigned', 'cancelled'],
      driver_assigned: ['arrived', 'cancelled'],
      arrived: ['in_progress', 'cancelled'],
      in_progress: ['completed'],
    };

    const allowed = validTransitions[ride.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'RID_005',
          message: `Cannot transition from ${ride.status} to ${dto.status}`,
        },
      });
    }

    const updates: Partial<RideEntity> = { status: dto.status as RideStatus };

    switch (dto.status) {
      case 'driver_assigned':
        updates.driverId = actorId;
        updates.startedAt = new Date();
        break;
      case 'arrived':
        updates.arrivedAt = new Date();
        break;
      case 'in_progress':
        updates.pickedUpAt = new Date();
        break;
      case 'completed':
        updates.completedAt = new Date();
        updates.actualDistanceMeters = dto.actualDistance || ride.estimatedDistanceMeters;
        updates.actualDurationSeconds = dto.actualDuration || ride.estimatedDurationSeconds;
        updates.paymentStatus = 'completed';
        break;
    }

    await this.rideRepository.update(rideId, updates);
    const updated = await this.rideRepository.findOne({ where: { id: rideId } });

    if (updated) {
      this.trackingGateway.broadcastRideUpdate(updated);
    }

    return this.mapRideToResponse(updated!);
  }

  async cancelRide(
    rideId: string,
    dto: CancelRideDto,
    userId: string,
  ): Promise<RideResponseDto> {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException({
        success: false,
        error: { code: 'RID_001', message: 'Ride not found' },
      });
    }

    if (['completed', 'cancelled'].includes(ride.status)) {
      throw new BadRequestException({
        success: false,
        error: { code: 'RID_002', message: 'Ride cannot be cancelled' },
      });
    }

    ride.status = RideStatus.CANCELLED;
    ride.cancelledAt = new Date();
    ride.cancelledBy = dto.cancelledBy || userId;
    ride.cancellationReason = dto.cancellationReason;
    ride.paymentStatus = 'refunded';

    await this.rideRepository.save(ride);
    this.trackingGateway.broadcastRideUpdate(ride);

    return this.mapRideToResponse(ride);
  }

  async rateRide(
    rideId: string,
    dto: RateRideDto,
    userId: string,
    role: 'rider' | 'driver',
  ): Promise<void> {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException({
        success: false,
        error: { code: 'RID_001', message: 'Ride not found' },
      });
    }

    if (role === 'rider') {
      ride.riderRating = dto.rating;
      ride.isRatedByRider = true;
    } else {
      ride.driverRating = dto.rating;
      ride.isRatedByDriver = true;
    }

    await this.rideRepository.save(ride);
  }

  async triggerSOS(rideId: string): Promise<void> {
    const ride = await this.rideRepository.findOne({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException({
        success: false,
        error: { code: 'RID_001', message: 'Ride not found' },
      });
    }

    ride.isSOSTriggered = true;
    ride.sosTriggeredAt = new Date();
    await this.rideRepository.save(ride);

    this.trackingGateway.broadcastSOSAlert(ride);
  }

  async getActiveRide(userId: string): Promise<RideResponseDto | null> {
    const ride = await this.rideRepository.findOne({
      where: [
        { riderId: userId, status: RideStatus.SEARCHING },
        { riderId: userId, status: RideStatus.DRIVER_ASSIGNED },
        { riderId: userId, status: RideStatus.ARRIVED },
        { riderId: userId, status: RideStatus.IN_PROGRESS },
        { driverId: userId, status: RideStatus.DRIVER_ASSIGNED },
        { driverId: userId, status: RideStatus.ARRIVED },
        { driverId: userId, status: RideStatus.IN_PROGRESS },
      ],
    });

    return ride ? this.mapRideToResponse(ride) : null;
  }

  async getNearbyDrivers(dto: NearbyDriversDto) {
    return this.matchingService.searchNearbyDrivers(dto);
  }

  private mapRideToResponse(ride: RideEntity): RideResponseDto {
    return {
      id: ride.id,
      riderId: ride.riderId,
      driverId: ride.driverId,
      rideType: ride.rideType as any,
      status: ride.status,
      pickupLocation: {
        latitude: Number(ride.pickupLatitude),
        longitude: Number(ride.pickupLongitude),
        address: ride.pickupAddress,
      },
      dropoffLocation: ride.dropoffLatitude
        ? {
            latitude: Number(ride.dropoffLatitude),
            longitude: Number(ride.dropoffLongitude),
            address: ride.dropoffAddress,
          }
        : undefined,
      estimatedFare: Number(ride.estimatedFare),
      actualFare: ride.actualFare ? Number(ride.actualFare) : undefined,
      fareBreakdown: {
        baseFare: Number(ride.baseFare),
        distanceFare: Number(ride.distanceFare),
        timeFare: Number(ride.timeFare),
        surgeMultiplier: Number(ride.surgeMultiplier),
        waitingCharge: Number(ride.waitingCharge),
        tollCharge: Number(ride.tollCharge),
        serviceTax: Number(ride.serviceTax),
        gst: Number(ride.gst),
        discount: Number(ride.discountAmount),
        couponDiscount: Number(ride.couponDiscount),
        finalFare: Number(ride.finalFare),
      },
      createdAt: ride.createdAt,
    };
  }
}
