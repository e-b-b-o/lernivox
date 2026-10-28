import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService, type HealthCheckResult } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check API service health and readiness' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy and accepting requests',
  })
  check(): HealthCheckResult {
    return this.healthService.getHealth();
  }
}
