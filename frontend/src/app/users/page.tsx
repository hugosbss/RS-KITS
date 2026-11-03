import type { Metadata } from 'next';
import { RequireAuth } from '@/components/providers/require-auth';
import { UsersShell } from '@/components/users/users';

export default function UsersPage() {
  return (
    <RequireAuth>
      <UsersShell />
    </RequireAuth>
  );
}

export const metadata: Metadata = { title: 'Usuarios' };
