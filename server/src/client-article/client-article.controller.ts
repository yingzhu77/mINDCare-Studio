import {
  Controller, Get, Post, Put, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ClientArticleService } from './client-article.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateClientArticleDto, UpdateClientArticleDto } from './dto/article.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('client/article')
@UseGuards(JwtAuthGuard)
export class ClientArticleController {
  constructor(private readonly articleService: ClientArticleService) {}

  @Get('page')
  myPage(@Query() dto: PaginationDto, @CurrentUser() user: any) {
    return this.articleService.myPage(dto, user.sub);
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.articleService.detail(Number(id), user.sub);
  }

  @Post()
  create(@Body() dto: CreateClientArticleDto, @CurrentUser() user: any) {
    return this.articleService.create(dto, user.sub);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientArticleDto,
    @CurrentUser() user: any,
  ) {
    return this.articleService.update(Number(id), dto, user.sub);
  }

  @Put(':id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.articleService.submit(Number(id), user.sub);
  }
}
