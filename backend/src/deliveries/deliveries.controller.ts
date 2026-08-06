import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeliveriesService } from './deliveries.service';

@ApiTags('deliveries')
@Controller('deliveries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar entregas' })
  findAll() {
    return this.deliveriesService.findAll();
  }
}
