import {
  Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateArticleDto, UpdateArticleDto, UpdateArticleStatusDto } from './dto/article.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('knowledge')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  // 分类
  @Get('category/tree')
  categoryTree() {
    return this.knowledgeService.getCategoryTree();
  }

  @Post('category')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.knowledgeService.createCategory(dto);
  }

  @Put('category/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.knowledgeService.updateCategory(Number(id), dto);
  }

  @Delete('category/:id')
  deleteCategory(@Param('id') id: string) {
    return this.knowledgeService.deleteCategory(Number(id));
  }

  // 文章
  @Get('article/page')
  articlePage(
    @Query() dto: PaginationDto,
    @Query('title') title?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.knowledgeService.articlePage(dto, {
      title,
      status,
      categoryId: categoryId ? Number(categoryId) : undefined,
    });
  }

  @Get('article/:id')
  articleDetail(@Param('id') id: string) {
    return this.knowledgeService.articleDetail(Number(id));
  }

  @Post('article')
  articleAdd(@Body() dto: CreateArticleDto) {
    return this.knowledgeService.createArticle(dto, 1);
  }

  @Put('article')
  articleUpdate(@Body() dto: UpdateArticleDto & { id: number }) {
    return this.knowledgeService.updateArticle(dto.id, dto);
  }

  @Delete('article/:id')
  articleDelete(@Param('id') id: string) {
    return this.knowledgeService.deleteArticle(Number(id));
  }

  @Put('article/:id/status')
  articleStatusUpdate(@Param('id') id: string, @Body() dto: UpdateArticleStatusDto) {
    return this.knowledgeService.updateArticleStatus(Number(id), dto.status);
  }
}
