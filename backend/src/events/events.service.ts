import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  assertImportIdentities,
  importNum,
  importCpf,
} from './import-validation';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole } from '@prisma/client';
import { EventStatus } from './enums/event-status.enum';
import {
  AddOrganizerDto,
  CreateEventDto,
  ImportAthletesDto,
  ListAthletesQueryDto,
  UpdateEventDto,
  formatEventDate,
  parseEventDate,
} from './dtos/events.dto';
import { AuditService, type AuditFieldChange } from '../audit/audit.service';
import { recordChange } from '../sync/sync-history.service';

// Janela de acesso: o evento fica acessível ao organizador/operador
// até 5 dias após a data do evento.
const ACCESS_WINDOW_DAYS = 5;

type CurrentUser = { id: string; role: UserRole; organizerId?: string | null };

/**
 * Converte o registro do Prisma em JSON estável para o feed de sincronização:
 * datas viram ISO-8601, o desktop nunca depende do formato local.
 */
export function serializeAthlete(athlete: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(athlete)) {
    out[key] = value instanceof Date ? value.toISOString() : value;
  }
  return out as Prisma.InputJsonValue;
}

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
  version: true,
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

  /**
   * Cria o evento e seus vínculos de organizador em UMA transação.
   * Sem organizador a criação é rejeitada: um evento sem vínculo ficaria
   * invisível para quem deveria operá-lo.
   */
  async create(dto: CreateEventDto, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas ADMIN pode criar eventos');
    }

    const organizerIds = [...new Set(dto.organizerIds ?? [])].filter(Boolean);
    if (organizerIds.length === 0) {
      throw new BadRequestException(
        'Selecione o organizador responsável pelo evento',
      );
    }
    await this.assertOrganizers(organizerIds);

    const date = parseEventDate(dto.date);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Data inválida');
    }

    const event = await this.prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          name: dto.name.trim(),
          date,
          place: dto.place?.trim() || null,
          status: dto.status ?? EventStatus.PROXIMO,
          version: 1,
        },
      });
      await tx.eventUser.createMany({
        data: organizerIds.map((userId) => ({ eventId: created.id, userId })),
      });
      return created;
    });

    const full = await this.prisma.event.findUniqueOrThrow({
      where: { id: event.id },
      select: EVENT_SELECT,
    });

    await recordChange(this.prisma, {
      eventId: full.id,
      entityType: 'EVENT',
      entityId: full.id,
      version: full.version,
      payload: {
        ...full,
        date: formatEventDate(full.date),
        dateTime: full.date.toISOString(),
      } as unknown as Prisma.InputJsonValue,
      userId: currentUser.id,
    });

    await this.audit.register({
      usuario: this.toAuditUser(currentUser),
      acao: 'CRIACAO_EVENTO',
      entidade: 'EVENTO',
      entidadeId: full.id,
      evento: full.name,
      de: null,
      para: {
        name: full.name,
        date: formatEventDate(full.date),
        place: full.place,
        status: full.status,
        organizers: full.organizers.map((link) => link.user.name),
      },
      origem: 'SISTEMA',
    });

    return full;
  }

  /** Garante que todos os ids existem e são ORGANIZADOR. */
  private async assertOrganizers(organizerIds: string[]) {
    const organizers = await this.prisma.user.findMany({
      where: { id: { in: organizerIds } },
      select: { id: true, name: true, role: true },
    });
    const found = new Map(organizers.map((user) => [user.id, user]));

    const missing = organizerIds.filter((id) => !found.has(id));
    if (missing.length) {
      throw new BadRequestException(
        `Organizador não encontrado: ${missing.join(', ')}`,
      );
    }
    const invalid = organizers.filter(
      (user) => user.role !== UserRole.ORGANIZADOR,
    );
    if (invalid.length) {
      throw new BadRequestException(
        `Somente ORGANIZADOR pode ser vinculado (${invalid
          .map((user) => user.name)
          .join(', ')})`,
      );
    }
    return organizers;
  }

  async findOne(eventId: string, currentUser: CurrentUser) {
    await this.findAccessibleEvent(eventId, currentUser);
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: EVENT_SELECT,
    });
    return event;
  }

  /**
   * Atualiza o evento e o conjunto de organizadores em UMA transação.
   * `organizerIds` ausente mantém os vínculos atuais; enviado, substitui o
   * conjunto e o diff fica registrado em auditoria (sem remoção silenciosa).
   */
  async update(eventId: string, dto: UpdateEventDto, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas ADMIN pode alterar eventos');
    }

    const before = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!before) {
      throw new NotFoundException('Evento não encontrado');
    }

    const replacesOrganizers = dto.organizerIds !== undefined;
    let desiredOrganizers: string[] | null = null;
    if (replacesOrganizers) {
      desiredOrganizers = [...new Set(dto.organizerIds ?? [])].filter(Boolean);
      await this.assertOrganizers(desiredOrganizers);
    }

    const nextDate = dto.date ? parseEventDate(dto.date) : undefined;
    if (nextDate && Number.isNaN(nextDate.getTime())) {
      throw new BadRequestException('Data inválida');
    }

    const previousLinks = await this.prisma.eventUser.findMany({
      where: { eventId },
      select: { userId: true },
    });
    const previousOrganizerIds = previousLinks.map((link) => link.userId);
    const toAdd = desiredOrganizers
      ? desiredOrganizers.filter((id) => !previousOrganizerIds.includes(id))
      : [];
    const toRemove = desiredOrganizers
      ? previousOrganizerIds.filter((id) => !desiredOrganizers!.includes(id))
      : [];

    const updated = await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.update({
        where: { id: eventId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(nextDate ? { date: nextDate } : {}),
          ...(dto.place !== undefined
            ? { place: dto.place.trim() || null }
            : {}),
          ...(dto.status !== undefined
            ? { status: dto.status as EventStatus }
            : {}),
          version: { increment: 1 },
        },
      });

      if (toAdd.length) {
        await tx.eventUser.createMany({
          data: toAdd.map((userId) => ({ eventId, userId })),
        });
      }
      if (toRemove.length) {
        await tx.eventUser.deleteMany({
          where: { eventId, userId: { in: toRemove } },
        });
      }
      return event;
    });

    const full = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      select: EVENT_SELECT,
    });

    const fields: AuditFieldChange[] = [];
    if (dto.name !== undefined && before.name !== updated.name) {
      fields.push({ campo: 'name', de: before.name, para: updated.name });
    }
    if (nextDate && before.date.getTime() !== updated.date.getTime()) {
      fields.push({
        campo: 'date',
        de: formatEventDate(before.date),
        para: formatEventDate(updated.date),
      });
    }
    if (
      dto.place !== undefined &&
      (before.place ?? '') !== (updated.place ?? '')
    ) {
      fields.push({ campo: 'place', de: before.place, para: updated.place });
    }
    if (dto.status !== undefined && before.status !== updated.status) {
      fields.push({ campo: 'status', de: before.status, para: updated.status });
    }
    if (fields.length) {
      await this.audit.logFieldChanges(fields, {
        usuario: this.toAuditUser(currentUser),
        entidade: 'EVENTO',
        entidadeId: eventId,
        evento: full.name,
        acao: 'EDICAO_EVENTO',
        origem: 'SISTEMA',
      });
    }

    if (replacesOrganizers) {
      await this.audit.register({
        usuario: this.toAuditUser(currentUser),
        acao: 'VINCULO_ORGANIZADOR',
        entidade: 'EVENTO',
        entidadeId: eventId,
        evento: full.name,
        detalhe:
          `Vínculos atualizados — adicionados: [${toAdd.join(', ')}], ` +
          `removidos: [${toRemove.join(', ')}]`,
        origem: 'SISTEMA',
      });
    }

    await recordChange(this.prisma, {
      eventId,
      entityType: 'EVENT',
      entityId: eventId,
      version: full.version,
      payload: {
        ...full,
        date: formatEventDate(full.date),
        dateTime: full.date.toISOString(),
      } as unknown as Prisma.InputJsonValue,
      userId: currentUser.id,
    });

    return full;
  }

  async remove(eventId: string, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas ADMIN pode excluir eventos');
    }

    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
    });
    await this.prisma.event.delete({ where: { id: eventId } });

    // Tombstone: o desktop precisa saber que o evento sumiu, mesmo having
    // recebido a mudança depois de já ter sincronizado antes da exclusão.
    await recordChange(this.prisma, {
      eventId,
      entityType: 'EVENT',
      entityId: eventId,
      version: (event as unknown as { version: number }).version ?? 1,
      op: 'DELETE',
      userId: currentUser.id,
    });

    await this.audit.register({
      usuario: this.toAuditUser(currentUser),
      acao: 'EXCLUSAO_EVENTO',
      entidade: 'EVENTO',
      entidadeId: eventId,
      evento: event.name,
      de: {
        name: event.name,
        date: formatEventDate(event.date),
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
      throw new ForbiddenException(
        'Apenas ADMIN pode desvincular organizadores',
      );
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
              {
                nomeAtleta: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
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

    const { event, toCreate, toUpdate, changesByAthlete } =
      await this.prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${eventId}))::text`;
          const event = await tx.event.findUnique({
            where: { id: eventId },
            select: { id: true, name: true, date: true },
          });
          if (!event) {
            throw new NotFoundException('Evento não encontrado');
          }

          assertImportIdentities(dto.athletes);
          const existing = await tx.athlete.findMany({ where: { eventId } });
          assertImportIdentities(dto.athletes, existing);

          const existingByNum = new Map(
            existing
              .filter((athlete) => athlete.num)
              .map((athlete) => [importNum(athlete.num), athlete]),
          );
          const existingByCpf = new Map(
            existing
              .filter((athlete) => importCpf(athlete.cpfAtleta))
              .map((athlete) => [importCpf(athlete.cpfAtleta), athlete]),
          );

          const toCreate: Prisma.AthleteCreateManyInput[] = [];
          const toUpdate: Array<{
            id: string;
            data: Prisma.AthleteUpdateInput;
          }> = [];
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
            const match =
              (item.num ? existingByNum.get(importNum(item.num)) : undefined) ??
              (item.cpfAtleta
                ? existingByCpf.get(importCpf(item.cpfAtleta))
                : undefined);
            if (match) {
              const current = match;
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
                  num: item.num ?? current.num ?? '',
                  fields,
                });
              }
              toUpdate.push({ id: current.id, data });
            } else {
              toCreate.push({
                eventId,
                num: item.num ?? null,
                ...buildData(item),
              });
            }
          }

          for (const update of toUpdate)
            await tx.athlete.update({
              where: { id: update.id },
              data: update.data,
            });
          if (toCreate.length) await tx.athlete.createMany({ data: toCreate });
          return { event, toCreate, toUpdate, changesByAthlete };
        },
        { timeout: 60000 },
      );

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
      'num',
      'nomeAtleta',
      'kit',
      'distancia',
      'fxEtaria',
      'categEspecial',
      'nascto',
      'sexo',
      'equipe',
      'cidadeUf',
      'camiseta',
      'cpfAtleta',
      'cel',
      'email',
      'quemVaiRetirar',
      'notas',
      'obs1',
      'obs2',
      'alerta',
      'nomeEvento',
      'contato',
      'grauParentesco',
      'celularContato',
      'pin',
      'itensAdicionais',
      'convenioMedico',
      'tipoSanguineo',
      'contatoEmergencia',
      'relacaoAtleta',
      'telefoneEmergencia',
      'statusEntrega',
      'dataEntrega',
      'usuarioEntrega',
      'obsEntrega',
      'dataEstorno',
      'usuarioEstorno',
      'nomeEntrega',
      'cpfEntrega',
      'foneEntrega',
      'emailEntrega',
      'terceiro',
    ];

    const patch: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in data) patch[key] = data[key];
    }
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('Nenhum campo válido para atualizar');
    }

    // A versão enviada pelo cliente permite detectar edição concorrente.
    const baseVersion =
      typeof data.version === 'number' ? (data.version as number) : null;
    if (baseVersion !== null && baseVersion !== athlete.version) {
      throw new ConflictException(
        `Registro alterado por outro usuário (v${athlete.version}). Recarregue antes de salvar.`,
      );
    }

    const { version: _ignoredVersion, ...patchFields } = patch;

    const updates = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.athlete.update({
        where: { id: athleteId },
        data: { ...patchFields, version: { increment: 1 } },
      });
      await tx.syncChange.create({
        data: {
          eventId,
          entityType: 'ATHLETE',
          entityId: updated.id,
          version: updated.version,
          op: 'UPSERT',
          payload: serializeAthlete(updated),
          userId: currentUser.id,
        },
      });
      return updated;
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
