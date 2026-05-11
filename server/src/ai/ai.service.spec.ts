import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ConfigService } from '../config/config.service';

jest.setTimeout(30000);

describe('AiService', () => {
  let service: AiService;

  const mockConfig: any = {
    isMockAi: true,
    crisisHotline: '400-161-9995',
    crisisHotlineName: '全国心理援助热线',
    deepseekBaseUrl: 'https://api.deepseek.com',
    deepseekApiKey: undefined,
    deepseekModel: 'deepseek-chat',
  };

  async function collectStream(
    stream: AsyncGenerator<string>,
  ): Promise<string> {
    const chunks: string[] = [];
    for await (const char of stream) {
      chunks.push(char);
    }
    return chunks.join('');
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    jest.clearAllMocks();
  });

  // ==================== smoke ====================

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== chatStream — mock mode ====================

  describe('chatStream — mock mode', () => {
    it('应为正常消息输出非空流式内容', async () => {
      const output = await collectStream(
        service.chatStream([{ role: 'user', content: '你好' }]),
      );
      expect(output).toBeTruthy();
      expect(output.length).toBeGreaterThan(10);
    });

    it('输出应包含 AI 心理健康助手相关介绍', async () => {
      const output = await collectStream(
        service.chatStream([{ role: 'user', content: '最近压力很大' }]),
      );
      expect(output).toContain('AI 心理健康助手');
    });
  });

  // ==================== chatStream — crisis detection ====================

  describe('chatStream — crisis detection', () => {
    it('含自杀关键词应返回热线号码', async () => {
      const output = await collectStream(
        service.chatStream([{ role: 'user', content: '我想自杀' }]),
      );
      expect(output).toContain('400-161-9995');
    });

    it('含自伤关键词应返回热线号码', async () => {
      const output = await collectStream(
        service.chatStream([{ role: 'user', content: '我有自伤行为' }]),
      );
      expect(output).toContain('400-161-9995');
    });

    it('含想死关键词应返回热线号码', async () => {
      const output = await collectStream(
        service.chatStream([{ role: 'user', content: '我好想死' }]),
      );
      expect(output).toContain('400-161-9995');
    });

    it('非危机消息不应包含热线信息', async () => {
      const output = await collectStream(
        service.chatStream([{ role: 'user', content: '今天心情不错' }]),
      );
      expect(output).not.toContain('400-161-9995');
      expect(output).toContain('AI 心理健康助手');
    });
  });

  // ==================== chatStream — API error fallback ====================

  describe('chatStream — API error fallback', () => {
    beforeEach(() => {
      mockConfig.isMockAi = false;
      mockConfig.deepseekApiKey = 'sk-test';
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    });

    afterEach(() => {
      mockConfig.isMockAi = true;
      mockConfig.deepseekApiKey = undefined;
      delete (global as any).fetch;
    });

    it('API 调用失败应降级到 mock 响应', async () => {
      const output = await collectStream(
        service.chatStream([{ role: 'user', content: '你好' }]),
      );
      expect(output).toContain('AI 心理健康助手');
    });

    it('API 返回非 200 也应降级到 mock', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const output = await collectStream(
        service.chatStream([{ role: 'user', content: '你好' }]),
      );
      expect(output).toContain('AI 心理健康助手');
    });

    it('API 失败且含危机关键词仍应返回热线', async () => {
      const output = await collectStream(
        service.chatStream([{ role: 'user', content: '我想自杀' }]),
      );
      expect(output).toContain('400-161-9995');
    });
  });

  // ==================== analyze — mock mode ====================

  describe('analyze — mock mode', () => {
    it('应返回可解析的 JSON 字符串', async () => {
      const result = await service.analyze('分析以下内容', '今天心情不错');
      expect(result).toBeTruthy();
      const parsed = JSON.parse(result);
      expect(parsed.mainEmotion).toBeDefined();
      expect(parsed.riskLevel).toBeDefined();
    });

    it('应包含预期字段结构', async () => {
      const result = await service.analyze('分析以下内容', '最近睡不好');
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('mainEmotion');
      expect(parsed).toHaveProperty('emotionIntensity');
      expect(parsed).toHaveProperty('emotionNature');
      expect(parsed).toHaveProperty('riskLevel');
      expect(parsed).toHaveProperty('professionalAdvice');
      expect(parsed).toHaveProperty('emotionTags');
    });

    it('mock 模式固定输出应保持稳定', async () => {
      const r1 = await service.analyze('分析', '今天很开心');
      const r2 = await service.analyze('分析', '今天好难过');
      expect(JSON.parse(r1)).toEqual(JSON.parse(r2));
    });
  });

  // ==================== analyze — error fallback ====================

  describe('analyze — API error fallback', () => {
    beforeEach(() => {
      mockConfig.isMockAi = false;
      mockConfig.deepseekApiKey = 'sk-test';
      global.fetch = jest.fn().mockRejectedValue(new Error('API error'));
    });

    afterEach(() => {
      mockConfig.isMockAi = true;
      mockConfig.deepseekApiKey = undefined;
      delete (global as any).fetch;
    });

    it('API 异常应降级到 mock 结果', async () => {
      const result = await service.analyze('分析', '最近有点焦虑');
      expect(result).toBeTruthy();
      const parsed = JSON.parse(result);
      expect(parsed.mainEmotion).toBe('平静');
    });
  });
});
