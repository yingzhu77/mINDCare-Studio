import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('analysis')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('emotion-diary/:id')
  triggerEmotionDiaryAnalysis(@Param('id') id: string) {
    return this.analysisService.analyzeEmotionDiary(Number(id));
  }

  @Get('emotion-diary/:id')
  getEmotionDiaryAnalysis(@Param('id') id: string) {
    return this.analysisService.getEmotionDiaryAnalysis(Number(id));
  }

  @Post('chat-session/:id')
  triggerChatSessionAnalysis(@Param('id') id: string) {
    return this.analysisService.analyzeChatSession(id);
  }

  @Get('chat-session/:id')
  getChatSessionAnalysis(@Param('id') id: string) {
    return this.analysisService.getChatSessionAnalysis(id);
  }
}
