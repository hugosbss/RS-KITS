import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../prisma/enums/user-role.enum';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('eventId') eventId?: string,
  ) {
    return this.usersService.findAll(req.user, eventId);
  }

  @Get('organizers')
  listOrganizers(@Req() req: AuthenticatedRequest) {
    return this.usersService.listOrganizers(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZADOR)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.remove(id, req.user);
  }
}
