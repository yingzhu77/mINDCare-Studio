import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  username: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
