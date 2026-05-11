import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 分页查询 DTO，与前端分页参数兼容
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  currentPage?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number = 10;
}
