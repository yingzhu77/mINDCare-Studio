import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

/**
 * 根路由控制器，处理健康检查等非业务路由
 */
@Controller()
export class AppController {
  constructor(private readonly config: ConfigService) {}

  @Get('health')
  health() {
    return { status: 'ok', env: this.config.appEnv };
  }
}
