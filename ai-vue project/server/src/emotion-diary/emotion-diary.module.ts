import { Module } from '@nestjs/common';
import { EmotionDiaryController } from './emotion-diary.controller';
import { EmotionDiaryService } from './emotion-diary.service';

@Module({
  controllers: [EmotionDiaryController],
  providers: [EmotionDiaryService],
  exports: [EmotionDiaryService],
})
export class EmotionDiaryModule {}
