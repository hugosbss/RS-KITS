import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole } from '@prisma/client';
import { EventStatus } from './enums/event-status.enum';
import {
  AddOrganizerDto,
  CreateEventDto,
  ImportAthletesDto,
  ListAthletesQueryDto,
  UpdateEventDto,
} from './dtos/events.dto';
import { AuditService, type AuditFieldChange } from '../audit/audit.service';

// Janela de acesso: o evento fica acessível ao organizador/operador
// até 5 dias após a data do evento.
const ACCESS_WINDOW_DAYS = 5;

type CurrentUser = { id: string; role: UserRole; organizerId?: string | null };

const ORGANIZER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
};

const EVENT_SELECT = {
  id: true,
  name: true,
  date: true,
  place: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  organizers: {
    select: { user: { select: ORGANIZER_SELECT } },
  },
};

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private toAuditUser(currentUser: CurrentUser) {
    return { id: currentUser.id, nome: '', papel: currentUser.role };
  }

  private inferAthleteAction(patch: Record<string, unknown>): string {
    if (patch.statusEntrega === 'ENTREGUE' && patch.dataEntrega) {
      return 'ENTREGA_KIT';
    }
    if (patch.dataEstorno) {
      return 'ESTORNO_ENTREGA';
    }
    if (
      patch.statusEntrega === 'PENDENTE' &&
      patch.dataEntrega === null &&
      patch.dataEstorno === null
    ) {
      return 'ZERAR_ENTREGAS';
    }
    return 'EDICAO_ATLETA';
  }

  private isWithinAccessWindow(event: { date: Date }): boolean {
    const expiresAt = new Date(
      event.date.getTime() + ACCESS_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    return new Date() <= expiresAt;
  }

  // Eventos visíveis para o usuário conforme o perfil:
  // - ADMIN: todos.
  // - ORGANIZADOR: eventos aos quais está vinculado (janela de 5 dias).
  // - OPERATOR: eventos do organizador ao qual está vinculado (janela de 5 dias).
  async findAll(currentUser: CurrentUser) {
    if (currentUser.role === UserRole.ADMIN) {
      return this.prisma.event.findMany({
        orderBy: { date: 'desc' },
        select: EVENT_SELECT,
      });
    }

    const organizerId =
      currentUser.role === UserRole.ORGANIZADOR
        ? currentUser.id
        : currentUser.organizerId;

    if (!organizerId) {
      return [];
    }

    const events = await this.prisma.event.findMany({
      where: { organizers: { some: { userId: organizerId } } },
      orderBy: { date: 'desc' },
      select: EVENT_SELECT,
    });

    return events.filter((event) => this.isWithinAccessWindow(event));
  }

  // Retorna o evento se o usuário tiver acesso, caso contrário lança 404/403.
  private async findAccessibleEvent(
    eventId: string,
    currentUser: CurrentUser,
  ): Promise<{ id: string; name: string; date: Date }> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, date: true },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    if (currentUser.role === UserRole.ADMIN) {
      return event;
    }

    const organizerId =
      currentUser.role === UserRole.ORGANIZADOR
        ? currentUser.id
        : currentUser.organizerId;

    if (!organizerId) {
      throw new ForbiddenException('Acesso negado ao evento');
    }

    const link = await this.prisma.eventUser.findUnique({
      where: {
        eventId_userId: { eventId: eventId, userId: organizerId },
      },
    });

    if (!link || !this.isWithinAccessWindow(event)) {
      throw new ForbiddenException(
        'Acesso ao evento expirado ou não vinculado',
      );
    }

    return event;
  }

  async create(dto: CreateEventDto, currentUser: CurrentUser) {
    const date = new Date(dto.date);
    const event = await this.prisma.event.create({
      data: {
        name: dto.name,
        date,
        place: dto.place ?? null,
        status: dto.status ?? EventStatus.PROXIMO,
      },
      select: EVENT_SELECT,
    });

    await this.audit.register({
      usuario: this.toAuditUser(currentUser),
      acao: 'CRIACAO_EVENTO',
      entidade: 'EVENTO',
      entidadeId: event.id,
      evento: event.name,
      de: null,
      para: {
        name: event.name,
        date: event.date,
        place: event.place,
        status: event.status,
      },
      origem: 'SISTEMA',
    });

    return event;
  }

  async findOne(eventId: string, currentUser: CurrentUser) {
    await this.findAccessibleEvent(eventId, currentUser);
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: EVENT_SELECT,
    });
    return event;
  }

  async update(eventId: string, dto: UpdateEventDto, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas ADMIN pode alterar eventos');
    }

    const before = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
    });

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        name: dto.name,
        date: dto.date ? new Date(dto.date) : undefined,
        place: dto.place,
        status: dto.status,
      },
      select: EVENT_SELECT,
    });

    const fields: AuditFieldChange[] = [];
    for (const key of ['name', 'date', 'place', 'status'] as const) {
      const beforeValue = (before as Record<string, unknown>)[key];
      const afterValue = (updated as Record<string, unknown>)[key];
      if (beforeValue !== afterValue) {
        fields.push({ campo: key, de: beforeValue, para: afterValue });
      }
    }
    if (fields.length) {
      await this.audit.logFieldChanges(fields, {
        usuario: this.toAuditUser(currentUser),
        entidade: 'EVENTO',
        entidadeId: eventId,
        evento: updated.name,
        acao: 'EDICAO_EVENTO',
        origem: 'SISTEMA',
      });
    }

    return updated;
  }

  async remove(eventId: string, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas ADMIN pode excluir eventos');
    }

    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
    });
    await this.prisma.event.delete({ where: { id: eventId } });

    await this.audit.register({
      usuario: this.toAuditUser(currentUser),
      acao: 'EXCLUSAO_EVENTO',
      entidade: 'EVENTO',
      entidadeId: eventId,
      evento: event.name,
      de: {
        name: event.name,
        date: event.date,
        place: event.place,
        status: event.status,
      },
      para: null,
      origem: 'SISTEMA',
    });

    return { deleted: true };
  }

  // --- Vínculo Organizador <-> Evento ---

  async listOrganizers(eventId: string, currentUser: CurrentUser) {
    await this.findAccessibleEvent(eventId, currentUser);
    const links = await this.prisma.eventUser.findMany({
      where: { eventId },
      select: {
        assignedAt: true,
        user: { select: ORGANIZER_SELECT },
      },
      orderBy: { assignedAt: 'asc' },
    });
    return links.map((link) => ({
      ...link.user,
      assignedAt: link.assignedAt,
    }));
  }

  async addOrganizer(
    eventId: string,
    dto: AddOrganizerDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas ADMIN pode vincular organizadores');
    }

    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    if (user.role !== UserRole.ORGANIZADOR) {
      throw new BadRequestException(
        'Apenas usuários com perfil ORGANIZADOR podem ser vinculados a eventos',
      );
    }

    await this.prisma.eventUser.upsert({
      where: { eventId_userId: { eventId, userId: dto.userId } },
      update: {},
      create: { eventId, userId: dto.userId },
    });

    await this.audit.register({
      usuario: this.toAuditUser(currentUser),
      acao: 'VINCULO_ORGANIZADOR',
      entidade: 'EVENTO',
      entidadeId: eventId,
      evento: event.name,
      detalhe: `Organizador vinculado: ${user.name} (${user.id})`,
      origem: 'SISTEMA',
    });

    return this.listOrganizers(eventId, currentUser);
  }

  async removeOrganizer(
    eventId: string,
    userId: string,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas ADMIN pode desvincular organizadores');
    }

    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });
    await this.prisma.eventUser.deleteMany({
      where: { eventId, userId },
    });

    await this.audit.register({
      usuario: this.toAuditUser(currentUser),
      acao: 'DESVINCULO_ORGANIZADOR',
      entidade: 'EVENTO',
      entidadeId: eventId,
      evento: event.name,
      detalhe: `Organizador desvinculado: ${user?.name ?? userId} (${userId})`,
      origem: 'SISTEMA',
    });

    return this.listOrganizers(eventId, currentUser);
  }

  // --- Atletas ---

  async listAthletes(
    eventId: string,
    query: ListAthletesQueryDto,
    currentUser: CurrentUser,
  ) {
    await this.findAccessibleEvent(eventId, currentUser);

    const limit = Math.min(Math.max(query.limit ?? 1000, 1), 10000);
    const offset = Math.max(query.offset ?? 0, 0);

    const where = {
      eventId,
      ...(query.search
        ? {
            OR: [
              { nomeAtleta: { contains: query.search, mode: 'insensitive' as const } },
              { cpfAtleta: { contains: query.search } },
              { num: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [total, athletes] = await this.prisma.$transaction([
      this.prisma.athlete.count({ where }),
      this.prisma.athlete.findMany({
        where,
        orderBy: { num: 'asc' },
        skip: offset,
        take: limit,
      }),
    ]);

    return { total, athletes };
  }

  // Importação em lote: atualiza registros existentes (mesmo evento+num)
  // e cria novos registros.
  async importAthletes(
    eventId: string,
    dto: ImportAthletesDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.ADMIN) {
      await this.findAccessibleEvent(eventId, currentUser);
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, date: true },
    });
    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    const nums = dto.athletes
      .map((a) => a.num)
      .filter((num): num is string => !!num);

    const existing = nums.length
      ? await this.prisma.athlete.findMany({
          where: { eventId, num: { in: nums } },
        })
      : [];

    const existingByNum = new Map(
      existing.map((athlete) => [athlete.num, athlete]),
    );

    const toCreate: Prisma.AthleteCreateManyInput[] = [];
    const toUpdate: Array<{ id: string; data: Prisma.AthleteUpdateInput }> = [];
    const changesByAthlete: Array<{
      id: string;
      num: string;
      fields: AuditFieldChange[];
    }> = [];

    const buildData = (item: (typeof dto.athletes)[number]) => ({
      nomeAtleta: item.nomeAtleta,
      kit: item.kit ?? null,
      distancia: item.distancia ?? null,
      fxEtaria: item.fxEtaria ?? null,
      categEspecial: item.categEspecial ?? null,
      nascto: item.nascto ?? null,
      nascimento: item.nascimento ? new Date(item.nascimento) : null,
      sexo: item.sexo ?? null,
      equipe: item.equipe ?? null,
      cidadeUf: item.cidadeUf ?? null,
      camiseta: item.camiseta ?? null,
      cpfAtleta: item.cpfAtleta ?? null,
      cel: item.cel ?? null,
      email: item.email ?? null,
      quemVaiRetirar: item.quemVaiRetirar ?? null,
      notas: item.notas ?? null,
      obs1: item.obs1 ?? null,
      obs2: item.obs2 ?? null,
      alerta: item.alerta ?? null,
      nomeEvento: item.nomeEvento || event.name,
      contato: item.contato ?? null,
      grauParentesco: item.grauParentesco ?? null,
      celularContato: item.celularContato ?? null,
      pin: item.pin ?? null,
      itensAdicionais: item.itensAdicionais ?? null,
      convenioMedico: item.convenioMedico ?? null,
      tipoSanguineo: item.tipoSanguineo ?? null,
      contatoEmergencia: item.contatoEmergencia ?? null,
      relacaoAtleta: item.relacaoAtleta ?? null,
      telefoneEmergencia: item.telefoneEmergencia ?? null,
    });

    for (const item of dto.athletes) {
      if (item.num && existingByNum.has(item.num)) {
        const current = existingByNum.get(item.num)!;
        const data = buildData(item);
        const fields: AuditFieldChange[] = [];
        for (const [key, value] of Object.entries(data)) {
          const before = (current as Record<string, unknown>)[key];
          if (before !== value) {
            fields.push({ campo: key, de: before, para: value });
          }
        }
        if (fields.length) {
          changesByAthlete.push({
            id: current.id,
            num: item.num,
            fields,
          });
        }
        toUpdate.push({ id: current.id, data });
      } else {
        toCreate.push({ eventId, num: item.num ?? null, ...buildData(item) });
      }
    }

    await this.prisma.$transaction([
      ...toUpdate.map((u) => this.prisma.athlete.update({ where: { id: u.id }, data: u.data })),
      ...(toCreate.length ? [this.prisma.athlete.createMany({ data: toCreate })] : []),
    ]);

    // Auditoria: resumo da importação + antes/depois por atleta/campo atualizado.
    await this.audit.register({
      usuario: this.toAuditUser(currentUser),
      acao: 'IMPORTACAO_PLANILHA',
      entidade: 'IMPORTACAO',
      evento: event.name,
      detalhe: `importados=${toCreate.length}, atualizados=${toUpdate.length}, total=${dto.athletes.length}`,
      origem: 'SISTEMA',
    });
    for (const change of changesByAthlete) {
      await this.audit.logFieldChanges(change.fields, {
        usuario: this.toAuditUser(currentUser),
        entidade: 'ATLETA',
        entidadeId: change.id,
        evento: event.name,
        acao: 'IMPORTACAO_PLANILHA',
        origem: 'SISTEMA',
      });
    }

    return {
      imported: toCreate.length,
      updated: toUpdate.length,
      total: dto.athletes.length,
    };
  }

  async updateAthlete(
    eventId: string,
    athleteId: string,
    data: Record<string, unknown>,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.ADMIN) {
      await this.findAccessibleEvent(eventId, currentUser);
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true },
    });

    const athlete = await this.prisma.athlete.findFirst({
      where: { id: athleteId, eventId },
    });
    if (!athlete) {
      throw new NotFoundException('Atleta não encontrado');
    }

    const allowedFields = [
      'num', 'nomeAtleta', 'kit', 'distancia', 'fxEtaria', 'categEspecial',
      'nascto', 'sexo', 'equipe', 'cidadeUf', 'camiseta', 'cpfAtleta', 'cel',
      'email', 'quemVaiRetirar', 'notas', 'obs1', 'obs2', 'alerta', 'nomeEvento',
      'contato', 'grauParentesco', 'celularContato', 'pin', 'itensAdicionais',
      'convenioMedico', 'tipoSanguineo', 'contatoEmergencia', 'relacaoAtleta',
      'telefoneEmergencia',
      'statusEntrega', 'dataEntrega', 'usuarioEntrega', 'obsEntrega',
      'dataEstorno', 'usuarioEstorno', 'nomeEntrega', 'cpfEntrega',
      'foneEntrega', 'emailEntrega', 'terceiro',
    ];

    const patch: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in data) patch[key] = data[key];
    }

    const updates = await this.prisma.athlete.update({
      where: { id: athleteId },
      data: patch,
    });

    // Auditoria: registra antes/depois por campo efetivamente alterado.
    const fields: AuditFieldChange[] = [];
    for (const [key, value] of Object.entries(patch)) {
      const before = (athlete as Record<string, unknown>)[key];
      if (before !== value) {
        fields.push({ campo: key, de: before, para: value });
      }
    }
    if (fields.length) {
      await this.audit.logFieldChanges(fields, {
        usuario: this.toAuditUser(currentUser),
        entidade: 'ATLETA',
        entidadeId: athleteId,
        evento: event?.name,
        acao: this.inferAthleteAction(patch),
        origem: 'SISTEMA',
      });
    }

    return updates;
  }
}