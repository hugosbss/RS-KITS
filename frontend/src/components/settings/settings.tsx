"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Download, KeyRound, Link2, Package, Pencil, Search, Trash2, UserPlus, Users, X } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAppState, type AppUser, type AppEvent } from "@/components/providers/app-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { maskCpf, maskCnpj } from "@/lib/utils";
import {
  buildEventPackage,
  downloadPackage,
  loadPackageAthletes,
  type RSKITSPackage,
} from "@/services/package";
import {
  addEventOrganizer,
  removeEventOrganizer,
  fetchEventOrganizers,
  fetchDownloads,
  API_URL,
  type AppDownload,
} from "@/services/api";
import { OrganizerCombobox } from "./combobox-organizer";
import { UfCombobox } from "./combobox-uf";
import { EventLinkCombobox } from "./combobox-event-link";
import { TOAST_DURATION_MS, EMPTY_EVENT_FORM, toPlace, splitPlace } from "./types";
import type { AdminOption } from "./types";

const downloadHref = (download: AppDownload) => {
  // Compatível com API_URL relativa (web, /api) e absoluta (desktop,
  // http://127.0.0.1:19090/api). download.url é sempre um caminho absoluto.
  const base = API_URL.startsWith("http")
    ? API_URL
    : `${window.location.origin}${API_URL}`;
  return new URL(download.url, base.endsWith("/") ? base : `${base}/`).href;
};

export function SettingsShell() {
  const { currentUser, users, events, athletesByEvent, createUser, updateUser, deleteUser, createEvent, updateEvent, deleteEvent, token } = useAppState();
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [adminOption, setAdminOption] = useState<AdminOption>("organizador");
  const [orgForm, setOrgForm] = useState({ name: "", cpf: "", cnpj: "", email: "", password: "", accessCode: "", phone: "" });
  const [opForm, setOpForm] = useState({ name: "", cpf: "", password: "" });
  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editForm, setEditForm] = useState({ name: "", cpf: "", cnpj: "", email: "", password: "", phone: "" });
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<AppEvent | null>(null);
  const [editingOrgEventIds, setEditingOrgEventIds] = useState<string[]>([]);
  const [revealed, setRevealed] = useState({ operadores: false, organizadores: false, eventos: false });
  const [linkedOrgIds, setLinkedOrgIds] = useState<Record<string, string[]>>({});
  const [confirmLink, setConfirmLink] = useState<{ organizer: AppUser; currentEvent: string; otherEvent: string } | null>(null);
  const [packageModal, setPackageModal] = useState<{ pkg: RSKITSPackage; organizerName?: string } | null>(null);
  const [downloads, setDownloads] = useState<AppDownload[]>([]);
  const isAdmin = currentUser.role === "ADMIN";
  // Prefere o instalador oficial por plataforma: RS-KITS-Setup-*.exe (Windows)
  // e RS-KITS-*.AppImage (Linux); outros artefatos (exe puro, deb) ficam só
  // como alternativa caso o instalador ainda não tenha sido publicado.
  const windowsDownload =
    downloads.filter((d) => d.platform === "windows").sort(
      (a, b) => Number(/setup/i.test(b.file)) - Number(/setup/i.test(a.file)),
    )[0] ?? null;
  const linuxDownload =
    downloads.filter((d) => d.platform === "linux").sort(
      (a, b) => Number(/\.appimage$/i.test(b.file)) - Number(/\.appimage$/i.test(a.file)),
    )[0] ?? null;

  const showToast = useCallback((message: string, error = false) => {
    setToast({ message, error });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // Abre direto a aba "Criar evento" quando vem da tela Eventos (?tab=evento).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "evento") setAdminOption("evento");
  }, []);

  // Carrega os organizadores vinculados de cada evento (painel direito).
  useEffect(() => {
    if (!token || !isAdmin || !events.length) return;
    events.forEach((event) => {
      if (!linkedOrgIds[event.id]) loadLinkedOrganizers(event.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, events, isAdmin]);

  // Instaladores do app desktop (Linux/Windows) servidos pelo backend web.
  useEffect(() => {
    let alive = true;
    fetchDownloads()
      .then((list) => alive && setDownloads(list))
      .catch(() => {}); // versão desktop/offline não expõe downloads.
    return () => {
      alive = false;
    };
  }, []);

  const organizers = users.filter((user) => user.role === "ORGANIZADOR");
  const organizerById = useMemo(
    () => Object.fromEntries(organizers.map((organizer) => [organizer.id, organizer.name])),
    [organizers],
  );

  if (currentUser.role === "OPERADOR") return null;

  const createOrganizador = async (event: FormEvent) => {
    event.preventDefault();
    if (!orgForm.name || !orgForm.cnpj || !orgForm.phone || !orgForm.password) return;
    try {
      await createUser({
        role: "ORGANIZADOR",
        name: orgForm.name,
        cpf: orgForm.cpf,
        cnpj: orgForm.cnpj,
        email: orgForm.email,
        password: orgForm.password,
        accessCode: orgForm.accessCode,
        phone: orgForm.phone,
      });
      setOrgForm({ name: "", cpf: "", cnpj: "", email: "", password: "", accessCode: "", phone: "" });
      showToast("Organizador criado.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível criar o organizador.", true);
    }
  };

  const createOperador = async (event: FormEvent) => {
    event.preventDefault();
    if (!opForm.name || !opForm.cpf || !opForm.password) return;
    try {
      await createUser({ role: "OPERADOR", name: opForm.name, cpf: opForm.cpf, password: opForm.password, organizerId: isAdmin ? undefined : currentUser.id });
      setOpForm({ name: "", cpf: "", password: "" });
      showToast("Usuário criado com sucesso.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível criar o operador.", true);
    }
  };

  const createNovoEvento = async (event: FormEvent) => {
    event.preventDefault();
    if (!eventForm.name.trim()) return;
    try {
      const created = await createEvent({
        name: eventForm.name.trim(),
        date: eventForm.date || "",
        place: toPlace(eventForm.city, eventForm.uf),
      });
      if (token && eventForm.organizerId) {
        await addEventOrganizer(token, created.id, eventForm.organizerId);
      }
      setEventForm(EMPTY_EVENT_FORM);
      showToast("Evento criado com sucesso");
      setTimeout(() => {
        window.location.assign("/import");
      }, 1600);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível criar o evento.", true);
    }
  };

  const generatePackage = async (event: AppEvent) => {
    const athletes = await loadPackageAthletes(token, event.id, athletesByEvent[event.id]);
    if (athletes.length === 0) {
      showToast("Este evento ainda não possui atletas importados.");
      return;
    }
    const organizerUserId = (linkedOrgIds[event.id] ?? [])[0];
    const organizer = organizerUserId ? users.find((user) => user.id === organizerUserId) ?? null : null;
    const pkg = buildEventPackage({ event, athletes, organizer, createdBy: currentUser.name });
    setPackageModal({ pkg, organizerName: organizer?.name });
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
        currentEvent: eventForm.name.trim() || (editingEvent?.name ?? "novo evento"),
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

  const ownOperators = users.filter((user) => user.role === "OPERADOR" && (isAdmin ? true : user.organizerId === currentUser.id));

  const openEdit = (user: AppUser) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      cpf: user.cpf ?? "",
      cnpj: user.cnpj ?? "",
      email: user.email ?? "",
      password: "",
      phone: user.phone ?? "",
    });
    const linkedEventIds = events
      .filter((event) => (linkedOrgIds[event.id] ?? []).includes(user.id))
      .map((event) => event.id);
    setEditingOrgEventIds(linkedEventIds);
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingUser || !editForm.name) return;
    const isOrganizadorRole = editingUser.role === "ORGANIZADOR";
    try {
      await updateUser(editingUser.id, {
        name: editForm.name,
        cpf: editForm.cpf,
        ...(isOrganizadorRole
          ? { cnpj: editForm.cnpj, email: editForm.email, phone: editForm.phone }
          : {}),
        ...(editForm.password ? { password: editForm.password } : {}),
      });

      if (token && isOrganizadorRole) {
        const original = events
          .filter((ev) => (linkedOrgIds[ev.id] ?? []).includes(editingUser.id))
          .map((ev) => ev.id);
        const toAdd = editingOrgEventIds.filter((id) => !original.includes(id));
        const toRemove = original.filter((id) => !editingOrgEventIds.includes(id));
        for (const eventId of toAdd) await addEventOrganizer(token, eventId, editingUser.id);
        for (const eventId of toRemove) await removeEventOrganizer(token, eventId, editingUser.id);
        setLinkedOrgIds((prev) => {
          const next = { ...prev };
          for (const eventId of toAdd) {
            next[eventId] = [...(next[eventId] ?? []).filter((id) => id !== editingUser.id), editingUser.id];
          }
          for (const eventId of toRemove) {
            next[eventId] = (next[eventId] ?? []).filter((id) => id !== editingUser.id);
          }
          return next;
        });
      }

      setEditingUser(null);
      showToast(isOrganizadorRole ? "Organizador atualizado com sucesso." : "Operador atualizado com sucesso.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao atualizar.", true);
    }
  };

  const confirmDelete = () => {
    if (!deletingUser) return;
    const isOrganizadorRole = deletingUser.role === "ORGANIZADOR";
    deleteUser(deletingUser.id);
    setDeletingUser(null);
    showToast(isOrganizadorRole ? "Organizador excluído com sucesso." : "Operador excluído com sucesso.");
  };

  const loadLinkedOrganizers = (eventId: string): Promise<string[]> => {
    if (!token) return Promise.resolve([]);
    return fetchEventOrganizers(token, eventId)
      .then((linked) => {
        const ids = linked.map((organizer) => organizer.id);
        setLinkedOrgIds((current) => ({ ...current, [eventId]: ids }));
        return ids;
      })
      .catch(() => []);
  };

  const openEditEvent = (event: AppEvent) => {
    const { city, uf } = splitPlace(event.place ?? "");
    setEditingEvent(event);
    setEventForm({ name: event.name, date: event.date, city, uf, organizerId: null });
    loadLinkedOrganizers(event.id).then((ids) => {
      setEventForm((prev) => (prev.organizerId ? prev : { ...prev, organizerId: ids[0] ?? null }));
    });
  };

  const saveEditEvent = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!editingEvent || !eventForm.name.trim()) return;
    updateEvent(editingEvent.id, {
      name: eventForm.name.trim(),
      date: eventForm.date || "Data a definir",
      place: toPlace(eventForm.city, eventForm.uf) || "Local a definir",
    });

    if (token) {
      const current = linkedOrgIds[editingEvent.id] ?? (await loadLinkedOrganizers(editingEvent.id));
      const currentId = current[0] ?? null;
      try {
        if (eventForm.organizerId && eventForm.organizerId !== currentId) {
          if (currentId) await removeEventOrganizer(token, editingEvent.id, currentId);
          await addEventOrganizer(token, editingEvent.id, eventForm.organizerId);
        } else if (!eventForm.organizerId && currentId) {
          await removeEventOrganizer(token, editingEvent.id, currentId);
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Não foi possível atualizar o organizador vinculado.", true);
        return;
      }
      setLinkedOrgIds((st) => ({ ...st, [editingEvent.id]: eventForm.organizerId ? [eventForm.organizerId] : [] }));
    }

    setEditingEvent(null);
    setEventForm(EMPTY_EVENT_FORM);
    showToast("Evento atualizado com sucesso.");
  };

  const confirmDeleteEvent = () => {
    if (!deletingEvent) return;
    deleteEvent(deletingEvent.id);
    setDeletingEvent(null);
    showToast("Evento excluído com sucesso.");
  };


  const fieldInput = "mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal";
  const optionButton = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar />
      <main className="space-y-6 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <header>
          <p className="text-sm font-semibold text-blue-600">Controle de acesso</p>
          <h1 className="mt-1 text-3xl font-black">Configurações</h1>
          <p className="mt-2 text-sm text-slate-500">
            {isAdmin ? "Escolha a opção desejada." : "Cadastre os operadores responsáveis pela entrega de kits."}
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <button onClick={() => setAdminOption("organizador")} className={optionButton(adminOption === "organizador")}>
                <UserPlus className="h-4 w-4" /> Criar organizador
              </button>
              <button onClick={() => setAdminOption("operador")} className={optionButton(adminOption === "operador")}>
                <KeyRound className="h-4 w-4" /> Criar operador
              </button>
              <button onClick={() => setAdminOption("evento")} className={optionButton(adminOption === "evento")}>
                <CalendarDays className="h-4 w-4" /> Criar evento
              </button>
            </>
          )}
        </div>

        <div className="grid items-start gap-6 min-[1336px]:grid-cols-2">
          {/* Coluna 1: Cadastro */}
          <div className="min-w-0 space-y-6">

        {isAdmin && adminOption === "organizador" && (
          <Card className="border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><UserPlus className="h-5 w-5" /></div>
              <div>
                <h2 className="font-bold">Criar organizador</h2>
                <p className="text-sm text-slate-500">O organizador poderá criar os usuários operadores.</p>
              </div>
            </div>
            <form onSubmit={createOrganizador} className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Nome<input required value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} className={fieldInput} /></label>
              <label className="text-sm font-semibold">CPF<input value={orgForm.cpf} onChange={(e) => setOrgForm({ ...orgForm, cpf: maskCpf(e.target.value) })} className={fieldInput} /></label>
              <label className="text-sm font-semibold">CNPJ<input required value={orgForm.cnpj} onChange={(e) => setOrgForm({ ...orgForm, cnpj: maskCnpj(e.target.value) })} className={fieldInput} /></label>
              <label className="text-sm font-semibold">E-mail<input type="email" value={orgForm.email} onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })} className={fieldInput} /></label>
              <label className="text-sm font-semibold">Código de acesso<input value={orgForm.accessCode} onChange={(e) => setOrgForm({ ...orgForm, accessCode: e.target.value })} className={fieldInput} /></label>
              <label className="text-sm font-semibold">Telefone<input required value={orgForm.phone} onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })} className={fieldInput} /></label>
              <label className="text-sm font-semibold sm:col-span-2">Senha<input required type="password" value={orgForm.password} onChange={(e) => setOrgForm({ ...orgForm, password: e.target.value })} className={fieldInput} /></label>
              <div className="sm:col-span-2"><Button type="submit" className="bg-blue-600 hover:bg-blue-700"><KeyRound className="mr-2 h-4 w-4" /> Criar organizador</Button></div>
            </form>
          </Card>
        )}

        {isAdmin && adminOption === "operador" && (
          <Card className="border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><UserPlus className="h-5 w-5" /></div>
              <div>
                <h2 className="font-bold">Criar acesso de operador</h2>
                <p className="text-sm text-slate-500">Este acesso ficará vinculado ao seu organizador.</p>
              </div>
            </div>
            <form onSubmit={createOperador} className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Nome<input required value={opForm.name} onChange={(e) => setOpForm({ ...opForm, name: e.target.value })} className={fieldInput} /></label>
              <label className="text-sm font-semibold">CPF<input required value={opForm.cpf} onChange={(e) => setOpForm({ ...opForm, cpf: maskCpf(e.target.value) })} className={fieldInput} /></label>
              <label className="text-sm font-semibold sm:col-span-2">Senha<input required type="password" value={opForm.password} onChange={(e) => setOpForm({ ...opForm, password: e.target.value })} className={fieldInput} /></label>
              <div className="sm:col-span-2"><Button type="submit" className="bg-blue-600 hover:bg-blue-700"><KeyRound className="mr-2 h-4 w-4" /> Criar operador</Button></div>
            </form>
          </Card>
        )}

        {(isAdmin && adminOption === "evento") && (
          <Card className="border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CalendarDays className="h-5 w-5" /></div>
              <div>
                <h2 className="font-bold">Criar evento</h2>
                <p className="text-sm text-slate-500">Após criar, importe a planilha deste evento.</p>
              </div>
            </div>
            <form onSubmit={createNovoEvento} className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Nome do evento<input required value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} className={fieldInput} /></label>
              <label className="text-sm font-semibold">Data<input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className={fieldInput} /></label>
              <label className="text-sm font-semibold">Cidade<input value={eventForm.city} onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })} placeholder="Ex.: São Paulo" className={fieldInput} /></label>
              <label className="text-sm font-semibold">UF<UfCombobox value={eventForm.uf} onChange={(uf) => setEventForm({ ...eventForm, uf })} /></label>
              <div className="sm:col-span-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Link2 className="h-4 w-4 text-blue-600" /> Organizador responsável
                </span>
                <p className="mt-0.5 text-xs text-slate-400">Busque pelo nome do organizador que terá acesso a este evento.</p>
                <OrganizerCombobox
                  organizers={organizers}
                  value={eventForm.organizerId}
                  onChange={handleSelectOrganizer}
                  placeholder="Buscar organizador..."
                />
              </div>
              <div className="sm:col-span-2"><Button type="submit" className="bg-blue-600 hover:bg-blue-700"><CalendarDays className="mr-2 h-4 w-4" /> Criar evento</Button></div>
            </form>
          </Card>
        )}

        {!isAdmin && (
          <Card className="border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><UserPlus className="h-5 w-5" /></div>
              <div>
                <h2 className="font-bold">Criar acesso de operador</h2>
                <p className="text-sm text-slate-500">Este acesso ficará vinculado ao seu organizador.</p>
              </div>
            </div>
            <form onSubmit={createOperador} className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Nome<input required value={opForm.name} onChange={(e) => setOpForm({ ...opForm, name: e.target.value })} className={fieldInput} /></label>
              <label className="text-sm font-semibold">CPF<input required value={opForm.cpf} onChange={(e) => setOpForm({ ...opForm, cpf: maskCpf(e.target.value) })} className={fieldInput} /></label>
              <label className="text-sm font-semibold sm:col-span-2">Senha<input required type="password" value={opForm.password} onChange={(e) => setOpForm({ ...opForm, password: e.target.value })} className={fieldInput} /></label>
              <div className="sm:col-span-2"><Button type="submit" className="bg-blue-600 hover:bg-blue-700"><KeyRound className="mr-2 h-4 w-4" /> Criar operador</Button></div>
            </form>
          </Card>
        )}

          </div>
          {/* Fim coluna 1 */}

          {/* Coluna 2: Informações */}
          <div className="min-w-0 space-y-6">
          <Card className="flex flex-col border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Users className="h-5 w-5" /></div>
              <div className="flex-1">
                <h2 className="font-bold">Operadores</h2>
                <p className="text-sm text-slate-500">Acessos responsáveis pela entrega de kits.</p>
              </div>
              {ownOperators.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRevealed((r) => ({ ...r, operadores: !r.operadores }))}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  {revealed.operadores ? "Ocultar" : `Exibir (${ownOperators.length})`}
                </button>
              )}
            </div>
            {revealed.operadores && (
              <div className="mt-5 space-y-3">
                {ownOperators.map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div>
                      <p className="font-semibold text-slate-800">{user.name}</p>
                      <p className="mt-1 text-xs text-slate-500">CPF: {user.cpf}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                        aria-label={`Editar ${user.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingUser(user)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Excluir ${user.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {!ownOperators.length && <p className="text-sm text-slate-500">Nenhum operador cadastrado.</p>}
              </div>
            )}
          </Card>

          {isAdmin && (
            <Card className="flex flex-col border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><UserPlus className="h-5 w-5" /></div>
                <div className="flex-1">
                  <h2 className="font-bold">Organizadores</h2>
                  <p className="text-sm text-slate-500">Acessos que gerenciam eventos e operadores.</p>
                </div>
                {organizers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRevealed((r) => ({ ...r, organizadores: !r.organizadores }))}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    {revealed.organizadores ? "Ocultar" : `Exibir (${organizers.length})`}
                  </button>
                )}
              </div>
              {revealed.organizadores && (
                <div className="mt-5 space-y-3">
                  {organizers.map((user) => (
                    <div key={user.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-800">{user.name}</p>
                          <p className="mt-1 text-xs text-slate-500">CPF: {user.cpf}</p>
                          {user.accessCode && <p className="mt-1 text-xs text-blue-600">Código: {user.accessCode}</p>}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-600 hover:text-blue-600"
                            aria-label={`Editar ${user.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingUser(user)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-600 hover:text-red-600"
                            aria-label={`Excluir ${user.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!organizers.length && <p className="text-sm text-slate-500">Nenhum organizador cadastrado.</p>}
                </div>
              )}
            </Card>
          )}

          {isAdmin && (
            <Card className="flex flex-col border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CalendarDays className="h-5 w-5" /></div>
                <div className="flex-1">
                  <h2 className="font-bold">Eventos</h2>
                  <p className="text-sm text-slate-500">Eventos cadastrados no sistema.</p>
                </div>
                {events.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRevealed((r) => ({ ...r, eventos: !r.eventos }))}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    {revealed.eventos ? "Ocultar" : `Exibir (${events.length})`}
                  </button>
                )}
              </div>
              {revealed.eventos && (
                <div className="mt-5 space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-800">{event.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{event.date} · {event.place}</p>
                          {(() => {
                            const linkedNames = (linkedOrgIds[event.id] ?? [])
                              .map((id) => organizerById[id])
                              .filter(Boolean);
                            if (!linkedNames.length) return null;
                            return (
                              <p className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                                <Link2 className="h-3 w-3" /> {linkedNames.join(", ")}
                              </p>
                            );
                          })()}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {windowsDownload && (
                            <a
                              href={downloadHref(windowsDownload)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-600 hover:text-blue-600"
                              aria-label={`Baixar o aplicativo para Windows`}
                              title="Baixar aplicativo para Windows"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                          {linuxDownload && (
                            <a
                              href={downloadHref(linuxDownload)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-600 hover:text-blue-600"
                              aria-label={`Baixar o aplicativo para Linux`}
                              title="Baixar aplicativo para Linux"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => generatePackage(event)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-600 hover:text-blue-600"
                            aria-label={`Gerar executável para ${event.name}`}
                            title="Gerar executável (.rskits)"
                          >
                            <Package className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditEvent(event)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-600 hover:text-blue-600"
                            aria-label={`Editar ${event.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingEvent(event)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-600 hover:text-red-600"
                            aria-label={`Excluir ${event.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!events.length && <p className="text-sm text-slate-500">Nenhum evento cadastrado.</p>}
                </div>
              )}
            </Card>
          )}
          </div>
          {/* Fim coluna 2 */}
        </div>
      </main>
      {packageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setPackageModal(null)} aria-hidden="true" />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">Executável do evento</h2>
                <p className="text-sm text-slate-500">{packageModal.pkg.event.name}</p>
              </div>
              <button type="button" onClick={() => setPackageModal(null)} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                <span>Atletas no pacote</span>
                <span className="font-medium text-slate-900">{packageModal.pkg.athletes.length.toLocaleString("pt-BR")}</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                <span>Organizador</span>
                <span className="font-medium text-slate-900">{packageModal.organizerName ?? "Não vinculado"}</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                <span>URL de sincronização</span>
                <span className="break-all font-medium text-slate-900">{packageModal.pkg.config.cloudUrl}</span>
              </li>
            </ul>

            {packageModal.pkg.organizer && (
              <div className="mt-4 rounded-xl bg-blue-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Senha de acesso offline</p>
                <p className="mt-1 text-center font-mono text-3xl font-bold tracking-widest text-blue-800">{packageModal.pkg.organizer.offlinePassword}</p>
                <p className="mt-2 text-xs text-blue-700">Envie esta senha ao organizador — é ela que dá acesso ao executável offline (login com o e-mail/CPF do organizador).</p>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPackageModal(null)}>Fechar</Button>
              <Button
                onClick={() => {
                  downloadPackage(packageModal.pkg);
                  setPackageModal(null);
                  showToast("Pacote baixado. Copie para a pasta desktop/packages/ e instale no executável.");
                }}
              >
                <Package className="mr-1.5 h-4 w-4" /> Baixar (.rskits)
              </Button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} error={toast.error} />}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setEditingUser(null)} aria-hidden="true" />
          <form onSubmit={saveEdit} className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">Editar {editingUser.role === "ORGANIZADOR" ? "organizador" : "operador"}</h2>
                <p className="text-sm text-slate-500">{editingUser.name}</p>
              </div>
              <button type="button" onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <label className="text-sm font-semibold">Nome<input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={fieldInput} /></label>
              <label className="text-sm font-semibold">CPF<input required value={editForm.cpf} onChange={(e) => setEditForm({ ...editForm, cpf: maskCpf(e.target.value) })} className={fieldInput} /></label>
              {editingUser.role === "ORGANIZADOR" && (
                <>
                  <label className="text-sm font-semibold">CNPJ<input value={editForm.cnpj} onChange={(e) => setEditForm({ ...editForm, cnpj: maskCnpj(e.target.value) })} className={fieldInput} /></label>
                  <label className="text-sm font-semibold">E-mail<input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={fieldInput} /></label>
                  <label className="text-sm font-semibold">Telefone<input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={fieldInput} /></label>
                </>
              )}
              <label className="text-sm font-semibold">Nova senha<input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Deixe em branco para manter" className={fieldInput} /></label>
              {editingUser.role === "ORGANIZADOR" && (
                <div className="sm:col-span-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {/* <CalendarDays className="h-4 w-4 text-blue-600" />  */}
                    Evento:
                  </span>
                  <EventLinkCombobox
                    events={events}
                    selectedIds={editingOrgEventIds}
                    onChange={setEditingOrgEventIds}
                    placeholder="Buscar evento..."
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Salvar</Button>
            </div>
          </form>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setDeletingUser(null)} aria-hidden="true" />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="flex-1 text-center text-lg font-black">Excluir {deletingUser.role === "ORGANIZADOR" ? "organizador" : "operador"}</h2>
              <button type="button" onClick={() => setDeletingUser(null)} className="shrink-0 text-slate-400 hover:text-slate-600" aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 space-y-2 text-center text-sm text-slate-600">
              <p className="font-semibold text-slate-800">{deletingUser.name}</p>
              <p>Tem certeza que deseja excluir? Esta ação não pode ser desfeita.</p>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              <Button type="button" variant="outline" onClick={() => setDeletingUser(null)}>Cancelar</Button>
              <Button type="button" onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700"><Trash2 className="mr-1 h-4 w-4" /> Excluir</Button>
            </div>
          </div>
        </div>
      )}

      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setEditingEvent(null)} aria-hidden="true" />
          <form onSubmit={saveEditEvent} className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">Editar evento</h2>
                <p className="text-sm text-slate-500">{editingEvent.name}</p>
              </div>
              <button type="button" onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Nome<input required value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} className={fieldInput} /></label>
              <label className="text-sm font-semibold">Data<input value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className={fieldInput} /></label>
              <label className="text-sm font-semibold">Cidade<input value={eventForm.city} onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })} placeholder="Ex.: São Paulo" className={fieldInput} /></label>
              <label className="text-sm font-semibold">UF<UfCombobox value={eventForm.uf} onChange={(uf) => setEventForm({ ...eventForm, uf })} /></label>
              <div>
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Link2 className="h-4 w-4 text-blue-600" /> Organizador responsável
                </span>
                <p className="mt-0.5 text-xs text-slate-400">Deixe vazio para não vincular organizador a este evento.</p>
                <OrganizerCombobox
                  organizers={organizers}
                  value={eventForm.organizerId}
                  onChange={handleSelectOrganizer}
                  placeholder="Buscar organizador..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingEvent(null)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Salvar</Button>
            </div>
          </form>
        </div>
      )}

      {deletingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setDeletingEvent(null)} aria-hidden="true" />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="flex-1 text-center text-lg font-black">Excluir evento</h2>
              <button type="button" onClick={() => setDeletingEvent(null)} className="shrink-0 text-slate-400 hover:text-slate-600" aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 space-y-2 text-center text-sm text-slate-600">
              <p className="font-semibold text-slate-800">{deletingEvent.name}</p>
              <p>Tem certeza que deseja excluir? Esta ação não pode ser desfeita.</p>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              <Button type="button" variant="outline" onClick={() => setDeletingEvent(null)}>Cancelar</Button>
              <Button type="button" onClick={confirmDeleteEvent} className="bg-rose-600 hover:bg-rose-700"><Trash2 className="mr-1 h-4 w-4" /> Excluir</Button>
            </div>
          </div>
        </div>
      )}

      {confirmLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setConfirmLink(null)} aria-hidden="true" />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mt-4 space-y-3 text-center text-sm text-slate-600">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <p>Esse organizador já tem um evento: {confirmLink.otherEvent}</p>
              </div>
              <p>
                Tem certeza que deseja vincular {" "}
                <span className="font-semibold text-slate-800">{confirmLink.organizer.name}</span>
              </p>
              <p>
                ao novo evento 
                {/* <span className="font-semibold text-slate-800">{confirmLink.currentEvent}</span>? */}
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmLink(null)}>Cancelar</Button>
              <Button type="button" onClick={confirmLinkOrganizer} className="bg-blue-600 hover:bg-blue-700"><Link2 className="mr-1 h-4 w-4" /> Vincular</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
