'use client';

import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Link2,
  Loader2,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { useAppState, type AppUser } from '@/components/providers/app-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Toast } from '@/components/ui/toast';
import { OrganizerCombobox } from '@/components/settings/combobox-organizer';
import { EventLinkCombobox } from '@/components/settings/combobox-event-link';
import { maskCpf, maskCnpj } from '@/lib/utils';
import {
  addEventOrganizer,
  fetchEventOrganizers,
  removeEventOrganizer,
} from '@/services/api';
const emptyForm = {
  name: '',
  cpf: '',
  cnpj: '',
  email: '',
  phone: '',
  password: '',
  accessCode: '',
  organizerId: '',
};
const inputClass =
  'mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
type Profile = 'ORGANIZADOR' | 'OPERADOR';
export function UsersShell() {
  const {
    currentUser,
    users,
    events,
    selectedEventId,
    token,
    createUser,
    updateUser,
    deleteUser,
  } = useAppState();
  const isAdmin = currentUser.role === 'ADMIN';
  const [query, setQuery] = useState('');
  const [profile, setProfile] = useState<Profile | 'TODOS'>('TODOS');
  const [organizerFilter, setOrganizerFilter] = useState('');
  const [eventFilter, setEventFilter] = useState(selectedEventId ?? '');
  const [links, setLinks] = useState<Record<string, string[]>>({});
  const [linksLoading, setLinksLoading] = useState(isAdmin && !!token);
  const [linksError, setLinksError] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [formProfile, setFormProfile] = useState<Profile>('OPERADOR');
  const [form, setForm] = useState(emptyForm);
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<AppUser | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    error?: boolean;
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const organizers = users.filter((user) => user.role === 'ORGANIZADOR');
  const operators = users.filter(
    (user) =>
      user.role === 'OPERADOR' &&
      (isAdmin || user.organizerId === currentUser.id),
  );
  const available = isAdmin ? [...organizers, ...operators] : operators;
  const notify = (message: string, error = false) => {
    setToast({ message, error });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );
  useEffect(() => {
    setEventFilter(
      new URLSearchParams(window.location.search).get('evento') ??
        selectedEventId ??
        '',
    );
  }, [selectedEventId]);
  const loadLinks = useCallback(async () => {
    if (!token || !isAdmin) return;
    setLinksLoading(true);
    setLinksError('');
    try {
      const pairs = await Promise.all(
        events.map(
          async (event) =>
            [
              event.id,
              (await fetchEventOrganizers(token, event.id)).map(
                (user) => user.id,
              ),
            ] as const,
        ),
      );
      setLinks(Object.fromEntries(pairs));
    } catch {
      setLinksError(
        'Não foi possível carregar os vínculos. Tente novamente antes de editar eventos vinculados.',
      );
    } finally {
      setLinksLoading(false);
    }
  }, [token, isAdmin, events]);
  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);
  useEffect(() => {
    if (!drawer && !deleting) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('input, button')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        setDrawer(false);
        setDeleting(null);
      }
      if (event.key !== 'Tab') return;
      const controls = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]',
      );
      if (!controls?.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      previousFocus?.focus();
    };
  }, [drawer, deleting, busy]);
  const userEvents = (user: AppUser) =>
    isAdmin
      ? events.filter((event) =>
          (links[event.id] ?? []).includes(
            user.role === 'ORGANIZADOR' ? user.id : (user.organizerId ?? ''),
          ),
        )
      : events;
  const eventUsers = available.filter(
    (user) =>
      !!eventFilter &&
      userEvents(user).some((event) => event.id === eventFilter),
  );
  const eventOrganizers = eventUsers.filter(
    (user) => user.role === 'ORGANIZADOR',
  );
  const filtered = eventUsers
    .filter((user) => {
      const ownerId = user.role === 'ORGANIZADOR' ? user.id : user.organizerId;
      const owner = organizers.find((item) => item.id === ownerId);
      const linkedEvents = userEvents(user);
      const text =
        `${user.name} ${user.cpf ?? ''} ${user.cnpj ?? ''} ${user.email ?? ''} ${owner?.name ?? ''} ${linkedEvents.map((event) => event.name).join(' ')}`.toLocaleLowerCase(
          'pt-BR',
        );
      return (
        (profile === 'TODOS' || user.role === profile) &&
        (!organizerFilter || ownerId === organizerFilter) &&
        !!eventFilter &&
        linkedEvents.some((event) => event.id === eventFilter) &&
        text.includes(query.trim().toLocaleLowerCase('pt-BR'))
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const openDrawer = (user?: AppUser) => {
    if (user?.role === 'ORGANIZADOR' && (linksLoading || linksError)) {
      notify('Carregue os vínculos antes de editar o organizador.', true);
      return;
    }
    setEditing(user ?? null);
    setFormProfile(user?.role === 'ORGANIZADOR' ? 'ORGANIZADOR' : 'OPERADOR');
    setForm(
      user
        ? {
            ...emptyForm,
            name: user.name,
            cpf: user.cpf ?? '',
            cnpj: user.cnpj ?? '',
            email: user.email ?? '',
            phone: user.phone ?? '',
            organizerId: user.organizerId ?? '',
          }
        : { ...emptyForm, organizerId: isAdmin ? '' : currentUser.id },
    );
    setEventIds(
      user?.role === 'ORGANIZADOR'
        ? userEvents(user).map((event) => event.id)
        : [],
    );
    setFormError('');
    setDrawer(true);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (formProfile === 'OPERADOR' && isAdmin && !form.organizerId) {
      setFormError('Selecione o organizador responsável pelo operador.');
      return;
    }
    if (formProfile === 'ORGANIZADOR' && (linksLoading || linksError)) {
      setFormError('Aguarde o carregamento dos vínculos ou tente novamente.');
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      const details = {
        name: form.name.trim(),
        cpf: form.cpf,
        ...(form.password ? { password: form.password } : {}),
        ...(formProfile === 'ORGANIZADOR'
          ? {
              cnpj: form.cnpj,
              email: form.email,
              phone: form.phone,
              ...(!editing && form.accessCode
                ? { accessCode: form.accessCode }
                : {}),
            }
          : {
              ...(isAdmin || !editing
                ? { organizerId: isAdmin ? form.organizerId : currentUser.id }
                : {}),
            }),
      };
      let userId = editing?.id;
      if (userId) await updateUser(userId, details);
      else {
        const created = await createUser({ ...details, role: formProfile });
        userId = created.id;
        // Preserve the new account if linking fails, allowing a safe retry.
        setEditing(created);
      }
      if (token && formProfile === 'ORGANIZADOR') {
        const original = events
          .filter((item) => (links[item.id] ?? []).includes(userId))
          .map((item) => item.id);
        for (const eventId of eventIds.filter((id) => !original.includes(id))) {
          await addEventOrganizer(token, eventId, userId);
          setLinks((current) => ({
            ...current,
            [eventId]: [...(current[eventId] ?? []), userId],
          }));
        }
        for (const eventId of original.filter((id) => !eventIds.includes(id))) {
          await removeEventOrganizer(token, eventId, userId);
          setLinks((current) => ({
            ...current,
            [eventId]: (current[eventId] ?? []).filter((id) => id !== userId),
          }));
        }
      }
      setDrawer(false);
      notify('Usuário salvo com sucesso.');
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o usuário.',
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await deleteUser(deleting.id);
      setDeleting(null);
      notify('Usuário excluído.');
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o usuário.',
        true,
      );
    } finally {
      setBusy(false);
    }
  };
  if (currentUser.role === 'OPERADOR')
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="p-6 lg:ml-64">
          <Card className="p-6">
            <h1 className="text-xl font-bold">Acesso restrito</h1>
            <p className="mt-2 text-sm text-slate-500">
              A gestão de usuários está disponível para administradores e
              organizadores.
            </p>
          </Card>
        </main>
      </div>
    );
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar />
      <main className="space-y-6 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-medium text-slate-900">Usuários</h1>
            <p className="mt-2 text-sm text-slate-500">
              {isAdmin
                ? 'Gerencie organizadores, operadores e seus vínculos com eventos.'
                : 'Gerencie os operadores da sua organização.'}
            </p>
          </div>
          <Button
            className="h-11 bg-blue-600 hover:bg-blue-700"
            onClick={() => openDrawer()}
          >
            <UserPlus className="h-4 w-4" /> Adicionar usuário
          </Button>
        </header>
        <section
          className="grid gap-4 sm:grid-cols-3"
          aria-label="Resumo de usuários"
        >
          {[
            ['Usuários', eventUsers.length],
            ...(isAdmin
              ? [['Organizadores', eventOrganizers.length]]
              : [['Eventos disponíveis', events.length]]),
            [
              'Operadores',
              eventUsers.filter((user) => user.role === 'OPERADOR').length,
            ],
          ].map(([label, count]) => (
            <Card
              key={label}
              className="flex items-center justify-between border-slate-200 p-4"
            >
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-black">{count}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </Card>
          ))}
        </section>
        <Card className="space-y-4 border-slate-200 p-4">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                aria-label="Buscar usuários"
                className="h-11 w-full rounded-xl border border-slate-300 pl-11 pr-3 text-sm"
                placeholder="Buscar nome, documento, e-mail ou evento"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(isAdmin
                ? (['TODOS', 'ORGANIZADOR', 'OPERADOR'] as const)
                : (['TODOS'] as const)
              ).map((item) => (
                <button
                  key={item}
                  aria-pressed={profile === item}
                  onClick={() => setProfile(item)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold ${profile === item ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
                >
                  {item === 'TODOS'
                    ? 'Todos'
                    : item === 'ORGANIZADOR'
                      ? 'Organizadores'
                      : 'Operadores'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {isAdmin && (
              <select
                aria-label="Filtrar por organizador"
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm sm:w-64"
                value={organizerFilter}
                onChange={(event) => setOrganizerFilter(event.target.value)}
              >
                <option value="">Todos os organizadores</option>
                {eventOrganizers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            )}
            <select
              aria-label="Filtrar por evento"
              disabled={linksLoading || !!linksError}
              className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 sm:w-64"
              value={eventFilter}
              onChange={(event) => setEventFilter(event.target.value)}
            >
              <option value="" disabled>
                Selecione o evento
              </option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
            {(query ||
              profile !== 'TODOS' ||
              organizerFilter ||
              eventFilter) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setQuery('');
                  setProfile('TODOS');
                  setOrganizerFilter('');
                  setEventFilter(selectedEventId ?? '');
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </Card>
        {linksError && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            {linksError}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadLinks()}
            >
              Tentar novamente
            </Button>
          </div>
        )}
        <Card className="overflow-hidden border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="font-bold">Lista de usuários</h2>
            <span className="text-sm text-slate-500">
              {filtered.length} encontrados
            </span>
          </div>
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {['Usuário', 'Perfil', 'Organizador', 'Eventos', 'Ações'].map(
                    (label) => (
                      <th key={label} className="px-5 py-3 font-semibold">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold">{user.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {user.email || user.cpf || user.cnpj || 'Sem documento'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === 'ORGANIZADOR' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'}`}
                      >
                        {user.role === 'ORGANIZADOR'
                          ? 'Organizador'
                          : 'Operador'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {user.role === 'ORGANIZADOR'
                        ? '—'
                        : (organizers.find(
                            (item) => item.id === user.organizerId,
                          )?.name ??
                          (user.organizerId === currentUser.id
                            ? currentUser.name
                            : 'Sem vínculo'))}
                    </td>
                    <td className="max-w-xs px-5 py-4">
                      <p className="text-xs text-slate-600">
                        {linksLoading
                          ? 'Carregando…'
                          : linksError
                            ? 'Vínculos indisponíveis'
                            : userEvents(user)
                                .map((event) => event.name)
                                .join(', ') || 'Nenhum evento'}
                      </p>
                      {user.role === 'OPERADOR' && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          Acesso pelo organizador
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Editar ${user.name}`}
                          disabled={
                            user.role === 'ORGANIZADOR' &&
                            (linksLoading || !!linksError)
                          }
                          onClick={() => openDrawer(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Excluir ${user.name}`}
                          className="text-rose-600"
                          onClick={() => setDeleting(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && (
              <div className="p-12 text-center">
                <Users className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-700">
                  Nenhum usuário encontrado
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Ajuste os filtros ou cadastre um novo usuário.
                </p>
              </div>
            )}
          </div>
        </Card>
      </main>
      {drawer && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-drawer-title"
        >
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => !busy && setDrawer(false)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 id="user-drawer-title" className="text-xl font-bold">
                  {editing ? 'Editar usuário' : 'Adicionar usuário'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Dados de acesso e vínculos.
                </p>
              </div>
              <Button
                variant="ghost"
                disabled={busy}
                aria-label="Fechar cadastro"
                onClick={() => setDrawer(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
              <fieldset
                disabled={busy}
                className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6"
              >
                <label className="block text-sm font-semibold">
                  Perfil
                  <select
                    className={inputClass}
                    value={formProfile}
                    disabled={!!editing || !isAdmin}
                    onChange={(event) => {
                      setFormProfile(event.target.value as Profile);
                      setFormError('');
                    }}
                  >
                    <option value="OPERADOR">Operador</option>
                    {isAdmin && (
                      <option value="ORGANIZADOR">Organizador</option>
                    )}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Nome
                  <input
                    required
                    autoComplete="name"
                    className={inputClass}
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold">
                    CPF
                    <input
                      required={formProfile === 'OPERADOR'}
                      className={inputClass}
                      value={form.cpf}
                      onChange={(event) =>
                        setForm({ ...form, cpf: maskCpf(event.target.value) })
                      }
                    />
                  </label>
                  {formProfile === 'ORGANIZADOR' && (
                    <label className="text-sm font-semibold">
                      CNPJ
                      <input
                        required={!editing}
                        className={inputClass}
                        value={form.cnpj}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            cnpj: maskCnpj(event.target.value),
                          })
                        }
                      />
                    </label>
                  )}
                </div>
                {formProfile === 'ORGANIZADOR' && (
                  <>
                    <label className="block text-sm font-semibold">
                      E-mail
                      <input
                        type="email"
                        autoComplete="email"
                        className={inputClass}
                        value={form.email}
                        onChange={(event) =>
                          setForm({ ...form, email: event.target.value })
                        }
                      />
                    </label>
                    <label className="block text-sm font-semibold">
                      Telefone
                      <input
                        type="tel"
                        required={!editing}
                        autoComplete="tel"
                        className={inputClass}
                        value={form.phone}
                        onChange={(event) =>
                          setForm({ ...form, phone: event.target.value })
                        }
                      />
                    </label>
                    {!editing && (
                      <label className="block text-sm font-semibold">
                        Código de acesso
                        <input
                          className={inputClass}
                          value={form.accessCode}
                          onChange={(event) =>
                            setForm({ ...form, accessCode: event.target.value })
                          }
                        />
                      </label>
                    )}
                  </>
                )}
                <label className="block text-sm font-semibold">
                  {editing ? 'Nova senha' : 'Senha'}
                  <input
                    type="password"
                    autoComplete="new-password"
                    required={!editing}
                    minLength={6}
                    placeholder={
                      editing
                        ? 'Deixe em branco para manter'
                        : 'Pelo menos 6 caracteres'
                    }
                    className={inputClass}
                    value={form.password}
                    onChange={(event) =>
                      setForm({ ...form, password: event.target.value })
                    }
                  />
                </label>
                <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold">
                    <Link2 className="h-4 w-4 text-blue-600" />
                    {formProfile === 'ORGANIZADOR'
                      ? 'Eventos vinculados'
                      : 'Organizador responsável'}
                  </h3>
                  {formProfile === 'ORGANIZADOR' ? (
                    <>
                      {linksLoading || linksError ? (
                        <p className="mt-3 text-sm text-amber-700">
                          {linksError || 'Carregando vínculos…'}
                        </p>
                      ) : (
                        <EventLinkCombobox
                          events={events}
                          selectedIds={eventIds}
                          onChange={setEventIds}
                          placeholder="Buscar eventos..."
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {isAdmin ? (
                        <OrganizerCombobox
                          organizers={eventOrganizers}
                          value={form.organizerId || null}
                          onChange={(id) =>
                            setForm({ ...form, organizerId: id ?? '' })
                          }
                          placeholder="Selecionar organizador..."
                        />
                      ) : (
                        <p className="mt-3 text-sm font-semibold text-blue-700">
                          {currentUser.name}
                        </p>
                      )}
                    </>
                  )}
                </div>
                {formError && (
                  <p
                    role="alert"
                    className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
                  >
                    {formError}
                  </p>
                )}
              </fieldset>
              <footer className="flex justify-end gap-3 border-t border-slate-100 p-5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setDrawer(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    busy ||
                    (formProfile === 'ORGANIZADOR' &&
                      (linksLoading || !!linksError))
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar usuário
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}
      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-title"
        >
          <div
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => !busy && setDeleting(null)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 id="delete-user-title" className="text-lg font-bold">
              Excluir usuário
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Confirma a exclusão de
              <strong>{deleting.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setDeleting(null)}
              >
                Cancelar
              </Button>
              <Button
                disabled={busy}
                className="bg-rose-600 hover:bg-rose-700"
                onClick={() => void remove()}
              >
                {busy ? 'Excluindo…' : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} error={toast.error} />}
    </div>
  );
}
