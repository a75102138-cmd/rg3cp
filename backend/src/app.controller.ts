import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './modules/auth/decorators/public.decorator';
import { AppService } from './app.service';

/**
 * Minimal root controller — health-style endpoint until feature routes grow.
 */
@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Liveness probe' })
  getHealth() {
    return this.appService.getHealth();
  }
}
