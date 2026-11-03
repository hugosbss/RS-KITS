import type { Metadata } from 'next';
import { RequireAuth } from '@/components/providers/require-auth';
import { ReportShell } from '@/components/reports/reports';

export default function ReportsPage() {
  return (
    <RequireAuth>
      <ReportShell />
    </RequireAuth>
  );
}

export const metadata: Metadata = { title: 'Relatorios' };
