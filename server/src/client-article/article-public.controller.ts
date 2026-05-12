import { Controller, Get, Param, Query } from '@nestjs/common';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('client/article')
export class ArticlePublicController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  /**
   * 公开查询分类树
   */
  @Get('categories')
  categories() {
    return this.knowledgeService.getCategoryTree();
  }

  /**
   * 公开查询已发布文章列表
   */
  @Get('published')
  publishedPage(
    @Query() dto: PaginationDto,
    @Query('title') title?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.knowledgeService.publishedPage(dto, {
      title,
      categoryId: categoryId ? Number(categoryId) : undefined,
    });
  }

  /**
   * 公开查询已发布文章详情
   */
  @Get('published/:id')
  publishedDetail(@Param('id') id: string) {
    return this.knowledgeService.publishedDetail(Number(id));
  }
}
