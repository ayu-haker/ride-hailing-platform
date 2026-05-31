import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { DriverEntity } from './driver.entity';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [DriverController],
  providers: [DriverService, JwtStrategy],
  exports: [DriverService],
})
export class DriversModule {}
