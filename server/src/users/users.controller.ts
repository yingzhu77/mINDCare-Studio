import { Controller, Get, Put, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('page')
  page(@Query() dto: PaginationDto, @Query('keyword') keyword?: string) {
    return this.usersService.paginate(dto, keyword);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Query('status') status: string) {
    return this.usersService.updateStatus(Number(id), Number(status));
  }
}
