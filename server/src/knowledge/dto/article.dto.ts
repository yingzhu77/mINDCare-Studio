import { IsString, IsOptional, IsInt, IsArray, MinLength } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  tags?: string; // JSON 字符串数组

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdateArticleStatusDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  rejectReason?: string;
}
