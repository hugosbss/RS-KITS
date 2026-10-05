import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ChangeOp = 'UPSERT' | 'DELETE';

export type RecordChangeInput = {
  eventId: string | null;
  entityType: string;
  entityId: string;
  version: number;
  op?: ChangeOp;
  payload?: Prisma.InputJsonValue | null;
  deviceId?: string | null;
  userId?: string | null;
};

/**
 * Cliente aceito por `recordChange`: a própria transação quando existe, para
 * que a alteração de negócio e o histórico de sincronização sejam gravados
 * juntos (ou nenhum dos dois).
 */
export type SyncWriter = PrismaService | Prisma.TransactionClient;

@Injectable()
export class SyncHistoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Grava uma entrada no histórico central de sincronização.
   * `seq` é gerado pelo servidor e é o cursor devolvido no pull — o relógio do
   * cliente nunca determina a ordem.
   */
  async record(
    writer: SyncWriter,
    input: RecordChangeInput,
  ): Promise<{ seq: number }> {
    const row = await writer.syncChange.create({
      data: {
        eventId: input.eventId,
        entityType: input.entityType,
        entityId: input.entityId,
        version: input.version,
        op: input.op ?? 'UPSERT',
        payload: input.payload ?? undefined,
        deleted: input.op === 'DELETE',
        deviceId: input.deviceId ?? null,
        userId: input.userId ?? null,
      },
      select: { seq: true },
    });
    return row;
  }
}

/**
 * Atalho usado pelos demais serviços: registra a mudança na transação atual
 * quando houver uma aberta, senão usa a própria conexão.
 */
export async function recordChange(
  prisma: PrismaService,
  input: RecordChangeInput,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const writer: SyncWriter = tx ?? prisma;
  await writer.syncChange.create({
    data: {
      eventId: input.eventId,
      entityType: input.entityType,
      entityId: input.entityId,
      version: input.version,
      op: input.op ?? 'UPSERT',
      payload: input.payload ?? undefined,
      deleted: input.op === 'DELETE',
      deviceId: input.deviceId ?? null,
      userId: input.userId ?? null,
    },
  });
}
