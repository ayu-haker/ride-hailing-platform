import { Module, Controller, Get } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
      },
    };
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness probe' })
  ready() {
    return {
      success: true,
      data: { status: 'ready', timestamp: new Date().toISOString() },
    };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
