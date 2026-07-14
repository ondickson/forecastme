import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
}

@Controller({
  path: 'health',
  version: '1',
})
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'forecastme-api',
      timestamp: new Date().toISOString(),
    };
  }
}
