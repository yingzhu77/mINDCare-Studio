import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * E2E 环境下跳过限流的 ThrottlerGuard
 * 当 THROTTLE_LIMIT 环境变量存在时，完全跳过限流检查
 */
@Injectable()
export class E2EThrottlerGuard extends ThrottlerGuard {
  canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.THROTTLE_LIMIT) {
      return Promise.resolve(true);
    }
    return super.canActivate(context);
  }
}
