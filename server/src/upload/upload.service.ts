import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private readonly uploadDir = process.env.UPLOADS_DIR || join(__dirname, '..', '..', 'uploads');
  private readonly allowedTypes = /\.(jpg|jpeg|png|gif|webp|svg|bmp|pdf|doc|docx)$/i;
  private readonly maxSize = 10 * 1024 * 1024; // 10MB

  constructor() {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('未选择文件');
    }

    const ext = extname(file.originalname);
    if (!this.allowedTypes.test(ext)) {
      throw new BadRequestException('不支持的文件类型');
    }

    if (file.size > this.maxSize) {
      throw new BadRequestException('文件大小不能超过 10MB');
    }

    const filename = `${randomUUID()}${ext}`;
    const filepath = join(this.uploadDir, filename);
    await writeFile(filepath, file.buffer);

    return {
      filename: file.originalname,
      url: `/uploads/${filename}`,
      size: file.size,
    };
  }
}
