'use client';
import { navigateTo } from '@/services/navigation';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  Download,
  Link2,
  Loader2,
  Package,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useAppState, type AppEvent } from '@/components/providers/app-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Toast } from '@/components/ui/toast';
import {
  buildEventPackage,
  downloadPackage,
  loadPackageAthletes,
  type RSKITSPackage,
} from '@/services/package';
import {
  addEventOrganizer,
  removeEventOrganizer,
  fetchEventOrganizers,
  fetchDownloads,
  API_URL,
  type AppDownload,
} from '@/services/api';
import { OrganizerCombobox } from '@/components/settings/combobox-organizer';
import { UfCombobox } from '@/components/settings/combobox-uf';
import {
  TOAST_DURATION_MS,
  EMPTY_EVENT_FORM,
  toPlace,
  splitPlace,
} from '@/components/settings/types';
const downloadHref = (download: AppDownload) => {
  // Compatível com API_URL relativa (web, /api) e absoluta (desktop,
  // http://127.0.0.1:19090/api). download.url é sempre um caminho absoluto.
  const base = API_URL.startsWith('http')
    ? API_URL
    : `${window.location.origin}${API_URL}`;
  return new URL(download.url, base.endsWith('/') ? base : `${base}/`).href;
};
export function EventManagement({
  desktopOnly = false,
  query = '',
  status = 'TODOS',
  showCreate = false,
  onCloseCreate = () => {},
}: {
  desktopOnly?: boolean;
  query?: string;
  status?: AppEvent['status'] | 'TODOS';
  showCreate?: boolean;
  onCloseCreate?: () => void;
}) {
  const {
    currentUser,
    users,
    events,
    athletesByEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    token,
    selectEvent,
    selectedEventId,
  } = useAppState();
  const [toast, setToast] = useState<{
    message: string;
    error?: boolean;
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<AppEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [linkedOrgIds, setLinkedOrgIds] = useState<Record<string, string[]>>(
    {},
  );
  const [confirmLink, setConfirmLink] = useState<{
    organizer: (typeof users)[number];
    currentEvent: string;
    otherEvent: string;
  } | null>(null);
  const [packageModal, setPackageModal] = useState<{
    pkg: RSKITSPackage;
    organizerName?: string;
  } | null>(null);
  const [downloads, setDownloads] = useState<AppDownload[]>([]);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [prep, setPrep] = useState<{
    event: AppEvent;
    percent: number;
    step: string;
    status: 'preparing' | 'done' | 'error';
    error?: string;
  } | null>(null);
  const prepDownloadRef = useRef<AppDownload | null>(null);
  const prepCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAdmin = currentUser.role === 'ADMIN';
  // Prefere o instalador oficial por plataforma: RS-KITS-Setup-*.exe (Windows)
  // e RS-KITS-*.AppImage (Linux); outros artefatos (exe puro, deb) ficam só
  // como alternativa caso o instalador ainda não tenha sido publicado.
  const windowsDownload =
    downloads
      .filter((d) => d.platform === 'windows')
      .sort(
        (a, b) => Number(/setup/i.test(b.file)) - Number(/setup/i.test(a.file)),
      )[0] ?? null;
  const linuxDownload =
    downloads
      .filter((d) => d.platform === 'linux')
      .sort(
        (a, b) =>
          Number(/\.appimage$/i.test(b.file)) -
          Number(/\.appimage$/i.test(a.file)),
      )[0] ?? null;
  const showToast = useCallback((message: string, error = false) => {
    setToast({ message, error });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (prepCloseTimer.current) clearTimeout(prepCloseTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (showCreate) setEventForm(EMPTY_EVENT_FORM);
  }, [showCreate]);
  // Carrega os organizadores vinculados de cada evento (painel direito).
  useEffect(() => {
    if (!token || !isAdmin || !events.length) return;
    events.forEach((event) => {
      if (!linkedOrgIds[event.id])
        void loadLinkedOrganizers(event.id).catch(() =>
          showToast(
            'Não foi possível carregar os organizadores do evento.',
            true,
          ),
        );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, events, isAdmin]);
  // Instaladores do app desktop (Linux/Windows) servidos pelo backend web.
  useEffect(() => {
    let alive = true;
    if (!isAdmin || !token) return;
    fetchDownloads(token)
      .then((list) => alive && setDownloads(list))
      .catch(() => {}); // versão desktop/offline não expõe downloads.
    return () => {
      alive = false;
    };
  }, [isAdmin, token]);
  const organizers = users.filter((user) => user.role === 'ORGANIZADOR');
  const organizerById = Object.fromEntries(
    organizers.map((user) => [user.id, user.name]),
  );
  if (!isAdmin) return null;
  const createNovoEvento = async (event: FormEvent) => {
    event.preventDefault();
    if (!eventForm.name.trim() || busy) return;
    setBusy(true);
    try {
      const created = await createEvent({
        name: eventForm.name.trim(),
        date: eventForm.date || '',
        place: toPlace(eventForm.city, eventForm.uf),
      });
      if (token && eventForm.organizerId) {
        try {
          await addEventOrganizer(token, created.id, eventForm.organizerId);
        } catch (error) {
          onCloseCreate();
          showToast(
            `Evento criado, mas o vínculo não foi salvo: ${error instanceof Error ? error.message : 'tente novamente'}`,
            true,
          );
          return;
        }
      }
      setEventForm(EMPTY_EVENT_FORM);
      showToast('Evento criado com sucesso');
      onCloseCreate();
      void loadLinkedOrganizers(created.id).catch(() =>
        showToast(
          'Evento criado. Não foi possível carregar seus vínculos.',
          true,
        ),
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Não foi possível criar o evento.',
        true,
      );
    } finally {
      setBusy(false);
    }
  };
  // Monta o pacote .rksits exclusivo do evento (event.id da linha) com os
  // atletas daquele evento e o organizador vinculado àquele evento.
  const buildEventPackageData = async (
    event: AppEvent,
  ): Promise<RSKITSPackage | null> => {
    const athletes = await loadPackageAthletes(
      token,
      event.id,
      athletesByEvent[event.id],
    );
    if (athletes.length === 0) {
      showToast('Este evento ainda não possui atletas importados.');
      return null;
    }
    const organizerUserId = (linkedOrgIds[event.id] ?? [])[0];
    const organizer = organizerUserId
      ? (users.find((user) => user.id === organizerUserId) ?? null)
      : null;
    return buildEventPackage({
      event,
      athletes,
      organizer,
      createdBy: currentUser.name,
    });
  };
  // Geração EXPLÍCITA do .rksits (botão separado de geração do executável).
  // loading = true -> geração -> sucesso/erro -> loading = false (try/finally).
  const generatePackage = async (event: AppEvent) => {
    if (generatingId) return;
    setGeneratingId(event.id);
    try {
      const pkg = await buildEventPackageData(event);
      if (pkg) setPackageModal({ pkg, organizerName: pkg.organizer?.name });
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Não foi possível gerar o executável.',
        true,
      );
    } finally {
      setGeneratingId(null);
    }
  };

  // Downloads personalizados ficam na rota dedicada.
  const prepareAndDownload = async (
    event: AppEvent,
    download: AppDownload | null,
  ) => {
    if (prep?.status === 'preparing') return;
    prepDownloadRef.current = download;
    setPrep({
      event,
      percent: 0,
      step: 'Iniciando preparação',
      status: 'preparing',
    });
    try {
      if (!event.id) throw new Error('Evento inválido.');
      setPrep((p) =>
        p ? { ...p, percent: 20, step: 'Carregando evento' } : p,
      );
      navigateTo(`/downloads?evento=${encodeURIComponent(event.id)}`);
      setPrep(null);
      showToast('RS KITS do evento preparado e download iniciado.');
      if (prepCloseTimer.current) clearTimeout(prepCloseTimer.current);
      prepCloseTimer.current = setTimeout(() => setPrep(null), 1600);
    } catch (err) {
      setPrep((p) =>
        p
          ? {
              ...p,
              status: 'error',
              error:
                err instanceof Error
                  ? err.message
                  : 'Não foi possível preparar o RS KITS.',
            }
          : p,
      );
    }
  };
  const setEventOrganizer = (organizerId: string | null) => {
    setEventForm((prev) => ({ ...prev, organizerId }));
  };
  const handleSelectOrganizer = (organizerId: string | null) => {
    if (!organizerId) {
      setEventOrganizer(null);
      return;
    }
    if (organizerId === eventForm.organizerId) return;
    const organizer = organizers.find((o) => o.id === organizerId);
    if (!organizer) {
      setEventOrganizer(organizerId);
      return;
    }
    const currentEventId = editingEvent?.id ?? null;
    const otherEvent = events.find(
      (event) =>
        event.id !== currentEventId &&
        (linkedOrgIds[event.id] ?? []).includes(organizerId),
    );
    if (otherEvent) {
      setConfirmLink({
        organizer,
        currentEvent:
          eventForm.name.trim() || (editingEvent?.name ?? 'novo evento'),
        otherEvent: otherEvent.name,
      });
      return;
    }
    setEventOrganizer(organizerId);
  };
  const confirmLinkOrganizer = () => {
    if (confirmLink) setEventOrganizer(confirmLink.organizer.id);
    setConfirmLink(null);
  };
  const loadLinkedOrganizers = (eventId: string): Promise<string[]> => {
    if (!token) return Promise.resolve([]);
    return fetchEventOrganizers(token, eventId).then((linked) => {
      const ids = linked.map((organizer) => organizer.id);
      setLinkedOrgIds((current) => ({ ...current, [eventId]: ids }));
      return ids;
    });
  };
  const openEditEvent = async (event: AppEvent) => {
    if (busy) return;
    setBusy(true);
    try {
      const ids = await loadLinkedOrganizers(event.id);
      const { city, uf } = splitPlace(event.place ?? '');
      setEventForm({
        name: event.name,
        date: event.date,
        city,
        uf,
        organizerId: ids[0] ?? null,
      });
      setEditingEvent(event);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar o evento.',
        true,
      );
    } finally {
      setBusy(false);
    }
  };
  const saveEditEvent = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!editingEvent || !eventForm.name.trim() || busy) return;
    setBusy(true);
    try {
      await updateEvent(editingEvent.id, {
        name: eventForm.name.trim(),
        date: eventForm.date || 'Data a definir',
        place: toPlace(eventForm.city, eventForm.uf) || 'Local a definir',
      });
      if (token) {
        const current =
          linkedOrgIds[editingEvent.id] ??
          (await loadLinkedOrganizers(editingEvent.id));
        const currentId = current[0] ?? null;
        try {
          if (eventForm.organizerId && eventForm.organizerId !== currentId) {
            await addEventOrganizer(
              token,
              editingEvent.id,
              eventForm.organizerId,
            );
            if (currentId)
              await removeEventOrganizer(token, editingEvent.id, currentId);
          } else if (!eventForm.organizerId && currentId) {
            await removeEventOrganizer(token, editingEvent.id, currentId);
          }
        } catch (err) {
          showToast(
            err instanceof Error
              ? err.message
              : 'Não foi possível atualizar o organizador vinculado.',
            true,
          );
          return;
        }
        await loadLinkedOrganizers(editingEvent.id);
      }
      setEditingEvent(null);
      setEventForm(EMPTY_EVENT_FORM);
      showToast('Evento atualizado com sucesso.');
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o evento.',
        true,
      );
    } finally {
      setBusy(false);
    }
  };
  const confirmDeleteEvent = async () => {
    if (!deletingEvent || busy) return;
    setBusy(true);
    try {
      await deleteEvent(deletingEvent.id);
      setDeletingEvent(null);
      showToast('Evento excluído com sucesso.');
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o evento.',
        true,
      );
    } finally {
      setBusy(false);
    }
  };

  const fieldInput =
    'mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal';
  const visibleEvents = events.filter(
    (event) =>
      (status === 'TODOS' || event.status === status) &&
      `${event.name} ${event.place} ${(linkedOrgIds[event.id] ?? []).map((id) => organizerById[id]).join(' ')}`
        .toLocaleLowerCase('pt-BR')
        .includes(query.trim().toLocaleLowerCase('pt-BR')),
  );
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-bold">
            {desktopOnly
              ? 'Aplicativo e pacotes de eventos'
              : 'Lista de eventos'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {desktopOnly
              ? 'Prepare os dados do evento para operar com o aplicativo desktop.'
              : 'Selecione o evento da operação ou gerencie seus dados e organizadores.'}
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {visibleEvents.map((event) => (
            <div
              key={event.id}
              className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${selectedEventId === event.id && !desktopOnly ? 'bg-blue-50/60' : ''}`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold">{event.name}</h3>
                  {!desktopOnly && (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {
                        {
                          EM_ANDAMENTO: 'Em andamento',
                          PROXIMO: 'Próximo',
                          FINALIZADO: 'Finalizado',
                          RASCUNHO: 'Rascunho',
                        }[event.status]
                      }
                    </span>
                  )}
                  {!desktopOnly && selectedEventId === event.id && (
                    <span className="text-xs font-bold text-blue-600">
                      Selecionado
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {event.date} ·{event.place} ·
                  {athletesByEvent[event.id]?.length ?? 0} atletas
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  {(linkedOrgIds[event.id] ?? [])
                    .map((id) => organizerById[id])
                    .filter(Boolean)
                    .join(', ') || 'Sem organizador vinculado'}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {desktopOnly ? (
                  <>
                    {windowsDownload && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void prepareAndDownload(event, windowsDownload)
                        }
                      >
                        <Download className="h-4 w-4" /> Windows
                      </Button>
                    )}
                    {linuxDownload && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void prepareAndDownload(event, linuxDownload)
                        }
                      >
                        <Download className="h-4 w-4" /> Linux
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!!generatingId}
                      onClick={() => void generatePackage(event)}
                    >
                      {generatingId === event.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Package className="h-4 w-4" />
                      )}{' '}
                      Pacote do evento
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectEvent(event.id)}
                    >
                      Selecionar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigateTo(
                          `/downloads?evento=${encodeURIComponent(event.id)}`,
                        )
                      }
                    >
                      <Download className="h-4 w-4" /> Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigateTo(
                          `/users?evento=${encodeURIComponent(event.id)}`,
                        )
                      }
                    >
                      <Link2 className="h-4 w-4" /> Usuários
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Editar ${event.name}`}
                      disabled={busy}
                      onClick={() => void openEditEvent(event)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600"
                      aria-label={`Excluir ${event.name}`}
                      onClick={() => setDeletingEvent(event)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {!visibleEvents.length && (
            <p className="p-10 text-center text-sm text-slate-500">
              Nenhum evento encontrado.
            </p>
          )}
        </div>
      </Card>
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-event-title"
        >
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => !busy && onCloseCreate()}
            aria-hidden="true"
          />
          <div className="relative h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 id="create-event-title" className="text-xl font-bold">
                Criar evento
              </h2>
              <Button
                variant="ghost"
                aria-label="Fechar cadastro"
                onClick={() => !busy && onCloseCreate()}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Cadastre a prova e selecione o organizador responsável.
            </p>
            <form
              onSubmit={createNovoEvento}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              <label className="text-sm font-semibold">
                Nome do evento
                <input
                  required
                  value={eventForm.name}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, name: e.target.value })
                  }
                  className={fieldInput}
                />
              </label>
              <label className="text-sm font-semibold">
                Data
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, date: e.target.value })
                  }
                  className={fieldInput}
                />
              </label>
              <label className="text-sm font-semibold">
                Cidade
                <input
                  value={eventForm.city}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, city: e.target.value })
                  }
                  placeholder="Ex.: São Paulo"
                  className={fieldInput}
                />
              </label>
              <label className="text-sm font-semibold">
                UF
                <UfCombobox
                  value={eventForm.uf}
                  onChange={(uf) => setEventForm({ ...eventForm, uf })}
                />
              </label>
              <div className="sm:col-span-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Link2 className="h-4 w-4 text-blue-600" /> Organizador
                  responsável
                </span>
                <p className="mt-0.5 text-xs text-slate-400">
                  Busque pelo nome do organizador que terá acesso a este evento.
                </p>
                <OrganizerCombobox
                  organizers={organizers}
                  value={eventForm.organizerId}
                  onChange={handleSelectOrganizer}
                  placeholder="Buscar organizador..."
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => !busy && onCloseCreate()}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={busy}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CalendarDays className="mr-2 h-4 w-4" /> Criar evento
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {packageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setPackageModal(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">Executável do evento</h2>
                <p className="text-sm text-slate-500">
                  {packageModal.pkg.event.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPackageModal(null)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                <span>Atletas no pacote</span>
                <span className="font-medium text-slate-900">
                  {packageModal.pkg.athletes.length.toLocaleString('pt-BR')}
                </span>
              </li>
              <li className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                <span>Organizador</span>
                <span className="font-medium text-slate-900">
                  {packageModal.organizerName ?? 'Não vinculado'}
                </span>
              </li>
              <li className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                <span>URL de sincronização</span>
                <span className="break-all font-medium text-slate-900">
                  {packageModal.pkg.config.cloudUrl}
                </span>
              </li>
            </ul>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPackageModal(null)}>
                Fechar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (packageModal) downloadPackage(packageModal.pkg);
                }}
              >
                <Package className="mr-2 h-4 w-4" /> Baixar .rksits
              </Button>
              {windowsDownload ? (
                <a
                  href={downloadHref(windowsDownload)}
                  onClick={(e) => {
                    e.preventDefault();
                    if (packageModal)
                      void prepareAndDownload(
                        packageModal.pkg.event,
                        windowsDownload,
                      );
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" /> Baixar para Windows
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-400">
                  <Download className="h-4 w-4" /> Baixar para Windows
                </span>
              )}
              <p
                className="truncate text-xs text-slate-400"
                title={windowsDownload?.file}
              >
                {windowsDownload
                  ? 'Instalador Windows baixado.'
                  : 'Nenhum instalador disponível.'}
              </p>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} error={toast.error} />}

      {prep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => {
              if (prep.status !== 'preparing') setPrep(null);
            }}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">
                  {prep.status === 'error'
                    ? 'Não foi possível preparar o RS KITS'
                    : prep.status === 'done'
                      ? 'Preparação concluída!'
                      : 'Preparando RS KITS'}
                </h2>
                <p className="text-sm text-slate-500">{prep.event.name}</p>
              </div>
              {prep.status !== 'preparing' && (
                <button
                  type="button"
                  onClick={() => setPrep(null)}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {prep.status === 'error' ? (
              <div className="mt-5">
                <p className="text-sm text-slate-600">{prep.error}</p>
                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPrep(null)}>
                    Fechar
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() =>
                      void prepareAndDownload(
                        prep.event,
                        prepDownloadRef.current,
                      )
                    }
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-sm text-slate-600">{prep.step}</p>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {prep.percent}%
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${prep.percent}%` }}
                  />
                </div>
                {prep.status === 'done' && (
                  <p className="mt-3 text-sm text-slate-500">
                    O download será iniciado...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => !busy && setEditingEvent(null)}
            aria-hidden="true"
          />
          <form
            onSubmit={saveEditEvent}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">Editar evento</h2>
                <p className="text-sm text-slate-500">{editingEvent.name}</p>
              </div>
              <button
                type="button"
                onClick={() => !busy && setEditingEvent(null)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <fieldset
              disabled={busy}
              className="mt-5 grid gap-4 sm:grid-cols-2"
            >
              <label className="text-sm font-semibold">
                Nome
                <input
                  required
                  value={eventForm.name}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, name: e.target.value })
                  }
                  className={fieldInput}
                />
              </label>
              <label className="text-sm font-semibold">
                Data
                <input
                  value={eventForm.date}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, date: e.target.value })
                  }
                  className={fieldInput}
                />
              </label>
              <label className="text-sm font-semibold">
                Cidade
                <input
                  value={eventForm.city}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, city: e.target.value })
                  }
                  placeholder="Ex.: São Paulo"
                  className={fieldInput}
                />
              </label>
              <label className="text-sm font-semibold">
                UF
                <UfCombobox
                  value={eventForm.uf}
                  onChange={(uf) => setEventForm({ ...eventForm, uf })}
                />
              </label>
              <div>
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Link2 className="h-4 w-4 text-blue-600" /> Organizador
                  responsável
                </span>
                <p className="mt-0.5 text-xs text-slate-400">
                  Deixe vazio para não vincular organizador a este evento.
                </p>
                <OrganizerCombobox
                  organizers={organizers}
                  value={eventForm.organizerId}
                  onChange={handleSelectOrganizer}
                  placeholder="Buscar organizador..."
                />
              </div>
            </fieldset>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => !busy && setEditingEvent(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Salvar
              </Button>
            </div>
          </form>
        </div>
      )}

      {deletingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => !busy && setDeletingEvent(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="flex-1 text-center text-lg font-black">
                Excluir evento
              </h2>
              <button
                type="button"
                onClick={() => !busy && setDeletingEvent(null)}
                className="shrink-0 text-slate-400 hover:text-slate-600"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 space-y-2 text-center text-sm text-slate-600">
              <p className="font-semibold text-slate-800">
                {deletingEvent.name}
              </p>
              <p>
                Tem certeza que deseja excluir? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => !busy && setDeletingEvent(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={busy}
                onClick={() => void confirmDeleteEvent()}
                className="bg-rose-600 hover:bg-rose-700"
              >
                <Trash2 className="mr-1 h-4 w-4" /> Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setConfirmLink(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mt-4 space-y-3 text-center text-sm text-slate-600">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <p>
                  Esse organizador já tem um evento: {confirmLink.otherEvent}
                </p>
              </div>
              <p>
                Tem certeza que deseja vincular{' '}
                <span className="font-semibold text-slate-800">
                  {confirmLink.organizer.name}
                </span>
              </p>
              <p>
                ao novo evento
                {/* <span className="font-semibold text-slate-800">{confirmLink.currentEvent}</span>? */}
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmLink(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={confirmLinkOrganizer}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Link2 className="mr-1 h-4 w-4" /> Vincular
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
