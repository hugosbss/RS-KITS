import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DeliveriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.delivery.findMany({
      include: {
        athlete: true,
        operator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { deliveredAt: 'desc' },
      take: 100,
    });
  }
}
