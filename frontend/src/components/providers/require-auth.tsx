'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppState } from '@/components/providers/app-context';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrated, sessionExpired } = useAppState();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      const next = `${pathname ?? '/dashboard'}${window.location.search}`;
      router.replace(
        `/login?next=${encodeURIComponent(next)}${sessionExpired ? '&reason=expired' : ''}`,
      );
    }
  }, [isAuthenticated, hydrated, router, pathname, sessionExpired]);

  if (!hydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
