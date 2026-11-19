'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2, Package, RefreshCw } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { useAppState } from '@/components/providers/app-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  fetchDownloads,
  fetchExecutable,
  type AppDownload,
} from '@/services/api';
import { downloadBlob, sanitizePart } from '@/services/distribution';

export function DownloadsShell() {
  const { currentUser, events, token } = useAppState();
  const [files, setFiles] = useState<AppDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [eventId, setEventId] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    setEventId(new URLSearchParams(window.location.search).get('evento') ?? '');
  }, []);
  useEffect(() => {
    let active = true;
    if (currentUser.role !== 'ADMIN') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    fetchDownloads(token)
      .then((list) => {
        if (active) setFiles(list);
      })
      .catch((error) => {
        if (active) setError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reload, token, currentUser.role]);
  const executable = files
    .filter((file) => file.platform === 'windows' && file.supportsEmbeddedData)
    .sort((a, b) =>
      b.file.localeCompare(a.file, undefined, { numeric: true }),
    )[0];
  const download = async (withEvent: boolean) => {
    if (!executable || busy || (withEvent && !eventId)) return;
    setBusy(withEvent ? 'event' : 'clean');
    setError('');
    try {
      const blob = await fetchExecutable(
        executable.file,
        token,
        withEvent ? eventId : undefined,
      );
      const name = withEvent
        ? (events.find((event) => event.id === eventId)?.name ?? 'evento')
        : 'limpo';
      downloadBlob(blob, `RS-KITS-${sanitizePart(name)}.exe`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Falha ao preparar o download.',
      );
    } finally {
      setBusy(null);
    }
  };
  if (currentUser.role !== 'ADMIN')
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="p-6 lg:ml-64">
          <Card className="p-6">Acesso restrito a administradores.</Card>
        </main>
      </div>
    );
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar />
      <main className="space-y-6 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-medium text-slate-900">Downloads</h1>
          </div>
          <Button
            variant="outline"
            disabled={loading || !!busy}
            onClick={() => setReload((value) => value + 1)}
          >
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
        </header>
        {!loading && !executable && (
          <Card className="border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            Nenhuma versão Windows compatível foi publicada. Gere uma nova build
            e publique o executável junto com o arquivo .exe.json.
          </Card>
        )}
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="flex flex-col items-start border-slate-200 p-6">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Download className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-medium">Aplicativo limpo</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
              Sem eventos, atletas ou usuários cadastrados. Começa apenas com o
              administrador padrão, em um perfil separado dos eventos.
            </p>
            <Button
              className="mt-6 bg-blue-600 hover:bg-blue-700"
              disabled={loading || !executable || !!busy}
              onClick={() => void download(false)}
            >
              {busy === 'clean' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}{' '}
              Baixar executável limpo
            </Button>
          </Card>
          {currentUser.role === 'ADMIN' && (
            <Card className="flex flex-col items-start border-slate-200 p-6">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <Package className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-medium">
                Aplicativo com evento
              </h2>
              <label className="mt-5 w-full text-xs font-medium text-slate-500">
                Evento
                <select
                  className="mt-2 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-normal text-slate-900"
                  value={eventId}
                  disabled={!!busy}
                  onChange={(event) => setEventId(event.target.value)}
                >
                  <option value="">Selecione o evento</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                className="mt-6 bg-blue-600 hover:bg-blue-700"
                disabled={
                  loading ||
                  !executable ||
                  !!busy ||
                  !events.some((event) => event.id === eventId)
                }
                onClick={() => void download(true)}
              >
                {busy === 'event' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}{' '}
                Baixar executável com evento
              </Button>
            </Card>
          )}
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
