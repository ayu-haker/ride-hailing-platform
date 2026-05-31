import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RidePricingEntity } from './entities/pricing.entity';

interface FareResult {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  waitingCharge: number;
  tollCharge: number;
  serviceTax: number;
  gst: number;
  finalFare: number;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    @InjectRepository(RidePricingEntity)
    private pricingRepository: Repository<RidePricingEntity>,
  ) {}

  async calculateFare(
    rideType: string,
    distanceMeters: number,
    durationSeconds: number,
    surgeMultiplier: number = 1.0,
  ): Promise<FareResult> {
    const pricing = await this.pricingRepository.findOne({
      where: { rideType: rideType as any, isActive: true },
    });

    const distanceKm = distanceMeters / 1000;
    const durationMin = durationSeconds / 60;

    const baseFare = pricing?.baseFare ?? this.getDefaultBaseFare(rideType);
    const perKmRate = pricing?.perKmRate ?? this.getDefaultPerKmRate(rideType);
    const perMinuteRate = pricing?.perMinuteRate ?? this.getDefaultPerMinRate(rideType);
    const serviceTaxPercent = pricing?.serviceTaxPercent ?? 0;
    const gstPercent = pricing?.gstPercent ?? 5;
    const nightMultiplier = this.isNightTime() ? (pricing?.nightChargeMultiplier ?? 1.25) : 1;

    const effectiveSurge = surgeMultiplier * nightMultiplier;

    const distanceFare = distanceKm * perKmRate;
    const timeFare = durationMin * perMinuteRate;
    const subtotal = baseFare + distanceFare + timeFare;
    const surgedAmount = subtotal * effectiveSurge;
    const serviceTax = surgedAmount * (serviceTaxPercent / 100);
    const gst = surgedAmount * (gstPercent / 100);
    const finalFare = surgedAmount + serviceTax + gst;

    return {
      baseFare: Math.round(baseFare * 100) / 100,
      distanceFare: Math.round(distanceFare * 100) / 100,
      timeFare: Math.round(timeFare * 100) / 100,
      surgeMultiplier: effectiveSurge,
      waitingCharge: 0,
      tollCharge: 0,
      serviceTax: Math.round(serviceTax * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      finalFare: Math.round(finalFare * 100) / 100,
    };
  }

  private isNightTime(): boolean {
    const hour = new Date().getHours();
    return hour >= 23 || hour < 5;
  }

  private getDefaultBaseFare(type: string): number {
    const fares: Record<string, number> = { bike: 15, auto: 25, cab: 40, premium: 80, suv: 120 };
    return fares[type] || 25;
  }

  private getDefaultPerKmRate(type: string): number {
    const fares: Record<string, number> = { bike: 5, auto: 8, cab: 12, premium: 20, suv: 25 };
    return fares[type] || 10;
  }

  private getDefaultPerMinRate(type: string): number {
    const fares: Record<string, number> = { bike: 1, auto: 1.5, cab: 2, premium: 3, suv: 4 };
    return fares[type] || 2;
  }
}
