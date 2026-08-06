import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { SyncEventDto } from './dto/sync-event.dto';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async processEvents(dto: SyncEventDto) {
    const results = [];

    for (const event of dto.events) {
      await this.prisma.syncLog.create({
        data: {
          operation: event.operation as never,
          entity: event.entity,
          entityId: event.entityId,
          deviceId: event.deviceId ?? dto.deviceId,
          userId: event.userId,
          payload: (event.payload ?? {}) as Prisma.InputJsonValue,
        },
      });

      results.push({
        entityId: event.entityId,
        status: 'accepted',
      });
    }

    return { processed: results.length, results };
  }
}
