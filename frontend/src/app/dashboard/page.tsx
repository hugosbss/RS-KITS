import type { Metadata } from 'next';
import { RequireAuth } from '@/components/providers/require-auth';
import { Dashboard } from '@/components/dashboard/dashboard';

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
export const metadata: Metadata = { title: 'Dashboard' };
