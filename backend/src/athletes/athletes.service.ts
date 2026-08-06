import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AthletesService {
  constructor(private readonly prisma: PrismaService) {}

  search(eventId?: string, q?: string) {
    return this.prisma.athlete.findMany({
      where: {
        ...(eventId ? { eventId } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { cpf: { contains: q } },
                ...(Number.isNaN(Number(q)) ? [] : [{ num: Number(q) }]),
              ],
            }
          : {}),
      },
      take: 50,
      orderBy: { name: 'asc' },
    });
  }
}
