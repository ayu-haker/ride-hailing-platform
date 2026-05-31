import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverEntity } from './driver.entity';

@Injectable()
export class DriverService {
  private readonly logger = new Logger(DriverService.name);

  constructor(
    @InjectRepository(DriverEntity)
    private driverRepository: Repository<DriverEntity>,
  ) {}

  async findAll(page: any = 1, limit: any = 10, status?: string): Promise<{ items: DriverEntity[]; total: number; page: number; limit: number }> {
    const pg = Number(page) || 1;
    const lim = Number(limit) || 10;
    const qb = this.driverRepository.createQueryBuilder('driver');
    if (status) {
      qb.where('driver.status = :status', { status });
    }
    qb.skip((pg - 1) * lim).take(lim);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page: pg, limit: lim };
  }

  async findByUserId(userId: string): Promise<DriverEntity> {
    const driver = await this.driverRepository.findOne({ where: { userId } });
    if (!driver) {
      throw new NotFoundException({
        success: false,
        error: { code: 'DRV_001', message: 'Driver not found' },
      });
    }
    return driver;
  }

  async findById(id: string): Promise<DriverEntity> {
    const driver = await this.driverRepository.findOne({ where: { id } });
    if (!driver) {
      throw new NotFoundException({
        success: false,
        error: { code: 'DRV_001', message: 'Driver not found' },
      });
    }
    return driver;
  }

  async createDriverProfile(data: Partial<DriverEntity>): Promise<DriverEntity> {
    const driver = this.driverRepository.create(data);
    return this.driverRepository.save(driver);
  }

  async updateStatus(driverId: string, status: string): Promise<DriverEntity> {
    const driver = await this.findById(driverId);
    driver.status = status;
    if (status === 'online') {
      driver.lastHeartbeat = new Date();
    }
    return this.driverRepository.save(driver);
  }

  async updateLocation(
    driverId: string,
    latitude: number,
    longitude: number,
    speed?: number,
    heading?: number,
  ): Promise<void> {
    await this.driverRepository.update(driverId, {
      currentLatitude: latitude,
      currentLongitude: longitude,
      lastHeartbeat: new Date(),
    });
  }

  async getNearbyDrivers(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
    vehicleType?: string,
  ): Promise<DriverEntity[]> {
    return this.driverRepository
      .createQueryBuilder('driver')
      .where('driver.status = :status', { status: 'online' })
      .andWhere('driver.is_active = :isActive', { isActive: true })
      .andWhere('driver.is_verified = :verified', { verified: true })
      .getMany();
  }

  async toggleOnline(driverId: string): Promise<DriverEntity> {
    const driver = await this.findById(driverId);
    driver.status = driver.status === 'online' ? 'offline' : 'online';
    if (driver.status === 'online') {
      driver.lastHeartbeat = new Date();
    }
    return this.driverRepository.save(driver);
  }

  async getDriverDashboard(driverId: string) {
    const driver = await this.findById(driverId);
    return {
      todayEarnings: 0,
      weekEarnings: 0,
      monthEarnings: 0,
      todayRides: 0,
      weekRides: 0,
      monthRides: 0,
      acceptanceRate: Number(driver.acceptanceRate),
      cancellationRate: Number(driver.cancellationRate),
      rating: Number(driver.rating),
      onlineHours: Math.floor(driver.onlineDurationSeconds / 3600),
      walletBalance: Number(driver.walletBalance),
      totalEarnings: Number(driver.totalEarnings),
      totalRides: driver.totalRides,
      isOnline: driver.status === 'online',
    };
  }

  async getDriverEarnings(
    driverId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const driver = await this.findById(driverId);
    return {
      totalEarnings: Number(driver.totalEarnings),
      totalRides: driver.totalRides,
      incentiveEarned: Number(driver.incentiveEarned),
      walletBalance: Number(driver.walletBalance),
    };
  }
}
