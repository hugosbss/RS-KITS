"use client";

import { useMemo, useState } from "react";
import {
    Archive,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Edit,
    Eye,
    FileUp,
    MapPin,
    MoreHorizontal,
    Plus,
    Search,
    Users,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type EventStatus = "EM_ANDAMENTO" | "PROXIMO" | "FINALIZADO" | "RASCUNHO";

type SportEvent = {
    id: number;
    name: string;
    date: string;
    place: string;
    status: EventStatus;
    athletes: number;
    delivered: number;
    organizer: string;
};

const initialEvents: SportEvent[] = [
    { id: 1, name: "Maratona Internacional 2027", date: "15 Ago 2027", place: "Sao Paulo, SP", status: "EM_ANDAMENTO", athletes: 8452, delivered: 5230, organizer: "Sport Delivery" },
    { id: 2, name: "Circuito Bauru de Corrida", date: "30 Ago 2027", place: "Bauru, SP", status: "PROXIMO", athletes: 2380, delivered: 0, organizer: "Prefeitura de Bauru" },
    { id: 3, name: "Meia Maratona Ribeirao", date: "12 Jul 2027", place: "Ribeirao Preto, SP", status: "FINALIZADO", athletes: 6120, delivered: 6114, organizer: "Runners Brasil" },
    { id: 4, name: "Corrida Sunset Campinas", date: "05 Set 2027", place: "Campinas, SP", status: "RASCUNHO", athletes: 0, delivered: 0, organizer: "Campinas Running" },
];

const statusStyle: Record<EventStatus, { label: string; tone: string }> = {
    EM_ANDAMENTO: { label: "Em andamento", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    PROXIMO: { label: "Proximo", tone: "bg-blue-50 text-blue-700 border-blue-200" },
    FINALIZADO: { label: "Finalizado", tone: "bg-slate-100 text-slate-700 border-slate-200" },
    RASCUNHO: { label: "Rascunho", tone: "bg-amber-50 text-amber-700 border-amber-200" },
};

export function EventsShell() {
    const [events, setEvents] = useState<SportEvent[]>(initialEvents);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<EventStatus | "TODOS">("TODOS");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeEvent, setActiveEvent] = useState<SportEvent | null>(null);
    const [newEvent, setNewEvent] = useState({ name: "", date: "", place: "", organizer: "" });

    const filteredEvents = useMemo(() => {
        const search = query.trim().toLowerCase();
        return events.filter((event) => {
            const matchesStatus = statusFilter === "TODOS" || event.status === statusFilter;
            const matchesQuery = !search || event.name.toLowerCase().includes(search) || event.place.toLowerCase().includes(search) || event.organizer.toLowerCase().includes(search);
            return matchesStatus && matchesQuery;
        });
    }, [events, query, statusFilter]);

    const totals = useMemo(() => ({
        total: events.length,
        active: events.filter((event) => event.status === "EM_ANDAMENTO").length,
        upcoming: events.filter((event) => event.status === "PROXIMO").length,
        athletes: events.reduce((sum, event) => sum + event.athletes, 0),
    }), [events]);

    const createEvent = (event: React.FormEvent) => {
        event.preventDefault();
        if (!newEvent.name.trim()) return;
        setEvents((current) => [{
            id: Date.now(),
            name: newEvent.name.trim(),
            date: newEvent.date || "Data a definir",
            place: newEvent.place || "Local a definir",
            organizer: newEvent.organizer || "Organizador a definir",
            status: "RASCUNHO",
            athletes: 0,
            delivered: 0,
        }, ...current]);
        setNewEvent({ name: "", date: "", place: "", organizer: "" });
        setShowCreateModal(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <Sidebar />

            <main className="space-y-6 p-4 sm:p-6 lg:ml-64 lg:p-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Gestao do sistema</p>
                        <h1 className="mt-1 text-3xl font-black text-slate-900">Eventos</h1>
                        <p className="mt-1 text-sm text-slate-500">Crie, acompanhe e prepare todos os eventos esportivos.</p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} className="h-11 rounded-xl bg-blue-600 px-5 font-bold hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" /> Criar novo evento
                    </Button>
                </header>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        ["Total de eventos", totals.total, CalendarDays, "bg-blue-50 text-blue-700"],
                        ["Em andamento", totals.active, Clock3, "bg-emerald-50 text-emerald-700"],
                        ["Proximos eventos", totals.upcoming, CheckCircle2, "bg-violet-50 text-violet-700"],
                        ["Atletas inscritos", totals.athletes.toLocaleString("pt-BR"), Users, "bg-amber-50 text-amber-700"],
                    ].map(([label, value, Icon, tone]) => {
                        const MetricIcon = Icon as typeof CalendarDays;
                        return <Card key={label as string} className="flex items-center justify-between border-slate-200 p-4 shadow-sm">
                            <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label as string}</p><p className="mt-1 text-2xl font-black text-slate-900">{value as string | number}</p></div>
                            <div className={"flex h-11 w-11 items-center justify-center rounded-xl " + tone}><MetricIcon className="h-5 w-5" /></div>
                        </Card>;
                    })}
                </section>

                <Card className="border-slate-200 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full lg:max-w-xl">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Buscar por evento, cidade ou organizador" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(["TODOS", "EM_ANDAMENTO", "PROXIMO", "FINALIZADO", "RASCUNHO"] as const).map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={"rounded-lg border px-3 py-2 text-xs font-semibold transition " + (statusFilter === status ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>{status === "TODOS" ? "Todos" : statusStyle[status].label}</button>)}
                        </div>
                    </div>
                </Card>

                <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5">
                            <div><h2 className="font-bold text-slate-900">Lista de eventos</h2><p className="mt-1 text-xs text-slate-500">{filteredEvents.length} evento(s) encontrado(s)</p></div>
                            <Button variant="outline" size="sm" className="text-slate-600"><FileUp className="mr-1.5 h-4 w-4" /> Exportar</Button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {filteredEvents.map((event) => {
                                const progress = event.athletes ? Math.round((event.delivered / event.athletes) * 100) : 0;
                                return <article key={event.id} className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between">
                                    <button type="button" onClick={() => setActiveEvent(event)} className="min-w-0 text-left">
                                        <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{event.name}</h3><span className={"rounded-full border px-2.5 py-1 text-[11px] font-bold " + statusStyle[event.status].tone}>{statusStyle[event.status].label}</span></div>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {event.date}</span><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.place}</span><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {event.athletes.toLocaleString("pt-BR")} atletas</span></div>
                                    </button>
                                    <div className="flex items-center gap-4 md:min-w-56">
                                        <div className="flex-1"><div className="mb-1 flex justify-between text-xs text-slate-500"><span>Entrega de kits</span><span className="font-bold text-slate-700">{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: progress + "%" }} /></div></div>
                                        <button type="button" onClick={() => setActiveEvent(event)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"><MoreHorizontal className="h-5 w-5" /></button>
                                    </div>
                                </article>;
                            })}
                            {!filteredEvents.length && <div className="p-10 text-center text-sm text-slate-500">Nenhum evento encontrado para os filtros selecionados.</div>}
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <Card className="border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-blue-100">Evento em destaque</p><h2 className="mt-2 text-xl font-black">Maratona Internacional 2027</h2><p className="mt-2 text-sm text-blue-100">5.230 kits entregues de 8.452 inscritos.</p><Button variant="outline" className="mt-5 w-full border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Eye className="mr-2 h-4 w-4" /> Abrir operacao</Button></Card>
                        <Card className="border-slate-200 p-5 shadow-sm"><h2 className="font-bold text-slate-900">Atalhos</h2><div className="mt-4 space-y-2"><Button variant="outline" className="w-full justify-start"><FileUp className="mr-2 h-4 w-4" /> Importar atletas</Button><Button variant="outline" className="w-full justify-start"><Users className="mr-2 h-4 w-4" /> Gerenciar operadores</Button><Button variant="outline" className="w-full justify-start"><Archive className="mr-2 h-4 w-4" /> Eventos arquivados</Button></div></Card>
                    </div>
                </section>
            </main>

            {showCreateModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"><form onSubmit={createEvent} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-black">Criar novo evento</h2><p className="mt-1 text-sm text-slate-500">Comece com os dados principais do evento.</p></div><button type="button" onClick={() => setShowCreateModal(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-900">Cancelar</button></div><div className="mt-5 grid gap-4"><label className="text-sm font-semibold">Nome do evento<input required value={newEvent.name} onChange={(event) => setNewEvent({ ...newEvent, name: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal" placeholder="Ex.: Corrida da Cidade" /></label><label className="text-sm font-semibold">Data<input type="date" value={newEvent.date} onChange={(event) => setNewEvent({ ...newEvent, date: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal" /></label><label className="text-sm font-semibold">Cidade / UF<input value={newEvent.place} onChange={(event) => setNewEvent({ ...newEvent, place: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal" placeholder="Ex.: Bauru, SP" /></label><label className="text-sm font-semibold">Organizador<input value={newEvent.organizer} onChange={(event) => setNewEvent({ ...newEvent, organizer: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal" placeholder="Nome do organizador" /></label></div><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button><Button type="submit" className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-1.5 h-4 w-4" /> Criar evento</Button></div></form></div>}

            {activeEvent && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"><Card className="w-full max-w-md border-slate-200 p-6 shadow-2xl"><div className="flex items-start justify-between"><div><span className={"rounded-full border px-2.5 py-1 text-[11px] font-bold " + statusStyle[activeEvent.status].tone}>{statusStyle[activeEvent.status].label}</span><h2 className="mt-3 text-xl font-black">{activeEvent.name}</h2><p className="mt-1 text-sm text-slate-500">{activeEvent.organizer}</p></div><button type="button" onClick={() => setActiveEvent(null)} className="text-sm font-semibold text-slate-500">Fechar</button></div><div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm"><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-blue-600" /> {activeEvent.date}</p><p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" /> {activeEvent.place}</p><p className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" /> {activeEvent.athletes.toLocaleString("pt-BR")} atletas inscritos</p></div><Button className="mt-5 w-full"><Edit className="mr-2 h-4 w-4" /> Editar evento</Button></Card></div>}
        </div>
    );
}
