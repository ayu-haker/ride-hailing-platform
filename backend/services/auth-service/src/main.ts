import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';

async function bootstrap() {
  const logger = new Logger('AuthService');
  const app = await NestFactory.create(AuthModule);
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

  const port = configService.get<number>('AUTH_SERVICE_PORT', 3001);
  await app.listen(port);
  logger.log(`Auth Service running on port ${port}`);
}

bootstrap();
