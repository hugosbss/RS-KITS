import type { Metadata } from 'next';
import { RequireAuth } from '@/components/providers/require-auth';
import { EventsShell } from '@/components/events/events';

export default function EventsPage() {
  return (
    <RequireAuth>
      <EventsShell />
    </RequireAuth>
  );
}

export const metadata: Metadata = { title: 'Eventos' };
