import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(data: {
    action: string;
    entity?: string;
    entityId?: string;
    userId?: string;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.auditLog.create({
      data: {
        ...data,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  findAll() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
