import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../prisma/enums/user-role.enum';
import { AuditService } from '../audit/audit.service';
import { SyncHistoryService } from './sync-history.service';
import {
  SYNC_PROTOCOL_VERSION,
  type SyncOperationDto,
  type SyncPullQueryDto,
  type SyncPushDto,
  type SyncConflictResolveDto,
} from './dtos/sync.dto';

const ACCESS_WINDOW_DAYS = 5;
const PULL_MAX_LIMIT = 500;

type CurrentUser = { id: string; role: UserRole; organizerId?: string | null };

export type OperationResult = {
  operationId: string;
  status: 'APPLIED' | 'ALREADY_APPLIED' | 'CONFLICT' | 'REJECTED';
  detail?: string;
  conflictId?: string;
  version?: number;
};

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private syncHistory: SyncHistoryService,
  ) {}

  /** Verificação de disponibilidade usada pelo desktop antes de sincronizar. */
  health() {
    return {
      status: 'ok',
      service: 'rskits-sync',
      protocol: SYNC_PROTOCOL_VERSION,
      serverTime: new Date().toISOString(),
    };
  }

  /**
   * Aplica um lote de operações do desktop.
   *
   * Garantias:
   * - cada operação é autorizada pelo usuário e pelo evento;
   * - cada operação é atômica (uma transação por operação) e idempotente
   *   (reenviar o mesmo operationId não duplica entrega, atleta ou auditoria);
   * - o resultado é devolvido individualmente, e o desktop só confirma
   *   localmente o que o servidor reconhecido.
   */
  async push(payload: SyncPushDto, currentUser: CurrentUser) {
    if (payload.protocol !== SYNC_PROTOCOL_VERSION) {
      throw new BadRequestException(
        `Versão de protocolo não suportada: ${payload.protocol}. Esperado: ${SYNC_PROTOCOL_VERSION}.`,
      );
    }

    const results: OperationResult[] = [];
    for (const operation of payload.operations) {
      try {
        results.push(await this.applyOperation(operation, payload.deviceId, currentUser));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Falha ao aplicar operação';
        this.logger.warn(
          `sync push ${operation.operationId}: ${message}`,
        );
        results.push({
          operationId: operation.operationId,
          status: 'REJECTED',
          detail: message,
        });
      }
    }

    return {
      results,
      applied: results.filter((r) => r.status === 'APPLIED').length,
      alreadyApplied: results.filter((r) => r.status === 'ALREADY_APPLIED').length,
      conflicts: results.filter((r) => r.status === 'CONFLICT').length,
      rejected: results.filter((r) => r.status === 'REJECTED').length,
      serverTime: new Date().toISOString(),
    };
  }

  private async applyOperation(
    operation: SyncOperationDto,
    deviceId: string,
    currentUser: CurrentUser,
  ): Promise<OperationResult> {
    // Idempotência: o mesmo operationId nunca é aplicado duas vezes.
    const existing = await this.prisma.syncOperation.findUnique({
      where: { operationId: operation.operationId },
    });
    if (existing) {
      const detail =
        existing.status === 'CONFLICT'
          ? 'Operação já registrada como conflito'
          : 'Operação já aplicada anteriormente';
      const conflict = await this.prisma.syncConflict.findFirst({
        where: { operationId: operation.operationId },
        select: { id: true },
      });
      return {
        operationId: operation.operationId,
        status: existing.status === 'CONFLICT' ? 'CONFLICT' : 'ALREADY_APPLIED',
        detail,
        conflictId: conflict?.id,
      };
    }

    const eventId = operation.eventId ?? null;
    if (eventId) {
      await this.assertEventAccess(eventId, currentUser);
    }

    switch (operation.entityType) {
      case 'ATHLETE':
      case 'DELIVERY':
      case 'REVERSAL':
        return this.applyAthleteOperation(operation, deviceId, currentUser);
      case 'EVENT':
        return this.applyEventOperation(operation, deviceId, currentUser);
      case 'AUDIT':
        return this.applyAuditOperation(operation, deviceId, currentUser);
      default:
        return {
          operationId: operation.operationId,
          status: 'REJECTED',
          detail: `entityType não suportado: ${operation.entityType}`,
        };
    }
  }

  private async applyAthleteOperation(
    operation: SyncOperationDto,
    deviceId: string,
    currentUser: CurrentUser,
  ): Promise<OperationResult> {
    const eventId = operation.eventId;
    if (!eventId) {
      return this.reject(operation, 'Operação de atleta sem eventId');
    }

    const fields = this.athleteFields(operation.payload);
    if (Object.keys(fields).length === 0 && operation.opType !== 'DELETE') {
      return this.reject(operation, 'Nenhum campo de atleta reconhecível');
    }

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.athlete.findFirst({
        where: { id: operation.entityId, eventId },
      });

      // Criação (ou recriação) de atleta.
      if (!current) {
        if (operation.opType === 'DELETE') {
          await this.markOperation(tx, operation, deviceId, currentUser, 'REJECTED', 'Atleta inexistente');
          return {
            operationId: operation.operationId,
            status: 'REJECTED' as const,
            detail: 'Atleta não encontrado no evento',
          };
        }
        const nomeAtleta =
          (fields.nomeAtleta as string) ?? 'Atleta importado (desktop)';
        const created = await tx.athlete.create({
          data: {
            ...(fields as Prisma.AthleteUncheckedCreateInput),
            id: operation.entityId,
            eventId,
            nomeAtleta,
            version: 1,
          },
        });
        await this.markOperation(tx, operation, deviceId, currentUser, 'APPLIED');
        await this.writeChange(tx, {
          eventId,
          entityType: 'ATHLETE',
          entityId: created.id,
          version: created.version,
          payload: created as unknown as Prisma.InputJsonValue,
          deviceId,
          userId: currentUser.id,
        });
        return {
          operationId: operation.operationId,
          status: 'APPLIED' as const,
          version: created.version,
        };
      }

      // Controle de versão otimista: baseVersion desatualizada => conflito.
      if (
        operation.baseVersion !== null &&
        operation.baseVersion !== undefined &&
        operation.baseVersion !== current.version
      ) {
        const conflict = await tx.syncConflict.create({
          data: {
            operationId: operation.operationId,
            userId: currentUser.id,
            eventId,
            entityType: operation.entityType,
            entityId: operation.entityId,
            baseVersion: operation.baseVersion,
            centralVersion: current.version,
            localPayload: operation.payload as Prisma.InputJsonValue,
            centralPayload: current as unknown as Prisma.InputJsonValue,
            status: 'OPEN',
          },
        });
        await this.markOperation(
          tx,
          operation,
          deviceId,
          currentUser,
          'CONFLICT',
          `Versão central ${current.version} difere da local ${operation.baseVersion}`,
        );
        return {
          operationId: operation.operationId,
          status: 'CONFLICT' as const,
          conflictId: conflict.id,
          detail:
            'O registro foi alterado no servidor. Revise antes de confirmar.',
        };
      }

      const updated = await tx.athlete.update({
        where: { id: operation.entityId },
        data: { ...fields, version: { increment: 1 } },
      });

      await this.markOperation(tx, operation, deviceId, currentUser, 'APPLIED');
      await this.writeChange(tx, {
        eventId,
        entityType: 'ATHLETE',
        entityId: updated.id,
        version: updated.version,
        payload: updated as unknown as Prisma.InputJsonValue,
        deviceId,
        userId: currentUser.id,
      });
      await this.logFieldChanges(
        current as unknown as Record<string, unknown>,
        fields,
        operation,
        eventId,
        currentUser,
      );

      return {
        operationId: operation.operationId,
        status: 'APPLIED' as const,
        version: updated.version,
      };
    });
  }

  private async applyEventOperation(
    operation: SyncOperationDto,
    deviceId: string,
    currentUser: CurrentUser,
  ): Promise<OperationResult> {
    if (currentUser.role !== UserRole.ADMIN) {
      return this.reject(
        operation,
        'Apenas ADMIN pode aplicar alterações de evento vindas do desktop',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.event.findUnique({
        where: { id: operation.entityId },
      });
      if (!current) {
        await this.markOperation(tx, operation, deviceId, currentUser, 'REJECTED', 'Evento inexistente');
        return {
          operationId: operation.operationId,
          status: 'REJECTED' as const,
          detail: 'Evento não encontrado',
        };
      }
      if (
        operation.baseVersion !== null &&
        operation.baseVersion !== undefined &&
        operation.baseVersion !== current.version
      ) {
        const conflict = await tx.syncConflict.create({
          data: {
            operationId: operation.operationId,
            userId: currentUser.id,
            eventId: operation.entityId,
            entityType: 'EVENT',
            entityId: operation.entityId,
            baseVersion: operation.baseVersion,
            centralVersion: current.version,
            localPayload: operation.payload as Prisma.InputJsonValue,
            centralPayload: current as unknown as Prisma.InputJsonValue,
            status: 'OPEN',
          },
        });
        await this.markOperation(tx, operation, deviceId, currentUser, 'CONFLICT');
        return {
          operationId: operation.operationId,
          status: 'CONFLICT' as const,
          conflictId: conflict.id,
        };
      }

      const updated = await tx.event.update({
        where: { id: operation.entityId },
        data: {
          ...(typeof operation.payload.name === 'string'
            ? { name: operation.payload.name }
            : {}),
          ...(typeof operation.payload.place === 'string'
            ? { place: operation.payload.place }
            : {}),
          version: { increment: 1 },
        },
      });
      await this.markOperation(tx, operation, deviceId, currentUser, 'APPLIED');
      await this.writeChange(tx, {
        eventId: operation.entityId,
        entityType: 'EVENT',
        entityId: updated.id,
        version: updated.version,
        payload: updated as unknown as Prisma.InputJsonValue,
        deviceId,
        userId: currentUser.id,
      });
      return {
        operationId: operation.operationId,
        status: 'APPLIED' as const,
        version: updated.version,
      };
    });
  }

  private async applyAuditOperation(
    operation: SyncOperationDto,
    deviceId: string,
    currentUser: CurrentUser,
  ): Promise<OperationResult> {
    const acao =
      typeof operation.payload.acao === 'string'
        ? operation.payload.acao
        : 'ALTERACAO_DESKTOP';
    const detalhe =
      typeof operation.payload.detalhe === 'string' && operation.payload.detalhe
        ? operation.payload.detalhe
        : undefined;

    await this.prisma.$transaction(async (tx) => {
      await this.markOperation(tx, operation, deviceId, currentUser, 'APPLIED');
      await this.writeChange(tx, {
        eventId: operation.eventId ?? null,
        entityType: 'AUDIT',
        entityId: operation.entityId,
        version: 1,
        payload: operation.payload as Prisma.InputJsonValue,
        deviceId,
        userId: currentUser.id,
      });
    });

    await this.audit.register({
      usuario: { id: currentUser.id, nome: '', papel: currentUser.role },
      acao,
      entidade: typeof operation.payload.entidade === 'string' ? operation.payload.entidade : 'ATLETA',
      entidadeId: operation.entityId,
      evento: typeof operation.payload.evento === 'string' ? operation.payload.evento : undefined,
      campo: typeof operation.payload.campo === 'string' ? operation.payload.campo : undefined,
      de: operation.payload.de ?? null,
      para: operation.payload.para ?? null,
      detalhe,
      origem: 'DESKTOP',
    });

    return { operationId: operation.operationId, status: 'APPLIED' };
  }

  private reject(operation: SyncOperationDto, detail: string): OperationResult {
    return { operationId: operation.operationId, status: 'REJECTED', detail };
  }

  private async markOperation(
    tx: Prisma.TransactionClient,
    operation: SyncOperationDto,
    deviceId: string,
    currentUser: CurrentUser,
    status: string,
    detail?: string,
  ) {
    await tx.syncOperation.create({
      data: {
        operationId: operation.operationId,
        userId: currentUser.id,
        deviceId,
        eventId: operation.eventId ?? null,
        entityType: operation.entityType,
        entityId: operation.entityId,
        baseVersion: operation.baseVersion ?? null,
        opType: operation.opType,
        status,
        detail: detail ?? null,
      },
    });
  }

  private async writeChange(
    tx: Prisma.TransactionClient,
    input: {
      eventId: string | null;
      entityType: string;
      entityId: string;
      version: number;
      payload: Prisma.InputJsonValue;
      deviceId: string;
      userId: string;
    },
  ) {
    await this.syncHistory.record(tx, input);
  }

  /**
   * Pull incremental: devolve as mudanças com `seq` maior que o cursor, na
   * ordem do servidor, paginadas. Exclusões vêm como tombstones
   * (`deleted: true`) para o desktop remover o registro.
   */
  async pull(query: SyncPullQueryDto, currentUser: CurrentUser) {
    const cursor = Math.max(query.cursor ?? 0, 0);
    const take = Math.min(Math.max(query.limit ?? 200, 1), PULL_MAX_LIMIT);

    const eventIds = await this.accessibleEventIds(currentUser, query.eventId);

    if (eventIds.length === 0) {
      return {
        changes: [],
        nextCursor: cursor,
        hasMore: false,
        serverTime: new Date().toISOString(),
      };
    }

    const rows = await this.prisma.syncChange.findMany({
      where: { seq: { gt: cursor }, eventId: { in: eventIds } },
      orderBy: { seq: 'asc' },
      take: take + 1,
    });

    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    const nextCursor = page.length ? page[page.length - 1].seq : cursor;

    return {
      changes: page.map((row) => ({
        seq: row.seq,
        eventId: row.eventId,
        entityType: row.entityType,
        entityId: row.entityId,
        version: row.version,
        op: row.op,
        deleted: row.deleted,
        payload: row.payload,
        deviceId: row.deviceId,
        userId: row.userId,
        createdAt: row.createdAt.toISOString(),
      })),
      nextCursor,
      hasMore,
      serverTime: new Date().toISOString(),
    };
  }

  /**
   * Resolução de conflito: exige perfil autorizado e grava a decisão em
   * auditoria. KEEP_LOCAL reaplica o payload local sobre o central;
   * KEEP_CENTRAL apenas encerra o conflito (o desktop adota o central).
   */
  async resolveConflict(
    dto: SyncConflictResolveDto,
    currentUser: CurrentUser,
  ) {
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.ORGANIZADOR
    ) {
      throw new ForbiddenException(
        'Apenas ADMIN ou ORGANIZADOR pode resolver conflitos de sincronização',
      );
    }

    const conflict = await this.prisma.syncConflict.findUnique({
      where: { id: dto.conflictId },
    });
    if (!conflict) {
      throw new NotFoundException('Conflito não encontrado');
    }
    if (conflict.status !== 'OPEN') {
      throw new BadRequestException('Conflito já resolvido');
    }

    if (dto.resolution === 'KEEP_CENTRAL') {
      const resolved = await this.prisma.syncConflict.update({
        where: { id: dto.conflictId },
        data: {
          status: 'RESOLVED',
          resolution: dto.resolution,
          resolvedById: currentUser.id,
          resolvedAt: new Date(),
        },
      });
      await this.audit.register({
        usuario: { id: currentUser.id, nome: '', papel: currentUser.role },
        acao: 'RESOLUCAO_CONFLITO',
        entidade: conflict.entityType,
        entidadeId: conflict.entityId,
        detalhe: `Conflito resolvido mantendo a versão central (v${conflict.centralVersion})`,
        origem: 'SISTEMA',
      });
      return resolved;
    }

    // KEEP_LOCAL
    let appliedVersion = conflict.centralVersion;
    const updated = await this.prisma.$transaction(async (tx) => {
      if (conflict.entityType === 'ATHLETE') {
        const fields = this.athleteFields(
          (conflict.localPayload as Record<string, unknown>) ?? {},
        );
        const athlete = await tx.athlete.update({
          where: { id: conflict.entityId },
          data: { ...fields, version: { increment: 1 } },
        });
        appliedVersion = athlete.version;
        await this.syncHistory.record(tx, {
          eventId: conflict.eventId,
          entityType: 'ATHLETE',
          entityId: athlete.id,
          version: athlete.version,
          payload: athlete as unknown as Prisma.InputJsonValue,
          userId: currentUser.id,
        });
      }
      return tx.syncConflict.update({
        where: { id: dto.conflictId },
        data: {
          status: 'RESOLVED',
          resolution: dto.resolution,
          resolvedById: currentUser.id,
          resolvedAt: new Date(),
        },
      });
    });

    await this.audit.register({
      usuario: { id: currentUser.id, nome: '', papel: currentUser.role },
      acao: 'RESOLUCAO_CONFLITO',
      entidade: conflict.entityType,
      entidadeId: conflict.entityId,
      detalhe: `Conflito resolvido mantendo a versão local (base v${conflict.baseVersion}, gravada como v${appliedVersion})`,
      origem: 'SISTEMA',
    });

    return updated;
  }

  async listConflicts(eventId: string | undefined, currentUser: CurrentUser) {
    // Sem eventId, lista os conflitos de todos os eventos acessíveis ao usuário.
    const eventIds = await this.accessibleEventIds(currentUser, eventId);
    if (eventIds.length === 0) {
      return [];
    }
    return this.prisma.syncConflict.findMany({
      where: { eventId: { in: eventIds }, status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Consulta o resultado de uma operação (usado pelo desktop ao reconectar). */
  async describeOperation(operationId: string, currentUser: CurrentUser) {
    const operation = await this.prisma.syncOperation.findUnique({
      where: { operationId },
    });
    if (!operation) {
      throw new NotFoundException('Operação não encontrada');
    }
    if (
      currentUser.role !== UserRole.ADMIN &&
      operation.userId !== currentUser.id
    ) {
      throw new ForbiddenException('Acesso negado à operação');
    }
    const conflict = await this.prisma.syncConflict.findFirst({
      where: { operationId },
    });
    return {
      operationId: operation.operationId,
      status: operation.status,
      detail: operation.detail,
      appliedAt: operation.appliedAt.toISOString(),
      conflictId: conflict?.id ?? null,
    };
  }

  // --------------------------------------------------------------------- //
  // Autorização
  // --------------------------------------------------------------------- //

  private async assertEventAccess(eventId: string, currentUser: CurrentUser) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, date: true },
    });
    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }
    if (currentUser.role === UserRole.ADMIN) return;

    const organizerId =
      currentUser.role === UserRole.ORGANIZADOR
        ? currentUser.id
        : currentUser.organizerId;
    if (!organizerId) {
      throw new ForbiddenException('Acesso negado ao evento');
    }

    const link = await this.prisma.eventUser.findUnique({
      where: { eventId_userId: { eventId, userId: organizerId } },
      select: { eventId: true },
    });
    if (!link || !this.isWithinAccessWindow(event.date)) {
      throw new ForbiddenException(
        'Acesso ao evento expirado ou não vinculado',
      );
    }
  }

  private async accessibleEventIds(
    currentUser: CurrentUser,
    onlyEventId?: string,
  ): Promise<string[]> {
    if (onlyEventId) {
      await this.assertEventAccess(onlyEventId, currentUser);
      return [onlyEventId];
    }
    if (currentUser.role === UserRole.ADMIN) {
      const all = await this.prisma.event.findMany({ select: { id: true } });
      return all.map((event) => event.id);
    }

    const organizerId =
      currentUser.role === UserRole.ORGANIZADOR
        ? currentUser.id
        : currentUser.organizerId;
    if (!organizerId) return [];

    const links = await this.prisma.eventUser.findMany({
      where: { userId: organizerId },
      select: { event: { select: { id: true, date: true } } },
    });
    return links
      .map((link) => link.event)
      .filter((event) => this.isWithinAccessWindow(event.date))
      .map((event) => event.id);
  }

  private isWithinAccessWindow(eventDate: Date): boolean {
    const expiresAt = new Date(
      eventDate.getTime() + ACCESS_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    return new Date() <= expiresAt;
  }

  // --------------------------------------------------------------------- //
  // Mapeamento de campos
  // --------------------------------------------------------------------- //

  /** Whitelist explícita: o desktop nunca escreve campo fora desta lista. */
  private athleteFields(
    payload: Record<string, unknown>,
  ): Prisma.AthleteUncheckedUpdateInput {
    const allowed = [
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
    const out: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in payload) {
        out[key] = payload[key] === undefined ? null : payload[key];
      }
    }
    return out as Prisma.AthleteUncheckedUpdateInput;
  }

  private async logFieldChanges(
    before: Record<string, unknown>,
    fields: Record<string, unknown>,
    operation: SyncOperationDto,
    eventId: string,
    currentUser: CurrentUser,
  ) {
    const changes = Object.entries(fields)
      .filter(([key, value]) => !this.sameValue(before[key], value))
      .map(([campo, value]) => ({ campo, de: before[campo], para: value }));
    if (!changes.length) return;

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true },
    });

    await this.audit.logFieldChanges(changes, {
      usuario: { id: currentUser.id, nome: '', papel: currentUser.role },
      entidade: 'ATLETA',
      entidadeId: operation.entityId,
      evento: event?.name,
      acao: this.inferAction(operation),
      origem: 'DESKTOP',
    });
  }

  private inferAction(operation: SyncOperationDto): string {
    if (operation.opType === 'DELIVER') return 'ENTREGA_KIT';
    if (operation.opType === 'REVERSE') return 'ESTORNO_ENTREGA';
    if (operation.opType === 'RESET_DELIVERIES') return 'ZERAR_ENTREGAS';
    return 'EDICAO_ATLETA';
  }

  private sameValue(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null && b === undefined) return true;
    if (a === undefined && b === null) return true;
    if (a instanceof Date || b instanceof Date) {
      return new Date(a as string).getTime() === new Date(b as string).getTime();
    }
    return false;
  }
}
