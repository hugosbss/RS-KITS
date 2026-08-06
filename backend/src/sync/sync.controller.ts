import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SyncService } from './sync.service';
import { SyncEventDto } from './dto/sync-event.dto';

@ApiTags('sync')
@Controller('sync')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('events')
  @ApiOperation({ summary: 'Enviar eventos pendentes do cliente' })
  pushEvents(@Body() dto: SyncEventDto) {
    return this.syncService.processEvents(dto);
  }
}
