import { IsString, MinLength, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsString()
  sessionId?: string; // 为空则创建新会话
}
