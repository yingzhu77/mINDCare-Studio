import {
  Controller, Post, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('file')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'user')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadFile(file);
  }
}
