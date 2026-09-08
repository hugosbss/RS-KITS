import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../prisma/enums/user-role.enum';
import {
  AddOrganizerDto,
  CreateEventDto,
  ImportAthletesDto,
  ListAthletesQueryDto,
  UpdateEventDto,
} from './dtos/events.dto';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.eventsService.findAll(req.user);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEventDto, @Req() req: any) {
    return this.eventsService.create(dto, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.eventsService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateEventDto, @Req() req: any) {
    return this.eventsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.eventsService.remove(id, req.user);
  }

  // --- Vínculo Organizador <-> Evento ---

  @Get(':id/organizers')
  listOrganizers(@Param('id') id: string, @Req() req: any) {
    return this.eventsService.listOrganizers(id, req.user);
  }

  @Post(':id/organizers')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  addOrganizer(
    @Param('id') id: string,
    @Body() dto: AddOrganizerDto,
    @Req() req: any,
  ) {
    return this.eventsService.addOrganizer(id, dto, req.user);
  }

  @Delete(':id/organizers/:userId')
  @Roles(UserRole.ADMIN)
  removeOrganizer(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.eventsService.removeOrganizer(id, userId, req.user);
  }

  // --- Atletas ---

  @Get(':id/athletes')
  listAthletes(
    @Param('id') id: string,
    @Query() query: ListAthletesQueryDto,
    @Req() req: any,
  ) {
    return this.eventsService.listAthletes(id, query, req.user);
  }

  @Post(':id/athletes')
  @HttpCode(HttpStatus.CREATED)
  importAthletes(
    @Param('id') id: string,
    @Body() dto: ImportAthletesDto,
    @Req() req: any,
  ) {
    return this.eventsService.importAthletes(id, dto, req.user);
  }

  @Patch(':id/athletes/:athleteId')
  updateAthlete(
    @Param('id') id: string,
    @Param('athleteId') athleteId: string,
    @Body() dto: Record<string, unknown>,
    @Req() req: any,
  ) {
    return this.eventsService.updateAthlete(id, athleteId, dto, req.user);
  }
}