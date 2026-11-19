import type { Metadata } from 'next';
import { RequireAuth } from '@/components/providers/require-auth';
import { DeliveryShell } from '@/components/delivery/delivery';

export default function DeliveryPage() {
  return (
    <RequireAuth>
      <DeliveryShell />
    </RequireAuth>
  );
}

export const metadata: Metadata = { title: 'Entrega de kits' };
