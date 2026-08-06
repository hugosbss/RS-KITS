import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AthletesService } from './athletes.service';

@ApiTags('athletes')
@Controller('athletes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AthletesController {
  constructor(private readonly athletesService: AthletesService) {}

  @Get()
  @ApiOperation({ summary: 'Pesquisar atletas' })
  @ApiQuery({ name: 'eventId', required: false })
  @ApiQuery({ name: 'q', required: false, description: 'Nome, CPF ou número' })
  findAll(@Query('eventId') eventId?: string, @Query('q') q?: string) {
    return this.athletesService.search(eventId, q);
  }
}
