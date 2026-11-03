'use client';
import { navigateTo, replaceLocation } from '@/services/navigation';

import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { useAppState } from '@/components/providers/app-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
export function SettingsShell() {
  const { currentUser } = useAppState();
  useEffect(() => {
    if (
      currentUser.role === 'ADMIN' &&
      new URLSearchParams(window.location.search).get('tab') === 'evento'
    ) {
      replaceLocation('/events?criar=1');
    }
  }, [currentUser.role]);
  if (currentUser.role === 'OPERADOR') return null;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar />
      <main className="space-y-6 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <header>
          <h1 className="text-3xl font-black">Configurações</h1>
          <p className="mt-2 text-sm text-slate-500">
            Acesse a gestão do sistema e as opções do aplicativo desktop.
          </p>
        </header>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigateTo('/users')}>
            Gerenciar usuários
          </Button>
          <Button variant="outline" onClick={() => navigateTo('/downloads')}>
            Downloads do aplicativo
          </Button>
          {currentUser.role === 'ADMIN' && (
            <Button variant="outline" onClick={() => navigateTo('/events')}>
              Gerenciar eventos
            </Button>
          )}
        </div>
        <Card className="p-6">
          <p className="text-sm text-slate-600">
            Os aplicativos limpos e com dados de eventos estão disponíveis em
            Downloads. Cadastros e vínculos são gerenciados em Usuários e
            Eventos.
          </p>
        </Card>
      </main>
    </div>
  );
}
