import { Module } from '@nestjs/common';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ClientArticleController } from './client-article.controller';
import { ClientArticleService } from './client-article.service';
import { ArticlePublicController } from './article-public.controller';

@Module({
  imports: [KnowledgeModule],
  controllers: [ArticlePublicController, ClientArticleController],
  providers: [ClientArticleService],
})
export class ClientArticleModule {}
