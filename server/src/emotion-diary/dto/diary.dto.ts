import { IsString, IsOptional, IsInt, Min, Max, MinLength } from 'class-validator';

export class CreateDiaryDto {
  @IsString()
  diaryDate: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  moodScore?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  sleepQuality?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  stressLevel?: number;

  @IsOptional()
  @IsString()
  dominantEmotion?: string;

  @IsOptional()
  @IsString()
  emotionTriggers?: string;

  @IsOptional()
  @IsString()
  diaryContent?: string;
}

export class UpdateDiaryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  moodScore?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  sleepQuality?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  stressLevel?: number;

  @IsOptional()
  @IsString()
  dominantEmotion?: string;

  @IsOptional()
  @IsString()
  emotionTriggers?: string;

  @IsOptional()
  @IsString()
  diaryContent?: string;
}
