import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('user/login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('user/register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('user/me')
  getMe(@Req() req: any) {
    return this.authService.getCurrentUser(req.user.sub);
  }
}
