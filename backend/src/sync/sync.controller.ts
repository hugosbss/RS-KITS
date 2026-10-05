import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import {
  SyncConflictResolveDto,
  SyncPullQueryDto,
  SyncPushDto,
  SyncStatusQueryDto,
} from './dtos/sync.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../prisma/enums/user-role.enum';

@Controller('sync')
export class SyncController {
  constructor(private syncService: SyncService) {}

  /**
   * Verificação de disponibilidade. Pública de propósito: o desktop a usa
   * para distinguir "sem internet" de "token expirado" antes de tentar sincronizar.
   */
  @Get('health')
  health() {
    return this.syncService.health();
  }

  @Post('push')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZADOR, UserRole.OPERATOR)
  push(@Body() dto: SyncPushDto, @Req() req: any) {
    return this.syncService.push(dto, req.user);
  }

  @Get('pull')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZADOR, UserRole.OPERATOR)
  pull(@Query() query: SyncPullQueryDto, @Req() req: any) {
    return this.syncService.pull(query, req.user);
  }

  @Get('conflicts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZADOR, UserRole.OPERATOR)
  conflicts(@Query() query: SyncStatusQueryDto, @Req() req: any) {
    return this.syncService.listConflicts(query.eventId, req.user);
  }

  @Post('conflicts/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZADOR)
  resolve(@Body() dto: SyncConflictResolveDto, @Req() req: any) {
    return this.syncService.resolveConflict(dto, req.user);
  }

  @Get('operations/:operationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZADOR, UserRole.OPERATOR)
  operation(@Param('operationId') operationId: string, @Req() req: any) {
    return this.syncService.describeOperation(operationId, req.user);
  }
}
