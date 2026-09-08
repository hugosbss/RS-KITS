"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ImportedRow } from "@/components/import/import";
import { formatDateBR } from "@/lib/utils";
import {
  login as apiLogin,
  registerUser as apiRegisterUser,
  fetchUsers as apiFetchUsers,
  updateUserBackend as apiUpdateUser,
  deleteUserBackend as apiDeleteUser,
  createEventBackend as apiCreateEvent,
  updateEventBackend as apiUpdateEvent,
  deleteEventBackend as apiDeleteEvent,
  fetchEvents as apiFetchEvents,
  fetchAthletes as apiFetchAthletes,
  importAthletesBackend as apiImportAthletes,
  updateAthleteBackend as apiUpdateAthlete,
  type BackendUser,
  type BackendEvent,
  type BackendAthlete,
} from "@/services/api";

export type UserRole = "ADMIN" | "ORGANIZADOR" | "OPERADOR";

export type AppUser = {
  id: string;
  role: UserRole;
  name: string;
  cpf?: string;
  cnpj?: string;
  password?: string;
  email?: string;
  accessCode?: string;
  phone?: string;
  organizerId?: string;
};

export type AppEvent = {
  id: string;
  name: string;
  date: string;
  place: string;
  organizer?: string;
  status: "EM_ANDAMENTO" | "PROXIMO" | "FINALIZADO" | "RASCUNHO";
};

type AppContextValue = {
  currentUser: AppUser;
  setCurrentUserId: (id: string) => void;
  users: AppUser[];
  createUser: (user: Omit<AppUser, "id">) => Promise<void>;
  updateUser: (id: string, changes: Partial<AppUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  events: AppEvent[];
  createEvent: (event: Omit<AppEvent, "id" | "status">) => Promise<AppEvent>;
  updateEvent: (id: string, changes: Partial<AppEvent>) => void;
  deleteEvent: (id: string) => void;
  selectedEventId: string | null;
  selectedEvent: AppEvent | null;
  selectEvent: (id: string) => void;
  athletesByEvent: Record<string, ImportedRow[]>;
  importAthletes: (rows: ImportedRow[]) => Promise<void>;
  updateAthlete: (athleteId: string, changes: Record<string, unknown>) => Promise<void>;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  authUser: BackendUser | null;
  login: (identifier: string, password: string) => Promise<BackendUser>;
  logout: () => void;
};

const INITIAL_USERS: AppUser[] = [
  { id: "admin", role: "ADMIN", name: "Administrador RS KITS", cpf: "000.000.000-00", password: "admin123" },
  { id: "organizador-demo", role: "ORGANIZADOR", name: "Organizador Demonstração", cpf: "111.111.111-11", password: "organizador123", accessCode: "ORG-2027", phone: "(14) 99999-0001" },
  { id: "operador-demo", role: "OPERADOR", name: "Operador Demonstração", cpf: "222.222.222-22", password: "operador123", organizerId: "organizador-demo" },
];

const INITIAL_EVENTS: AppEvent[] = [
  { id: "maratona-2027", name: "Maratona Internacional 2027", date: "15/08/2027", place: "São Paulo, SP", organizer: "RS KITS", status: "EM_ANDAMENTO" },
];

const AppContext = createContext<AppContextValue | null>(null);
const storageKey = "rs-kits-frontend-state";
const authStorageKey = "rs-kits-auth";

const toAppUserRole = (role: BackendUser["role"]): UserRole =>
  role === "OPERATOR" ? "OPERADOR" : role;

const toAppUser = (user: BackendUser): AppUser => ({
  id: user.id,
  role: toAppUserRole(user.role),
  name: user.name,
  email: user.email ?? undefined,
  cpf: user.cpf ?? undefined,
  cnpj: user.cnpj ?? undefined,
  phone: user.phone ?? undefined,
  organizerId: user.organizerId ?? undefined,
});

const mapBackendEvent = (event: BackendEvent): AppEvent => ({
  id: event.id,
  name: event.name,
  date: formatDateBR(event.date),
  place: event.place ?? "Local a definir",
  organizer: event.organizers?.[0]?.name ?? "",
  status: (event.status as AppEvent["status"]) ?? "RASCUNHO",
});

const toDeliveryStatus = (
  value: string | null | undefined,
): ImportedRow["statusEntrega"] =>
  value === "ENTREGUE" || value === "ESTORNADO" ? value : "PENDENTE";

const mapBackendAthlete = (a: BackendAthlete): ImportedRow => ({
  id: a.id,
  num: a.num ?? "",
  nomeAtleta: a.nomeAtleta,
  kit: a.kit ?? "",
  modalidade: a.distancia ?? "",
  fxEtaria: a.fxEtaria ?? "",
  categEspecial: a.categEspecial ?? "",
  nascto: formatDateBR(a.nascimento ?? a.nascto),
  sexo: a.sexo ?? "",
  equipe: a.equipe ?? "",
  cidadeUf: a.cidadeUf ?? "",
  camiseta: a.camiseta ?? "",
  cpfAtleta: a.cpfAtleta ?? "",
  cel: a.cel ?? "",
  email: a.email ?? "",
  quemVaiRetirar: a.quemVaiRetirar ?? "",
  notas: a.notas ?? "",
  obs1: a.obs1 ?? "",
  obs2: a.obs2 ?? "",
  alerta: a.alerta ?? "",
  nomeEvento: a.nomeEvento ?? "",
  contato: a.contato ?? "",
  grauParentesco: a.grauParentesco ?? "",
  celularContato: a.celularContato ?? "",
  pin: a.pin ?? "",
  itensAdicionais: a.itensAdicionais ?? "",
  statusEntrega: toDeliveryStatus(a.statusEntrega),
  dataEntrega: a.dataEntrega ?? undefined,
  usuarioEntrega: a.usuarioEntrega ?? undefined,
  obsEntrega: a.obsEntrega ?? undefined,
  dataEstorno: a.dataEstorno ?? undefined,
  usuarioEstorno: a.usuarioEstorno ?? undefined,
  nomeEntrega: a.nomeEntrega ?? undefined,
  cpfEntrega: a.cpfEntrega ?? undefined,
  foneEntrega: a.foneEntrega ?? undefined,
  emailEntrega: a.emailEntrega ?? undefined,
  terceiro: a.terceiro ?? false,
  statusValidacao: "VALIDO",
});

export const mapBackendAthletes = (athletes: BackendAthlete[]): ImportedRow[] =>
  athletes.map(mapBackendAthlete);

const BACKEND_FIELD_MAP: Record<string, string> = {
  modalidade: "distancia",
};

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(INITIAL_EVENTS[0].id);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [athletesByEvent, setAthletesByEvent] = useState<Record<string, ImportedRow[]>>({});
  const [auth, setAuth] = useState<{ token: string; user: BackendUser } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.events) setEvents(state.events);
        if (state.selectedEventId) setSelectedEventId(state.selectedEventId);
        if (state.athletesByEvent) setAthletesByEvent(state.athletesByEvent);
      } catch { /* Mantém a demonstração inicial se o armazenamento estiver inválido. */ }
    }
    const savedAuth = localStorage.getItem(authStorageKey);
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        if (parsed && parsed.token && parsed.user) setAuth(parsed);
      } catch { /* ignorar auth inválida */ }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey, JSON.stringify({ events, selectedEventId, athletesByEvent }));
    if (auth) localStorage.setItem(authStorageKey, JSON.stringify(auth));
    else localStorage.removeItem(authStorageKey);
  }, [hydrated, events, selectedEventId, athletesByEvent, auth]);

  // Carrega os usuários do backend quando autenticado (inclusive após refresh).
  useEffect(() => {
    if (!hydrated || !auth) return;
    apiFetchUsers(auth.token)
      .then((list) => setUsers(list.map(toAppUser)))
      .catch(() => {
        // mantém usuários atuais se o backend estiver indisponível
      });
  }, [hydrated, auth]);

  // Carrega a lista de eventos do backend quando autenticado.
  // Sempre substitui a lista por eventos vindos do banco (mesmo se vazia).
  useEffect(() => {
    if (!hydrated || !auth) return;
    apiFetchEvents(auth.token)
      .then((list) => {
        const mapped = list.map(mapBackendEvent);
        setEvents(mapped);
        setSelectedEventId((current) =>
          mapped.some((event) => event.id === current) ? current : (mapped[0]?.id ?? null),
        );
      })
      .catch(() => {
        // mantém eventos locais se o backend estiver indisponível
      });
  }, [hydrated, auth]);

  // Carrega os atletas do evento selecionado quando autenticado.
  useEffect(() => {
    if (!hydrated || !auth || !selectedEventId) return;
    apiFetchAthletes(auth.token, selectedEventId, { limit: 200000 })
      .then((result) => {
        setAthletesByEvent((current) => ({
          ...current,
          [selectedEventId]: mapBackendAthletes(result.athletes),
        }));
      })
      .catch(() => {
        // falha silenciosa: mantém o cache local
      });
  }, [hydrated, auth, selectedEventId]);

  const { login, logout } = useMemo(
    () => ({
      login: async (identifier: string, password: string) => {
        const result = await apiLogin(identifier, password);
        const nextAuth = { token: result.access_token, user: result.user };
        setAuth(nextAuth);
        setCurrentUserId(result.user.id);
        try {
          setUsers((await apiFetchUsers(result.access_token)).map(toAppUser));
        } catch {
          // mantém usuários atuais se a listagem falhar
        }
        return result.user;
      },
      logout: () => {
        setAuth(null);
        setCurrentUserId(null);
      },
    }),
    [],
  );

  const value = useMemo<AppContextValue>(() => {
    const authUser = auth?.user ?? null;
    const currentUser = authUser ? toAppUser(authUser) : (users.find((user) => user.id === currentUserId) ?? users[0]);
    return {
      currentUser,
      isAuthenticated: !!auth,
      hydrated,
      authUser,
      token: auth?.token ?? null,
      login,
      logout,
      setCurrentUserId,
      users,
      createUser: async (user) => {
        if (!auth) {
          setUsers((current) => [...current, { ...user, id: crypto.randomUUID() }]);
          return;
        }
        const created = await apiRegisterUser(
          {
            name: user.name,
            email: user.email,
            cpf: user.cpf,
            cnpj: user.cnpj,
            password: user.password ?? "",
            role: user.role === "OPERADOR" ? "OPERATOR" : user.role,
            phone: user.phone,
          },
          auth.token,
        );
        setUsers((current) => [...current, toAppUser(created)]);
      },
      updateUser: async (id, changes) => {
        if (!auth) {
          setUsers((current) => current.map((user) => (user.id === id ? { ...user, ...changes } : user)));
          return;
        }
        const updated = await apiUpdateUser(
          id,
          {
            name: changes.name,
            cpf: changes.cpf,
            cnpj: changes.cnpj,
            email: changes.email,
            phone: changes.phone,
            ...(changes.password ? { password: changes.password } : {}),
          },
          auth.token,
        );
        setUsers((current) => current.map((user) => (user.id === id ? toAppUser(updated) : user)));
      },
      deleteUser: async (id) => {
        if (auth) {
          try {
            await apiDeleteUser(id, auth.token);
          } catch {
            // mantém o usuário se a remoção no backend falhar
            return;
          }
        }
        setUsers((current) => current.filter((user) => user.id !== id));
      },
      events,
      createEvent: async (event) => {
        const newEvent: AppEvent = {
          ...event,
          id: crypto.randomUUID(),
          date: event.date || "Data a definir",
          place: event.place || "Local a definir",
          organizer: event.organizer ?? "",
          status: "RASCUNHO",
        };

        if (auth) {
          let backendDate: string | undefined;
          if (event.date) {
            const raw = event.date;
            const parsed = new Date(raw.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00` : raw);
            if (!Number.isNaN(parsed.getTime())) backendDate = parsed.toISOString();
          }
          const created = await apiCreateEvent(auth.token, {
            name: newEvent.name,
            ...(backendDate ? { date: backendDate } : {}),
            ...(event.place ? { place: event.place } : {}),
            status: "PROXIMO",
          });
          newEvent.id = created.id;
          newEvent.date = formatDateBR(created.date);
          newEvent.place = created.place ?? "Local a definir";
          newEvent.status = created.status;
        }

        setEvents((current) => [newEvent, ...current]);
        setSelectedEventId(newEvent.id);
        return newEvent;
      },
      updateEvent: (id, changes) => {
        setEvents((current) => current.map((event) => (event.id === id ? { ...event, ...changes } : event)));
        if (auth) {
          let backendDate: string | undefined;
          if (changes.date) {
            const parts = changes.date.split("/");
            const parsed = parts.length === 3
              ? new Date(Date.UTC(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])))
              : new Date(changes.date);
            if (!Number.isNaN(parsed.getTime())) backendDate = parsed.toISOString();
          }
          apiUpdateEvent(auth.token, id, {
            ...(changes.name ? { name: changes.name } : {}),
            ...(backendDate ? { date: backendDate } : {}),
            ...(changes.place ? { place: changes.place } : {}),
          }).catch(() => {
            // mantém o estado local se a atualização falhar
          });
        }
      },
      deleteEvent: (id) => {
        setEvents((current) => current.filter((event) => event.id !== id));
        if (auth) {
          apiDeleteEvent(auth.token, id).catch(() => {
            // mantém o estado local se a remoção falhar
          });
        }
      },
      selectedEventId,
      selectedEvent: events.find((event) => event.id === selectedEventId) ?? null,
      selectEvent: setSelectedEventId,
      athletesByEvent,
      importAthletes: async (rows) => {
        if (!selectedEventId) return;

        if (auth) {
          const payload = rows.map((row) => {
            let nascimento: string | undefined;
            const parts = row.nascto?.split("/");
            if (parts && parts.length === 3) {
              const dt = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
              if (!Number.isNaN(dt.getTime())) nascimento = dt.toISOString();
            }
            return {
              num: row.num,
              nomeAtleta: row.nomeAtleta,
              kit: row.kit,
              distancia: row.modalidade,
              fxEtaria: row.fxEtaria,
              categEspecial: row.categEspecial,
              nascto: row.nascto,
              ...(nascimento ? { nascimento } : {}),
              sexo: row.sexo,
              equipe: row.equipe,
              cidadeUf: row.cidadeUf,
              camiseta: row.camiseta,
              cpfAtleta: row.cpfAtleta,
              cel: row.cel,
              email: row.email,
              quemVaiRetirar: row.quemVaiRetirar,
              notas: row.notas,
              obs1: row.obs1,
              obs2: row.obs2,
              alerta: row.alerta,
              nomeEvento: row.nomeEvento,
              ...(row.contato ? { contato: row.contato } : {}),
              ...(row.grauParentesco ? { grauParentesco: row.grauParentesco } : {}),
              ...(row.celularContato ? { celularContato: row.celularContato } : {}),
              ...(row.pin ? { pin: row.pin } : {}),
              ...(row.itensAdicionais ? { itensAdicionais: row.itensAdicionais } : {}),
            };
          });
          await apiImportAthletes(auth.token, selectedEventId, payload);
          const result = await apiFetchAthletes(auth.token, selectedEventId, { limit: 200000 });
          setAthletesByEvent((current) => ({
            ...current,
            [selectedEventId]: mapBackendAthletes(result.athletes),
          }));
          return;
        }

        setAthletesByEvent((current) => ({ ...current, [selectedEventId]: rows }));
      },
      updateAthlete: async (athleteId, changes) => {
        if (!selectedEventId) return;

        const applyLocal = (rows: ImportedRow[]) =>
          rows.map((row) => {
            if (row.id !== athleteId) return row;
            const merged: ImportedRow = { ...row };
            for (const [key, value] of Object.entries(changes)) {
              (merged as unknown as Record<string, unknown>)[key] = value === null ? undefined : value;
            }
            return merged;
          });

        // Aplicação otimista: a interface reflete a mudança imediatamente.
        setAthletesByEvent((current) => ({
          ...current,
          [selectedEventId]: applyLocal(current[selectedEventId] ?? []),
        }));

        if (!auth) return;

        const payload: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined) continue;
          payload[BACKEND_FIELD_MAP[key] ?? key] = value;
        }

        try {
          const updated = await apiUpdateAthlete(
            auth.token,
            selectedEventId,
            athleteId,
            payload,
          );
          const mapped = mapBackendAthlete(updated);
          setAthletesByEvent((current) => {
            const rows = current[selectedEventId] ?? [];
            return {
              ...current,
              [selectedEventId]: rows.map((row) => (row.id === athleteId ? mapped : row)),
            };
          });
        } catch {
          // mantém o estado local se o backend falhar
        }
      },
    };
  }, [users, currentUserId, events, selectedEventId, athletesByEvent, auth, login, logout, hydrated]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppState deve ser usado dentro de AppStateProvider");
  return context;
}