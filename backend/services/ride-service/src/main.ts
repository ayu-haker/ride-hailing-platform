import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RideServiceModule } from './modules/rides/ride-service.module';

async function bootstrap() {
  const logger = new Logger('RideService');
  const app = await NestFactory.create(RideServiceModule);
  const configService = app.get(ConfigService);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('RIDE_SERVICE_PORT', 3003);
  await app.listen(port);
  logger.log(`Ride Service running on port ${port}`);
}

bootstrap();
