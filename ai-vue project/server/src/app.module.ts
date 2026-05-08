import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
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
import { AppController } from './app/app.controller';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [
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
