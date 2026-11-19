import type { Metadata } from 'next';
import { RequireAuth } from '@/components/providers/require-auth';
import { DownloadsShell } from '@/components/downloads/downloads';

export const metadata: Metadata = { title: 'Downloads' };
export default function DownloadsPage() {
  return (
    <RequireAuth>
      <DownloadsShell />
    </RequireAuth>
  );
}
