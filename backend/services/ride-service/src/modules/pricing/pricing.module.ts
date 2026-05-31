import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingService } from './pricing.service';
import { RidePricingEntity } from './entities/pricing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RidePricingEntity])],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
