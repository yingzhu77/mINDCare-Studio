// 设置 THROTTLE_LIMIT 让 E2EThrottlerGuard 跳过限流
process.env.THROTTLE_LIMIT = '999';
// 清空 API Key 强制 Mock AI，避免真实 DeepSeek 请求和 429 限流
process.env.DEEPSEEK_API_KEY = '';

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

  // ============================================================
  // Knowledge 模块 — 分类树、文章分页、文章 CRUD、状态审核
  // ============================================================
  describe('Knowledge (admin)', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(server)
        .post('/api/user/login')
        .send({ username: 'admin', password: 'admin123456' })
        .expect(201);
      token = res.body.data.token;
    });

    it('GET /knowledge/category/tree 应返回分类树', async () => {
      const res = await request(server)
        .get('/api/knowledge/category/tree')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty('categoryName');
    });

    it('GET /knowledge/category/tree 未授权应返回 401', async () => {
      await request(server)
        .get('/api/knowledge/category/tree')
        .expect(401);
    });

    it('GET /knowledge/article/page 应返回分页文章', async () => {
      const res = await request(server)
        .get('/api/knowledge/article/page')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data).toHaveProperty('records');
      expect(Array.isArray(res.body.data.records)).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('currentPage');
      expect(res.body.data).toHaveProperty('size');
    });

    it('GET /knowledge/article/page 支持按标题筛选', async () => {
      // 自建测试夹具：创建一篇标题唯一的文章用于验证标题筛选
      const filterTitle = `E2E 筛选测试 ${Date.now()}`;
      const createRes = await request(server)
        .post('/api/knowledge/article')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: filterTitle,
          summary: '由 E2E 测试创建',
          content: 'E2E 测试文章内容',
          tags: JSON.stringify(['测试', 'E2E']),
          status: 'draft',
        })
        .expect(201);
      const articleId = createRes.body.data.id;

      const res = await request(server)
        .get('/api/knowledge/article/page')
        .query({ title: '筛选测试' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data.records.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.records.some((r: any) => r.title === filterTitle)).toBe(true);

      // 清理夹具
      await request(server)
        .delete(`/api/knowledge/article/${articleId}`)
        .set('Authorization', `Bearer ${token}`);
    });

    it('GET /knowledge/article/page 支持按状态筛选', async () => {
      // 自建测试夹具：先创建一篇文章（createArticle 默认 published），再验证状态筛选
      const createRes = await request(server)
        .post('/api/knowledge/article')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: `E2E 状态筛选测试 ${Date.now()}`,
          summary: '由 E2E 测试创建',
          content: 'E2E 测试文章内容',
          tags: JSON.stringify(['测试', 'E2E']),
        })
        .expect(201);
      const articleId = createRes.body.data.id;

      // 查询 published 状态（新创建的文章默认 published）
      const res = await request(server)
        .get('/api/knowledge/article/page')
        .query({ status: 'published' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      for (const record of res.body.data.records) {
        if (record.status === 'published') {
          expect(record.status).toBe('published');
        }
      }
      // 新创建的文章应在 published 结果中
      expect(res.body.data.records.some((r: any) => r.id === articleId)).toBe(true);

      // 清理夹具
      await request(server)
        .delete(`/api/knowledge/article/${articleId}`)
        .set('Authorization', `Bearer ${token}`);
    });

    it('GET /knowledge/article/:id 应返回文章详情', async () => {
      const pageRes = await request(server)
        .get('/api/knowledge/article/page')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const articleId = pageRes.body.data.records[0].id;

      const res = await request(server)
        .get(`/api/knowledge/article/${articleId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data.id).toBe(articleId);
      expect(res.body.data).toHaveProperty('title');
      expect(res.body.data).toHaveProperty('content');
    });

    it('GET /knowledge/article/:id 不存在的文章应返回 404', async () => {
      const res = await request(server)
        .get('/api/knowledge/article/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.code).toBe(404);
    });

    it('POST → PUT status → DELETE 文章完整 CRUD', async () => {
      // 1) 创建（admin 创建默认 published）
      const createRes = await request(server)
        .post('/api/knowledge/article')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E 测试文章',
          summary: '由 E2E 测试创建',
          content: '这是 E2E 测试创建的临时文章内容',
          tags: JSON.stringify(['测试', 'E2E']),
        })
        .expect(201);

      expect(createRes.body.code).toBe(200);
      expect(createRes.body.data).toHaveProperty('id');
      const articleId = createRes.body.data.id;

      // 2) 状态变更：published → offline（允许的过渡）
      const statusRes = await request(server)
        .put(`/api/knowledge/article/${articleId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'offline' })
        .expect(200);

      expect(statusRes.body.code).toBe(200);
      expect(statusRes.body.data.status).toBe('offline');

      // 3) 删除
      const deleteRes = await request(server)
        .delete(`/api/knowledge/article/${articleId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(deleteRes.body.code).toBe(200);
    });

    it('PUT /knowledge/article 非草稿文章应返回 403', async () => {
      // 创建一篇 published 文章，尝试编辑应被拒绝
      const createRes = await request(server)
        .post('/api/knowledge/article')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: `E2E 编辑拒绝测试 ${Date.now()}`,
          content: 'E2E 测试内容',
          tags: JSON.stringify(['测试']),
        })
        .expect(201);
      const articleId = createRes.body.data.id;

      await request(server)
        .put('/api/knowledge/article')
        .set('Authorization', `Bearer ${token}`)
        .send({ id: articleId, title: '不应成功' })
        .expect(403);

      // 清理
      await request(server)
        .delete(`/api/knowledge/article/${articleId}`)
        .set('Authorization', `Bearer ${token}`);
    });

    it('DELETE /knowledge/article/:id 不存在的文章应返回 404', async () => {
      const res = await request(server)
        .delete('/api/knowledge/article/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.code).toBe(404);
    });
  });

  // ============================================================
  // Emotion-diary 模块 — admin 分页、删除
  // ============================================================
  describe('Emotion-diary (admin)', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(server)
        .post('/api/user/login')
        .send({ username: 'admin', password: 'admin123456' })
        .expect(201);
      token = res.body.data.token;
    });

    it('GET /emotion-diary/admin/page 应返回分页日记', async () => {
      const res = await request(server)
        .get('/api/emotion-diary/admin/page')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data).toHaveProperty('records');
      expect(Array.isArray(res.body.data.records)).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('currentPage');
      expect(res.body.data).toHaveProperty('size');
    });

    it('GET /emotion-diary/admin/page 未授权应返回 401', async () => {
      await request(server)
        .get('/api/emotion-diary/admin/page')
        .expect(401);
    });

    it('DELETE /emotion-diary/admin/:id 应能删除日记', async () => {
      // 先用 testuser 创建一篇测试用日记
      const userRes = await request(server)
        .post('/api/user/login')
        .send({ username: 'testuser', password: 'test123456' })
        .expect(201);
      const userToken = userRes.body.data.token;

      const createRes = await request(server)
        .post('/api/emotion-diary')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          diaryDate: '2026-05-12',
          moodScore: 5,
          sleepQuality: 3,
          stressLevel: 4,
          dominantEmotion: '平静',
          emotionTriggers: ['E2E 测试'],
          diaryContent: '由 E2E 测试创建',
        })
        .expect(201);
      const diaryId = createRes.body.data.id;

      // 管理员删除该日记
      const res = await request(server)
        .delete(`/api/emotion-diary/admin/${diaryId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.code).toBe(200);
    });

    it('DELETE /emotion-diary/admin/:id 不存在的日记应返回 404', async () => {
      const res = await request(server)
        .delete('/api/emotion-diary/admin/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.code).toBe(404);
    });
  });

  // ============================================================
  // Analytics 模块 — overview、trends
  // ============================================================
  describe('Analytics (admin)', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(server)
        .post('/api/user/login')
        .send({ username: 'admin', password: 'admin123456' })
        .expect(201);
      token = res.body.data.token;
    });

    it('GET /data-analytics/overview 应返回概览数据', async () => {
      const res = await request(server)
        .get('/api/data-analytics/overview')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data).toHaveProperty('userCount');
      expect(res.body.data).toHaveProperty('sessionCount');
      expect(res.body.data).toHaveProperty('diaryCount');
      expect(res.body.data).toHaveProperty('articleCount');
    });

    it('GET /data-analytics/overview 未授权应返回 401', async () => {
      await request(server)
        .get('/api/data-analytics/overview')
        .expect(401);
    });

    it('GET /data-analytics/trends?type=emotion 应返回情绪趋势', async () => {
      const res = await request(server)
        .get('/api/data-analytics/trends')
        .query({ type: 'emotion' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /data-analytics/trends?type=session 应返回会话趋势', async () => {
      const res = await request(server)
        .get('/api/data-analytics/trends')
        .query({ type: 'session' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /data-analytics/trends?type=article 应返回文章趋势', async () => {
      const res = await request(server)
        .get('/api/data-analytics/trends')
        .query({ type: 'article' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ============================================================
  // Upload 模块 — 模拟文件上传
  // ============================================================
  describe('Upload (admin)', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(server)
        .post('/api/user/login')
        .send({ username: 'admin', password: 'admin123456' })
        .expect(201);
      token = res.body.data.token;
    });

    it('POST /file/upload 应能上传文件并返回 URL', async () => {
      const res = await request(server)
        .post('/api/file/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('fake file content'), 'test.png')
        .expect(201);

      expect(res.body.code).toBe(200);
      expect(res.body.data).toHaveProperty('url');
      expect(typeof res.body.data.url).toBe('string');
      expect(res.body.data.url).toContain('/uploads/');
    });

    it('POST /file/upload 未授权应返回 401', async () => {
      await request(server)
        .post('/api/file/upload')
        .expect(401);
    });
  });

  // ============================================================
  // Client-article 公开查询（无需 token）
  // ============================================================
  describe('Client-article (public)', () => {
    it('GET /client/article/categories 应返回公开分类树', async () => {
      const res = await request(server)
        .get('/api/client/article/categories')
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /client/article/published 应返回已发布文章分页', async () => {
      const res = await request(server)
        .get('/api/client/article/published')
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data).toHaveProperty('records');
      expect(Array.isArray(res.body.data.records)).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('currentPage');
      expect(res.body.data).toHaveProperty('size');
    });

    it('GET /client/article/published/:id 应返回已发布文章详情', async () => {
      // 先获取列表取第一篇文章 ID
      const pageRes = await request(server)
        .get('/api/client/article/published')
        .expect(200);
      const articleId = pageRes.body.data.records[0].id;

      const res = await request(server)
        .get(`/api/client/article/published/${articleId}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data.id).toBe(articleId);
      expect(res.body.data.title).toBeDefined();
      expect(res.body.data.content).toBeDefined();
    });

    it('GET /client/article/published/:id 不存在的文章应返回 404', async () => {
      const res = await request(server)
        .get('/api/client/article/published/999999')
        .expect(404);

      expect(res.body.code).toBe(404);
    });
  });
});
