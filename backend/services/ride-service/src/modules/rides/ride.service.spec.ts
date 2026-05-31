import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RideService } from './ride.service';
import { RideEntity } from './entities/ride.entity';
import { RideLocationEntity } from './entities/ride-location.entity';
import { PricingService } from '../pricing/pricing.service';
import { MatchingService } from '../matching/matching.service';
import { TrackingGateway } from '../tracking/tracking.gateway';

describe('RideService', () => {
  let service: RideService;

  const mockRide = {
    id: 'ride-uuid',
    riderId: 'rider-uuid',
    rideType: 'bike',
    status: 'pending',
    pickupLatitude: 19.0760,
    pickupLongitude: 72.8777,
    dropoffLatitude: 19.1150,
    dropoffLongitude: 72.9100,
    pickupAddress: 'BKC',
    dropoffAddress: 'Lower Parel',
    estimatedDistanceMeters: 5000,
    estimatedDurationSeconds: 600,
    estimatedFare: 85,
    finalFare: 85,
    baseFare: 15,
    distanceFare: 25,
    timeFare: 10,
    surgeMultiplier: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockPricingService = {
    calculateFare: jest.fn().mockResolvedValue({
      baseFare: 15,
      distanceFare: 25,
      timeFare: 10,
      surgeMultiplier: 1,
      finalFare: 85,
      serviceTax: 0,
      gst: 5,
    }),
  };

  const mockMatchingService = {
    findNearbyDrivers: jest.fn().mockResolvedValue([]),
    searchNearbyDrivers: jest.fn().mockResolvedValue([]),
  };

  const mockTrackingGateway = {
    broadcastRideUpdate: jest.fn(),
    broadcastSOSAlert: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RideService,
        { provide: getRepositoryToken(RideEntity), useValue: mockRepository },
        { provide: getRepositoryToken(RideLocationEntity), useValue: mockRepository },
        { provide: PricingService, useValue: mockPricingService },
        { provide: MatchingService, useValue: mockMatchingService },
        { provide: TrackingGateway, useValue: mockTrackingGateway },
      ],
    }).compile();

    service = module.get<RideService>(RideService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('estimateFare', () => {
    it('should return fare estimates for all ride types', async () => {
      const result = await service.estimateFare({
        pickup: { latitude: 19.0760, longitude: 72.8777 },
        dropoff: { latitude: 19.1150, longitude: 72.9100 },
        rideType: 'bike' as any,
      });

      expect(result).toBeDefined();
      expect(result.estimatedFare).toBeDefined();
      expect(result.rideTypeEstimates).toHaveLength(5);
    });
  });

  describe('bookRide', () => {
    it('should create a new ride', async () => {
      mockRepository.create.mockReturnValue(mockRide);
      mockRepository.save.mockResolvedValue(mockRide);

      const result = await service.bookRide('rider-uuid', {
        pickup: { latitude: 19.0760, longitude: 72.8777, address: 'BKC' },
        dropoff: { latitude: 19.1150, longitude: 72.9100, address: 'Lower Parel' },
        rideType: 'bike' as any,
      });

      expect(result).toBeDefined();
      expect(result.riderId).toBe('rider-uuid');
    });

    it('should throw error for too close locations', async () => {
      await expect(
        service.bookRide('rider-uuid', {
          pickup: { latitude: 19.0760, longitude: 72.8777 },
          dropoff: { latitude: 19.0761, longitude: 72.8778 },
          rideType: 'bike' as any,
        }),
      ).rejects.toThrow();
    });
  });

  describe('getRide', () => {
    it('should return ride by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockRide);
      const result = await service.getRide('ride-uuid');
      expect(result).toBeDefined();
      expect(result.id).toBe('ride-uuid');
    });

    it('should throw error for non-existent ride', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.getRide('invalid-id')).rejects.toThrow();
    });
  });

  describe('cancelRide', () => {
    it('should cancel a valid ride', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockRide, status: 'searching' });
      mockRepository.save.mockResolvedValue({ ...mockRide, status: 'cancelled' });

      const result = await service.cancelRide('ride-uuid', {
        cancellationReason: 'Changed mind',
        cancelledBy: 'rider',
      }, 'rider-uuid');

      expect(result).toBeDefined();
    });

    it('should throw error for already completed ride', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockRide, status: 'completed' });
      await expect(
        service.cancelRide('ride-uuid', { cancellationReason: 'test' }, 'rider-uuid'),
      ).rejects.toThrow();
    });
  });

  describe('triggerSOS', () => {
    it('should trigger SOS for a ride', async () => {
      mockRepository.findOne.mockResolvedValue(mockRide);
      mockRepository.save.mockResolvedValue({ ...mockRide, isSOSTriggered: true });

      await service.triggerSOS('ride-uuid');
      expect(mockTrackingGateway.broadcastSOSAlert).toHaveBeenCalled();
    });
  });
});
