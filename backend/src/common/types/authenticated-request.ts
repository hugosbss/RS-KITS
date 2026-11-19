import type { Request } from 'express';
import type { UserRole } from '../../prisma/enums/user-role.enum';
export type AuthenticatedRequest = Request & {
  user: {
    id: string;
    name: string;
    email?: string | null;
    role: UserRole;
    organizerId?: string | null;
  };
};
