import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminModule } from './modules/admin/admin.module';

async function bootstrap() {
  const logger = new Logger('AdminService');
  const app = await NestFactory.create(AdminModule);
  const configService = app.get(ConfigService);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = configService.get<number>('ADMIN_SERVICE_PORT', 3008);
  await app.listen(port);
  logger.log(`Admin Service running on port ${port}`);
}

bootstrap();
