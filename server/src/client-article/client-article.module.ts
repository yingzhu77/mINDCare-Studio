import { Module } from '@nestjs/common';
import { ClientArticleController } from './client-article.controller';
import { ClientArticleService } from './client-article.service';

@Module({
  controllers: [ClientArticleController],
  providers: [ClientArticleService],
})
export class ClientArticleModule {}
