"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ImportedRow } from "@/components/import/import-shell";

export type UserRole = "ADMIN" | "ORGANIZADOR" | "OPERADOR";

export type AppUser = {
  id: string;
  role: UserRole;
  name: string;
  cpf: string;
  password: string;
  accessCode?: string;
  phone?: string;
  organizerId?: string;
};

export type AppEvent = {
  id: string;
  name: string;
  date: string;
  place: string;
  organizer: string;
  status: "EM_ANDAMENTO" | "PROXIMO" | "FINALIZADO" | "RASCUNHO";
};

type AppContextValue = {
  currentUser: AppUser;
  setCurrentUserId: (id: string) => void;
  users: AppUser[];
  createUser: (user: Omit<AppUser, "id">) => void;
  events: AppEvent[];
  createEvent: (event: Omit<AppEvent, "id" | "status">) => AppEvent;
  selectedEventId: string | null;
  selectedEvent: AppEvent | null;
  selectEvent: (id: string) => void;
  athletesByEvent: Record<string, ImportedRow[]>;
  importAthletes: (rows: ImportedRow[]) => void;
};

const INITIAL_USERS: AppUser[] = [
  { id: "admin", role: "ADMIN", name: "Administrador RS KITS", cpf: "000.000.000-00", password: "admin123" },
  { id: "organizador-demo", role: "ORGANIZADOR", name: "Organizador Demonstração", cpf: "111.111.111-11", password: "organizador123", accessCode: "ORG-2027", phone: "(14) 99999-0001" },
  { id: "operador-demo", role: "OPERADOR", name: "Operador Demonstração", cpf: "222.222.222-22", password: "operador123", organizerId: "organizador-demo" },
];

const INITIAL_EVENTS: AppEvent[] = [
  { id: "maratona-2027", name: "Maratona Internacional 2027", date: "15 Ago 2027", place: "São Paulo, SP", organizer: "RS KITS", status: "EM_ANDAMENTO" },
];

const AppContext = createContext<AppContextValue | null>(null);
const storageKey = "rs-kits-frontend-state";

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(INITIAL_EVENTS[0].id);
  const [currentUserId, setCurrentUserId] = useState("admin");
  const [athletesByEvent, setAthletesByEvent] = useState<Record<string, ImportedRow[]>>({});

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.users) setUsers(state.users);
        if (state.events) setEvents(state.events);
        if (state.currentUserId) setCurrentUserId(state.currentUserId);
        if (state.selectedEventId) setSelectedEventId(state.selectedEventId);
        if (state.athletesByEvent) setAthletesByEvent(state.athletesByEvent);
      } catch { /* Mantém a demonstração inicial se o armazenamento estiver inválido. */ }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey, JSON.stringify({ users, events, selectedEventId, currentUserId, athletesByEvent }));
  }, [hydrated, users, events, selectedEventId, currentUserId, athletesByEvent]);

  const value = useMemo<AppContextValue>(() => {
    const currentUser = users.find((user) => user.id === currentUserId) ?? users[0];
    return {
      currentUser,
      setCurrentUserId,
      users,
      createUser: (user) => setUsers((current) => [...current, { ...user, id: crypto.randomUUID() }]),
      events,
      createEvent: (event) => {
        const newEvent = { ...event, id: crypto.randomUUID(), status: "RASCUNHO" as const };
        setEvents((current) => [newEvent, ...current]);
        setSelectedEventId(newEvent.id);
        return newEvent;
      },
      selectedEventId,
      selectedEvent: events.find((event) => event.id === selectedEventId) ?? null,
      selectEvent: setSelectedEventId,
      athletesByEvent,
      importAthletes: (rows) => {
        if (!selectedEventId) return;
        setAthletesByEvent((current) => ({ ...current, [selectedEventId]: rows }));
      },
    };
  }, [users, currentUserId, events, selectedEventId, athletesByEvent]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppState deve ser usado dentro de AppStateProvider");
  return context;
}
