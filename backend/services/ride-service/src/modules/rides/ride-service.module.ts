import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RideController } from './ride.controller';
import { RideService } from './ride.service';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { RideEntity } from './entities/ride.entity';
import { RideLocationEntity } from './entities/ride-location.entity';
import { PricingModule } from '../pricing/pricing.module';
import { MatchingModule } from '../matching/matching.module';
import { TrackingModule } from '../tracking/tracking.module';
import { getDatabaseConfig } from '../../config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    TypeOrmModule.forFeature([RideEntity, RideLocationEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET', 'super-secret-key'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    PricingModule,
    MatchingModule,
    TrackingModule,
  ],
  controllers: [RideController],
  providers: [RideService, JwtStrategy],
  exports: [RideService],
})
export class RideServiceModule {}
