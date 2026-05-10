import {
  Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { EmotionDiaryService } from './emotion-diary.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateDiaryDto, UpdateDiaryDto } from './dto/diary.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class EmotionDiaryController {
  constructor(private readonly diaryService: EmotionDiaryService) {}

  // 管理端
  @Get('emotion-diary/admin/page')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  adminPage(
    @Query() dto: PaginationDto,
    @Query('userName') userName?: string,
    @Query('diaryDate') diaryDate?: string,
    @Query('dominantEmotion') dominantEmotion?: string,
    @Query('minMoodScore') minMoodScore?: number,
    @Query('maxMoodScore') maxMoodScore?: number,
  ) {
    return this.diaryService.adminPage(dto, {
      userName, diaryDate, dominantEmotion,
      minMoodScore: minMoodScore ? Number(minMoodScore) : undefined,
      maxMoodScore: maxMoodScore ? Number(maxMoodScore) : undefined,
    });
  }

  @Delete('emotion-diary/admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  adminDelete(@Param('id') id: string) {
    return this.diaryService.adminDelete(Number(id));
  }

  // 用户端
  @Post('emotion-diary')
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateDiaryDto, @CurrentUser() user: any) {
    return this.diaryService.create(dto, user.sub, user.username);
  }

  @Put('emotion-diary/:id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateDiaryDto, @CurrentUser() user: any) {
    return this.diaryService.update(Number(id), dto, user.sub);
  }

  @Get('emotion-diary/my/page')
  @UseGuards(JwtAuthGuard)
  myPage(
    @Query() dto: PaginationDto,
    @CurrentUser() user: any,
    @Query('diaryDate') diaryDate?: string,
  ) {
    return this.diaryService.myPage(dto, user.sub, { diaryDate });
  }

  @Delete('emotion-diary/:id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.diaryService.delete(Number(id), user.sub);
  }
}
