import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger, Controller, Get } from '@nestjs/common';

@Controller()
class AppController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'user-service' };
  }
}

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
})
export class AppModule {}

async function bootstrap() {
  const logger = new Logger('UserService');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('USER_SERVICE_PORT', 3002);
  await app.listen(port);
  logger.log(`User service running on port ${port}`);
}
bootstrap();
