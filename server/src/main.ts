import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService);

  // 静态文件服务（上传文件）
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // CORS
  app.enableCors({
    origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token'],
  });

  // 全局前缀 /api 以兼容前端 Vite 代理路径
  // exclude health 使其同时保留 /health 无前缀路径
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Swagger /api/docs 挂载在全局前缀之后，即实际路径为 /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI 心理健康管理平台 API')
    .setDescription('NestJS 后端接口文档 — 管理端 + 用户端 + AI 分析')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'bearer',
    )
    .addApiKey(
      { type: 'apiKey', name: 'token', in: 'header', description: '备用 token 头（兼容旧客户端）' },
      'token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(config.port);
  console.log(`[${config.appName}] 启动成功: http://127.0.0.1:${config.port}`);
  console.log(`环境: ${config.appEnv}`);
  console.log(`Swagger: http://127.0.0.1:${config.port}/api/docs`);
  console.log(`AI Mock 模式: ${config.isMockAi ? '开启（未配置 DEEPSEEK_API_KEY）' : '关闭'}`);
}

bootstrap();
