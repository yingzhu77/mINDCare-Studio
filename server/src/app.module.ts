import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { E2EThrottlerGuard } from './common/guards/e2e-throttler.guard';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { ChatModule } from './chat/chat.module';
import { EmotionDiaryModule } from './emotion-diary/emotion-diary.module';
import { AnalysisModule } from './analysis/analysis.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UploadModule } from './upload/upload.module';
import { AiModule } from './ai/ai.module';
import { ClientArticleModule } from './client-article/client-article.module';
import { NotificationModule } from './notification/notification.module';
import { AppController } from './app/app.controller';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{
        ttl: 60000,
        limit: process.env.THROTTLE_LIMIT ? Number(process.env.THROTTLE_LIMIT) : 120,
      }],
    }),
    ConfigModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    KnowledgeModule,
    ChatModule,
    EmotionDiaryModule,
    AnalysisModule,
    AnalyticsModule,
    UploadModule,
    AiModule,
    ClientArticleModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: E2EThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          transform: true,
          transformOptions: { enableImplicitConversion: true },
        }),
    },
  ],
})
export class AppModule {}
