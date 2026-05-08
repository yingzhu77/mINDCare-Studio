import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../config/config.service';

/**
 * JWT 认证守卫，兼容前端 token 请求头和标准 Authorization: Bearer
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('未提供认证令牌');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.jwtSecret,
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('认证令牌无效或已过期');
    }
  }

  private extractToken(request: any): string | null {
    // 兼容前端 token 头
    const tokenHeader = request.headers?.['token'];
    if (tokenHeader) return tokenHeader;

    // 标准 Authorization: Bearer <token>
    const authHeader = request.headers?.['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return null;
  }
}
