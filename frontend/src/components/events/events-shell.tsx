"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileUp,
  MapPin,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAppState, type AppEvent } from "@/components/providers/app-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type EventStatus = AppEvent["status"];
const statusStyle: Record<EventStatus, { label: string; tone: string }> = {
  EM_ANDAMENTO: {
    label: "Em andamento",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  PROXIMO: {
    label: "Próximo",
    tone: "bg-blue-50 text-blue-700 border-blue-200",
  },
  FINALIZADO: {
    label: "Finalizado",
    tone: "bg-slate-100 text-slate-700 border-slate-200",
  },
  RASCUNHO: {
    label: "Rascunho",
    tone: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

export function EventsShell() {
  const {
    currentUser,
    events,
    createEvent,
    selectEvent,
    selectedEventId,
    athletesByEvent,
  } = useAppState();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<EventStatus | "TODOS">("TODOS");
  const [showCreate, setShowCreate] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    date: "",
    place: "",
    organizer: "",
  });

  const athleteCount = (event: AppEvent) =>
    athletesByEvent[event.id]?.length ?? 0;

  const filtered = useMemo(
    () =>
      events.filter((event) => {
        const text = query.toLowerCase();
        return (
          (filter === "TODOS" || event.status === filter) &&
          (!text ||
            `${event.name} ${event.place} ${event.organizer}`
              .toLowerCase()
              .includes(text))
        );
      }),
    [events, filter, query],
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newEvent.name.trim()) return;
    createEvent({
      name: newEvent.name.trim(),
      date: newEvent.date || "Data a definir",
      place: newEvent.place || "Local a definir",
      organizer: newEvent.organizer || "Organizador a definir",
    });
    setNewEvent({ name: "", date: "", place: "", organizer: "" });
    setShowCreate(false);
  };
  if (currentUser.role !== "ADMIN")
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="p-8 lg:ml-64">
          <Card className="max-w-lg p-6">
            <h1 className="text-xl font-bold">Acesso restrito</h1>
            <p className="mt-2 text-sm text-slate-500">
              A tela de Eventos é exclusiva do administrador.
            </p>
          </Card>
        </main>
      </div>
    );
  const totalImported = events.reduce(
    (total, event) => total + athleteCount(event),
    0,
  );
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar />
      <main className="space-y-6 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-1 text-3xl font-black">Eventos</h1>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="h-11 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Criar novo evento
          </Button>
        </header>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [
              "Eventos",
              events.length,
              CalendarDays,
              "bg-blue-50 text-blue-700",
            ],
            [
              "Em andamento",
              events.filter((event) => event.status === "EM_ANDAMENTO").length,
              Clock3,
              "bg-emerald-50 text-emerald-700",
            ],
            [
              "Próximos",
              events.filter((event) => event.status === "PROXIMO").length,
              CheckCircle2,
              "bg-violet-50 text-violet-700",
            ],
            [
              "Atletas importados",
              totalImported,
              Users,
              "bg-amber-50 text-amber-700",
            ],
          ].map(([label, value, Icon, tone]) => {
            const MetricIcon = Icon as typeof CalendarDays;
            return (
              <Card
                key={label as string}
                className="flex items-center justify-between border-slate-200 p-4"
              >
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    {label as string}
                  </p>
                  <p className="mt-1 text-2xl font-black">{value as number}</p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}
                >
                  <MetricIcon className="h-5 w-5" />
                </div>
              </Card>
            );
          })}
        </section>
        <Card className="border-slate-200 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
            <div className="relative lg:w-[480px]">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 pl-11 pr-3 text-sm"
                placeholder="Buscar evento, cidade ou organizador"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "TODOS",
                  "EM_ANDAMENTO",
                  "PROXIMO",
                  "FINALIZADO",
                  "RASCUNHO",
                ] as const
              ).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold ${filter === status ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}
                >
                  {status === "TODOS" ? "Todos" : statusStyle[status].label}
                </button>
              ))}
            </div>
          </div>
        </Card>
        <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <Card className="overflow-hidden border-slate-200">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="font-bold">Lista de eventos</h2>
                <p className="text-xs text-slate-500">
                  Selecione um evento para mudar toda a operação.
                </p>
              </div>
              <Button variant="outline" size="sm">
                <FileUp className="mr-2 h-4 w-4" /> Exportar
              </Button>
            </div>
            <div className="divide-y">
              {filtered.map((event) => (
                <button
                  key={event.id}
                  onClick={() => selectEvent(event.id)}
                  className={`flex w-full flex-col gap-3 p-5 text-left transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between ${selectedEventId === event.id ? "bg-blue-50/60" : ""}`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{event.name}</h3>
                      <span
                        className={`rounded-full border px-2 py-1 text-[11px] font-bold ${statusStyle[event.status].tone}`}
                      >
                        {statusStyle[event.status].label}
                      </span>
                      {selectedEventId === event.id && (
                        <span className="text-xs font-bold text-blue-600">
                          Selecionado
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.place}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {athleteCount(event)} atletas
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">
                    Selecionar
                  </span>
                </button>
              ))}
              {!filtered.length && (
                <p className="p-10 text-center text-sm text-slate-500">
                  Nenhum evento encontrado.
                </p>
              )}
            </div>
          </Card>
          <Card className="border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
              Evento em operação
            </p>
            <h2 className="mt-2 text-xl font-black">
              {events.find((event) => event.id === selectedEventId)?.name ??
                "Nenhum evento"}
            </h2>
            <p className="mt-2 text-sm text-blue-100">
              A planilha importada alimenta somente o evento selecionado.
            </p>
            <Button
              variant="outline"
              onClick={() => location.assign("/import")}
              className="mt-5 w-full border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Eye className="mr-2 h-4 w-4" /> Importar planilha
            </Button>
          </Card>
        </section>
      </main>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-black">Criar novo evento</h2>
                <p className="text-sm text-slate-500">
                  Após criar, importe a planilha deste evento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-sm text-slate-500"
              >
                Cancelar
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <label className="text-sm font-semibold">
                Nome do evento
                <input
                  required
                  value={newEvent.name}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, name: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border px-3 font-normal"
                />
              </label>
              <label className="text-sm font-semibold">
                Data
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border px-3 font-normal"
                />
              </label>
              <label className="text-sm font-semibold">
                Cidade / UF
                <input
                  value={newEvent.place}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, place: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border px-3 font-normal"
                />
              </label>
              <label className="text-sm font-semibold">
                Organizador
                <input
                  value={newEvent.organizer}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, organizer: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-lg border px-3 font-normal"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreate(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600">
                Criar evento
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
