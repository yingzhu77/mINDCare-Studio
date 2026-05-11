import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('App (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // 与 main.ts 保持一致的全局配置
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('应返回服务健康状态', () => {
      return request(server)
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(res.body.data.status).toBe('ok');
        });
    });
  });

  describe('POST /api/user/login', () => {
    const validUser = { username: 'admin', password: 'admin123456' };

    it('应使用管理员账号成功登录', () => {
      return request(server)
        .post('/api/user/login')
        .send(validUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(res.body.data.token).toBeDefined();
          expect(res.body.data.user.role).toBe('admin');
        });
    });

    it('错误密码应返回 401', () => {
      return request(server)
        .post('/api/user/login')
        .send({ username: 'admin', password: 'wrong-password' })
        .expect(401)
        .expect((res) => {
          expect(res.body.code).toBe(401);
          expect(res.body.message).toContain('用户名或密码错误');
        });
    });
  });

  describe('Chat (user)', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(server)
        .post('/api/user/login')
        .send({ username: 'testuser', password: 'test123456' })
        .expect(201);
      token = res.body.data.token;
    });

    it('GET /chat/sessions/my 应返回用户会话列表（可能为空）', async () => {
      const res = await request(server)
        .get('/api/chat/sessions/my')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.data.records)).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('currentPage');
      expect(res.body.data).toHaveProperty('size');
    });

    it('GET /chat/sessions/my 未登录应返回 401', () => {
      return request(server)
        .get('/api/chat/sessions/my')
        .expect(401);
    });

    it('导出不存在的会话应返回 404', async () => {
      await request(server)
        .get('/api/chat/session/non-existent-session/export')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('删除不存在的会话应返回 404', async () => {
      await request(server)
        .delete('/api/chat/session/non-existent-session')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('DELETE /chat/session/:sessionId 非本人会话应返回 404', async () => {
      const adminRes = await request(server)
        .post('/api/user/login')
        .send({ username: 'admin', password: 'admin123456' })
        .expect(201);
      const adminToken = adminRes.body.data.token;

      await request(server)
        .delete('/api/chat/session/non-existent-session')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
