import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
    return {
      originalname: 'test.jpg',
      buffer: Buffer.from('fake-image'),
      size: 1024,
      mimetype: 'image/jpeg',
      fieldname: 'file',
      encoding: '7bit',
      ...overrides,
    } as Express.Multer.File;
  }

  describe('uploadFile', () => {
    it('应成功上传图片文件并返回 url', async () => {
      const file = makeFile();
      const result = await service.uploadFile(file);

      expect(result.filename).toBe('test.jpg');
      expect(result.url).toMatch(/^\/uploads\/[\w-]+\.jpg$/);
      expect(result.size).toBe(1024);
      expect(writeFile).toHaveBeenCalled();
    });

    it('应支持 PDF 文件上传', async () => {
      const file = makeFile({ originalname: 'doc.pdf', size: 2048 });
      const result = await service.uploadFile(file);
      expect(result.url).toMatch(/\.pdf$/);
    });

    it('无文件应抛 BadRequestException', async () => {
      await expect(service.uploadFile(null as any)).rejects.toThrow(BadRequestException);
    });

    it('不支持的文件类型应抛 BadRequestException', async () => {
      const file = makeFile({ originalname: 'virus.exe' });
      await expect(service.uploadFile(file)).rejects.toThrow(BadRequestException);
    });

    it('超过 10MB 文件应抛 BadRequestException', async () => {
      const file = makeFile({ size: 11 * 1024 * 1024 });
      await expect(service.uploadFile(file)).rejects.toThrow(BadRequestException);
    });
  });
});
