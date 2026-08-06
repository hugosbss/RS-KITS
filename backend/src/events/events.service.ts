import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.event.findMany({
      include: { organization: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
