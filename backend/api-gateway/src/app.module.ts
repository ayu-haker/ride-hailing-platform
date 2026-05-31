import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RouterModule } from '@nestjs/core';
import { AuthModule } from './routes/auth.module';
import { UserModule } from './routes/user.module';
import { RideModule } from './routes/ride.module';
import { DriverModule } from './routes/driver.module';
import { PaymentModule } from './routes/payment.module';
import { AdminModule } from './routes/admin.module';
import { LocationModule } from './routes/location.module';
import { HealthModule } from './routes/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),
    RouterModule.register([
      { path: 'auth', module: AuthModule },
      { path: 'users', module: UserModule },
      { path: 'rides', module: RideModule },
      { path: 'drivers', module: DriverModule },
      { path: 'payments', module: PaymentModule },
      { path: 'admin', module: AdminModule },
      { path: 'location', module: LocationModule },
    ]),
    AuthModule,
    UserModule,
    RideModule,
    DriverModule,
    PaymentModule,
    AdminModule,
    LocationModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
