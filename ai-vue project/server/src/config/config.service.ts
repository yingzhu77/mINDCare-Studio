import { Injectable } from '@nestjs/common';

export type AppEnv = 'development' | 'production' | 'test';

/**
 * 环境配置服务，从 process.env 读取所有配置项
 */
@Injectable()
export class ConfigService {
  get appName(): string {
    return process.env.APP_NAME || 'AI Mental Health Admin API';
  }

  get appEnv(): AppEnv {
    return (process.env.APP_ENV as AppEnv) || 'development';
  }

  get port(): number {
    return parseInt(process.env.PORT || '8000', 10);
  }

  get databaseUrl(): string {
    return process.env.DATABASE_URL || 'file:./dev.db';
  }

  get jwtSecret(): string {
    return process.env.JWT_SECRET || 'dev-secret-change-me';
  }

  get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '1440m';
  }

  get adminUsername(): string {
    return process.env.ADMIN_USERNAME || 'admin';
  }

  get adminEmail(): string {
    return process.env.ADMIN_EMAIL || 'admin@example.com';
  }

  get adminPassword(): string {
    return process.env.ADMIN_PASSWORD || 'admin123456';
  }

  get deepseekApiKey(): string | undefined {
    return process.env.DEEPSEEK_API_KEY || undefined;
  }

  get deepseekBaseUrl(): string {
    return process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  }

  get deepseekModel(): string {
    return process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
  }

  get isMockAi(): boolean {
    return !this.deepseekApiKey;
  }
}
