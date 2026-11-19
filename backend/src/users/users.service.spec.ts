import { ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '../prisma/enums/user-role.enum';

describe('event user visibility', () => {
  const prisma = {
    event: { findUnique: jest.fn() },
    user: { findMany: jest.fn() },
  };
  const service = new UsersService(
    prisma as unknown as PrismaService,
    {} as AuditService,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.event.findUnique.mockResolvedValue({
      organizers: [{ userId: 'owner' }],
    });
    prisma.user.findMany.mockResolvedValue([]);
  });
  it('rejects an organizer requesting users of an unrelated event', async () => {
    await expect(
      service.findAll({ id: 'foreign', role: UserRole.ORGANIZADOR }, 'event'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
  it('limits an event list to linked organizers and their operators', async () => {
    await service.findAll({ id: 'admin', role: UserRole.ADMIN }, 'event');
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { id: { in: ['owner'] }, role: UserRole.ORGANIZADOR },
            { organizerId: { in: ['owner'] }, role: UserRole.OPERATOR },
          ],
        },
      }),
    );
  });
  it('keeps an organizer restricted to their own event users', async () => {
    prisma.event.findUnique.mockResolvedValue({
      organizers: [{ userId: 'owner' }, { userId: 'other' }],
    });
    await service.findAll({ id: 'owner', role: UserRole.ORGANIZADOR }, 'event');
    expect(
      prisma.user.findMany.mock.calls[0][0].where.OR[1].organizerId.in,
    ).toEqual(['owner']);
  });
});
