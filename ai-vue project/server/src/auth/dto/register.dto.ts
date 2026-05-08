import { IsString, MinLength, MaxLength, IsEmail, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  role?: string; // 仅管理员可设置，开放注册默认为 user
}
