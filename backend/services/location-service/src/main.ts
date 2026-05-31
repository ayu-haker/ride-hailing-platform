import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocationModule } from './modules/location/location.module';

async function bootstrap() {
  const app = await NestFactory.create(LocationModule);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('LOCATION_SERVICE_PORT', 3007);
  await app.listen(port);
  logger.log(`Location service running on port ${port}`);
}

bootstrap();
