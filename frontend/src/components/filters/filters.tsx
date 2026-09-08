"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Inbox, PieChart } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAppState } from "@/components/providers/app-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ImportedRow } from "@/components/import/import";

type DynamicReportTab =
    | "MODALIDADE"
    | "EQUIPE"
    | "CIDADE"
    | "CAMISETA"
    | "SEXO"
    | "SEXO_DISTANCIA"
    | "IDADE"
    | "ENTREGAS_HORA";

type ReportRecord = {
    distancia: string;
    faixaEtaria: string;
    sexo: string;
    equipe: string;
    cidadeUf: string;
    camiseta: string;
    kit: string;
};

const REPORT_TABS: { id: DynamicReportTab; label: string }[] = [
    { id: "MODALIDADE", label: "Rel - Modalidade" },
    { id: "EQUIPE", label: "Rel - Equipe" },
    { id: "CIDADE", label: "Rel - Cidade" },
    { id: "CAMISETA", label: "Rel - Camiseta" },
    { id: "SEXO", label: "Rel - Sexo" },
    { id: "SEXO_DISTANCIA", label: "Rel - Sexo e Distância" },
    { id: "IDADE", label: "Rel - Idade (Faixas)" },
    { id: "ENTREGAS_HORA", label: "Rel - Entregas (Dia/Hora/Usuário)" },
];

const AGE_RANGES = [
    "Até 20 anos",
    "De 21 anos até 30 Anos",
    "De 31 anos até 40 Anos",
    "De 41 anos até 50 Anos",
    "De 51 anos até 60 Anos",
    "Mais de 61 Anos",
];

function computeIdade(nascto: string): number | null {
    const parts = nascto.split("/");
    if (parts.length !== 3) return null;

    const day = Number(parts[0]);
    const month = Number(parts[1]);
    const year = Number(parts[2]);
    if (!day || !month || !year || year < 1900 || year > 2100) return null;

    const birth = new Date(year, month - 1, day);
    if (Number.isNaN(birth.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - year;
    const monthDiff = today.getMonth() - (month - 1);
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) age--;

    return age;
}

function faixaEtariaFor(idade: number | null): string {
    if (idade === null) return "";
    if (idade <= 20) return AGE_RANGES[0];
    if (idade <= 30) return AGE_RANGES[1];
    if (idade <= 40) return AGE_RANGES[2];
    if (idade <= 50) return AGE_RANGES[3];
    if (idade <= 60) return AGE_RANGES[4];
    return AGE_RANGES[5];
}

function toReportRecords(rows: ImportedRow[]): ReportRecord[] {
    return rows
        .filter((row) => row.nomeAtleta)
        .map((row) => {
            const idade = computeIdade(row.nascto);
            const faixaEtaria = faixaEtariaFor(idade) || row.fxEtaria || "";
            return {
                distancia: row.modalidade || "-",
                faixaEtaria,
                sexo: row.sexo || "-",
                equipe: row.equipe || "Avulso",
                cidadeUf: row.cidadeUf || "-",
                camiseta: row.camiseta || "-",
                kit: row.kit || "-",
            };
        });
}

const compareAlpha = (a: string, b: string) => a.localeCompare(b, "pt-BR");

function compareDistanceAsc(a: string, b: string): number {
    const numA = Number.parseInt(a, 10);
    const numB = Number.parseInt(b, 10);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
    return compareAlpha(a, b);
}

const SHIRT_SIZE_ORDER = ["PP", "P", "M", "G", "GG", "XGG", "EG"];

function compareShirtAsc(a: string, b: string): number {
    const rankA = SHIRT_SIZE_ORDER.indexOf(a);
    const rankB = SHIRT_SIZE_ORDER.indexOf(b);
    if (rankA !== -1 || rankB !== -1) {
        if (rankA === -1) return 1;
        if (rankB === -1) return -1;
        return rankA - rankB;
    }
    return compareAlpha(a, b);
}

function uniqueSorted(values: string[], compare: (a: string, b: string) => number = compareAlpha): string[] {
    return [...new Set(values.filter(Boolean))].sort(compare);
}

function countBy(records: ReportRecord[], selector: (record: ReportRecord) => string): { label: string; total: number }[] {
    const totals: Record<string, number> = {};
    records.forEach((record) => {
        const label = selector(record);
        totals[label] = (totals[label] ?? 0) + 1;
    });
    return Object.entries(totals).map(([label, total]) => ({ label, total }));
}

function formatPlural(total: number, singular: string, plural: string): string {
    return total === 1 ? singular : plural;
}

export function Filters() {
    const { events, selectedEvent, selectEvent, athletesByEvent } = useAppState();

    const [subTabDinamico, setSubTabDinamico] = useState<DynamicReportTab>("MODALIDADE");
    const [filterSexo, setFilterSexo] = useState("TODOS");
    const [filterModalidade, setFilterModalidade] = useState("TODOS");
    const [filterCidade, setFilterCidade] = useState("TODOS");
    const [filterCamiseta, setFilterCamiseta] = useState("TODOS");
    const [filterFaixaEtaria, setFilterFaixaEtaria] = useState("TODOS");
    const [filterKit, setFilterKit] = useState("TODOS");

    const eventId = selectedEvent?.id ?? "";

    useEffect(() => {
        setFilterSexo("TODOS");
        setFilterModalidade("TODOS");
        setFilterCidade("TODOS");
        setFilterCamiseta("TODOS");
        setFilterFaixaEtaria("TODOS");
        setFilterKit("TODOS");
    }, [eventId]);

    const records = useMemo<ReportRecord[]>(
        () => (eventId ? toReportRecords(athletesByEvent[eventId] ?? []) : []),
        [athletesByEvent, eventId],
    );

    const optionSexo = useMemo(() => uniqueSorted(records.map((record) => record.sexo)), [records]);
    const optionModalidade = useMemo(() => uniqueSorted(records.map((record) => record.distancia), compareDistanceAsc), [records]);
    const optionCidade = useMemo(() => uniqueSorted(records.map((record) => record.cidadeUf)), [records]);
    const optionCamiseta = useMemo(() => uniqueSorted(records.map((record) => record.camiseta), compareShirtAsc), [records]);
    const optionFaixaEtaria = useMemo(() => uniqueSorted(records.map((record) => record.faixaEtaria)), [records]);
    const optionKit = useMemo(() => uniqueSorted(records.map((record) => record.kit)), [records]);

    const filteredAthletes = useMemo(() => records.filter((record) =>
        (filterSexo === "TODOS" || record.sexo === filterSexo) &&
        (filterModalidade === "TODOS" || record.distancia === filterModalidade) &&
        (filterCidade === "TODOS" || record.cidadeUf === filterCidade) &&
        (filterCamiseta === "TODOS" || record.camiseta === filterCamiseta) &&
        (filterFaixaEtaria === "TODOS" || record.faixaEtaria === filterFaixaEtaria) &&
        (filterKit === "TODOS" || record.kit === filterKit),
    ), [filterCamiseta, filterCidade, filterFaixaEtaria, filterKit, filterModalidade, filterSexo, records]);

    const statsModalidade = useMemo(() => countBy(filteredAthletes, (record) => record.distancia).sort((a, b) => compareDistanceAsc(a.label, b.label)), [filteredAthletes]);
    const statsEquipe = useMemo(() => countBy(filteredAthletes, (record) => record.equipe).sort((a, b) => compareAlpha(a.label, b.label)), [filteredAthletes]);
    const statsCidade = useMemo(() => countBy(filteredAthletes, (record) => record.cidadeUf).sort((a, b) => compareAlpha(a.label, b.label)), [filteredAthletes]);
    const statsCamiseta = useMemo(() => countBy(filteredAthletes, (record) => record.camiseta).sort((a, b) => compareShirtAsc(a.label, b.label)), [filteredAthletes]);
    const statsSexo = useMemo(() => {
        const masculino = filteredAthletes.filter((record) => record.sexo === "M").length;
        const total = filteredAthletes.length;
        return {
            masculino,
            feminino: total - masculino,
            pctM: total ? Math.round((masculino / total) * 100) : 0,
            pctF: total ? Math.round(((total - masculino) / total) * 100) : 0,
        };
    }, [filteredAthletes]);
    const statsSexoDistancia = useMemo(() => {
        const totals: Record<string, { m: number; f: number; total: number }> = {};
        filteredAthletes.forEach((record) => {
            totals[record.distancia] ??= { m: 0, f: 0, total: 0 };
            totals[record.distancia][record.sexo === "M" ? "m" : "f"]++;
            totals[record.distancia].total++;
        });
        return Object.entries(totals).map(([label, values]) => ({ label, ...values }))
            .sort((a, b) => compareDistanceAsc(a.label, b.label));
    }, [filteredAthletes]);
    const statsFaixaEtaria = useMemo(() =>
        AGE_RANGES.map((label) => ({
            label,
            total: filteredAthletes.filter((record) => record.faixaEtaria === label).length,
        })).filter((item) => item.total > 0),
    [filteredAthletes]);

    const hasFilters = filterSexo !== "TODOS" || filterModalidade !== "TODOS" || filterCidade !== "TODOS" ||
        filterCamiseta !== "TODOS" || filterFaixaEtaria !== "TODOS" || filterKit !== "TODOS";

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <Sidebar />
            <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur lg:ml-64">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-medium text-slate-900">
                            <PieChart className="h-5 w-5 text-blue-600" /> Filtros
                        </h1>
                        <p className="text-xs text-slate-500">
                            {selectedEvent ? `${selectedEvent.name} · ${selectedEvent.place}` : "Nenhum evento selecionado"}
                        </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        Evento
                        <select
                            value={eventId}
                            onChange={(event) => selectEvent(event.target.value)}
                            className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900"
                        >
                            {events.map((event) => (
                                <option key={event.id} value={event.id}>{event.name}</option>
                            ))}
                        </select>
                    </label>
                </div>
            </header>
            <main className="space-y-6 p-4 sm:p-6 lg:ml-64 lg:p-8">
                <Card className="space-y-3 border-slate-200 p-4 shadow-none">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase text-slate-700">
                        <Filter className="h-4 w-4 text-blue-600" /> Filtros Globais de Análise
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 lg:grid-cols-6">
                        <SelectFilter label="Modalidade" value={filterModalidade} setValue={setFilterModalidade} options={optionModalidade} />
                        <SelectFilter label="Sexo" value={filterSexo} setValue={setFilterSexo} options={optionSexo} labels={{ M: "Masculino", F: "Feminino" }} />
                        <SelectFilter label="Cidade" value={filterCidade} setValue={setFilterCidade} options={optionCidade} />
                        <SelectFilter label="Camiseta" value={filterCamiseta} setValue={setFilterCamiseta} options={optionCamiseta} />
                        <SelectFilter label="Faixa Etária" value={filterFaixaEtaria} setValue={setFilterFaixaEtaria} options={optionFaixaEtaria} />
                        <SelectFilter label="Kits" value={filterKit} setValue={setFilterKit} options={optionKit} />
                    </div>
                    <p className="text-[11px] text-slate-500">
                        {records.length} {formatPlural(records.length, "atleta", "atletas")} no evento
                        {hasFilters ? ` · ${filteredAthletes.length} ${formatPlural(filteredAthletes.length, "após o filtro aplicado", "após os filtros aplicados")}` : ""}
                    </p>
                </Card>
                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                    {REPORT_TABS.map((tab) => (
                        <Button
                            key={tab.id}
                            size="sm"
                            variant={subTabDinamico === tab.id ? "default" : "outline"}
                            onClick={() => setSubTabDinamico(tab.id)}
                            className="rounded-xl text-xs font-medium"
                        >
                            {tab.label}
                        </Button>
                    ))}
                </div>

                {records.length === 0 ? (
                    <EmptyState title="Nenhum atleta para analisar" description="Importe os atletas do evento para visualizar os relatórios." />
                ) : (
                    <>
                        {subTabDinamico === "MODALIDADE" && <CardsReport title="Relatório por Modalidade / Distância" items={statsModalidade} color="blue" suffix="atletas" />}
                        {subTabDinamico === "EQUIPE" && <TeamReport items={statsEquipe} />}
                        {subTabDinamico === "CIDADE" && <CardsReport title="Distribuição Geográfica por Cidade/UF" items={statsCidade} color="slate" suffix="atletas" />}
                        {subTabDinamico === "CAMISETA" && <CardsReport title="Demanda por Tamanho de Camiseta" items={statsCamiseta} color="indigo" />}
                        {subTabDinamico === "SEXO" && <SexReport stats={statsSexo} />}
                        {subTabDinamico === "SEXO_DISTANCIA" && <SexDistanceReport rows={statsSexoDistancia} />}
                        {subTabDinamico === "IDADE" && <CardsReport title="Distribuição por Faixas de Idade" items={statsFaixaEtaria} color="emerald" suffix="atletas" />}
                        {subTabDinamico === "ENTREGAS_HORA" && <DeliveryHoursReport />}
                    </>
                )}
            </main>
        </div>
    );
}

function SelectFilter({ label, value, setValue, options, labels = {} }: { label: string; value: string; setValue: (value: string) => void; options: string[]; labels?: Record<string, string> }) {
    return (
        <div>
            <label className="mb-1 block text-slate-500">{label}</label>
            <select value={value} onChange={(event) => setValue(event.target.value)} className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2">
                <option value="TODOS">Todos</option>
                {options.map((option) => (
                    <option key={option} value={option}>{labels[option] ?? option}</option>
                ))}
            </select>
        </div>
    );
}

function EmptyState({ title, description }: { title: string; description: string }) {
    return (
        <Card className="flex flex-col items-center justify-center gap-3 border-slate-200 p-10 text-center shadow-none">
            <Inbox className="h-10 w-10 text-slate-300" />
            <h3 className="text-base font-medium text-slate-900">{title}</h3>
            <p className="max-w-md text-sm text-slate-500">{description}</p>
        </Card>
    );
}

function CardsReport({ title, items, color, suffix = "" }: { title: string; items: { label: string; total: number }[]; color: "blue" | "slate" | "indigo" | "emerald"; suffix?: string }) {
    const colors = {
        blue: "border-blue-200 bg-blue-50/60 text-blue-600",
        slate: "border-slate-200 bg-slate-100 text-slate-500",
        indigo: "border-indigo-200 bg-indigo-50/60 text-indigo-700",
        emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-800",
    };
    return (
        <Card className="space-y-4 border-slate-200 p-5 shadow-none">
            <h3 className="text-base font-medium text-slate-900">{title}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((item) => (
                    <div key={item.label} className={`rounded-2xl border p-4 ${colors[color]}`}>
                        <p className="text-xs font-medium uppercase">{item.label}</p>
                        <p className="mt-1 text-3xl font-medium text-slate-900">{item.total} {suffix}</p>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function TeamReport({ items }: { items: { label: string; total: number }[] }) {
    return (
        <Card className="space-y-4 border-slate-200 p-5 shadow-none">
            <h3 className="text-base font-medium text-slate-900">Ranking por Equipes / Assessorias</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="truncate text-xs font-medium text-slate-800" title={item.label}>{item.label}</span>
                        <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                            {item.total}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function SexReport({ stats }: { stats: { masculino: number; feminino: number; pctM: number; pctF: number } }) {
    return (
        <Card className="space-y-4 border-slate-200 p-5 shadow-none">
            <h3 className="text-base font-medium text-slate-900">Distribuição de Atletas por Sexo</h3>
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
                    <p className="text-xs font-medium uppercase text-blue-600">Masculino</p>
                    <p className="text-4xl font-medium text-blue-600">{stats.masculino}</p>
                    <p className="text-sm font-medium text-blue-600">{stats.pctM}% do total</p>
                </div>
                <div className="space-y-2 rounded-2xl border border-pink-200 bg-pink-50 p-6 text-center">
                    <p className="text-xs font-medium uppercase text-pink-700">Feminino</p>
                    <p className="text-4xl font-medium text-pink-900">{stats.feminino}</p>
                    <p className="text-sm font-medium text-pink-600">{stats.pctF}% do total</p>
                </div>
            </div>
        </Card>
    );
}

function SexDistanceReport({ rows }: { rows: { label: string; m: number; f: number; total: number }[] }) {
    return (
        <Card className="space-y-4 border-slate-200 p-5 shadow-none">
            <h3 className="text-base font-medium text-slate-900">Matriz Cruzada: Sexo × Distância</h3>
            <div className="rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-100 font-medium uppercase text-slate-600">
                        <tr>
                            <th className="p-3">Distância / Prova</th>
                            <th className="p-3">Masculino (M)</th>
                            <th className="p-3">Feminino (F)</th>
                            <th className="p-3">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {rows.map((row) => (
                            <tr key={row.label}>
                                <td className="p-3 font-medium text-slate-900">{row.label}</td>
                                <td className="p-3 font-medium text-blue-600">{row.m} atletas</td>
                                <td className="p-3 font-medium text-pink-700">{row.f} atletas</td>
                                <td className="bg-slate-50 p-3 font-medium text-slate-900">{row.total} atletas</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function DeliveryHoursReport() {
    return (
        <Card className="space-y-4 border-slate-200 p-5 shadow-none">
            <h3 className="text-base font-medium text-slate-900">Relatório de Entregas por Dia/Hora e Operador</h3>
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <Inbox className="h-8 w-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">Nenhuma entrega registrada</p>
                <p className="max-w-md text-xs text-slate-500">
                    Os registros de entrega (data/hora e operador responsável) aparecerão aqui assim que a entrega de kits for persistida no banco de dados.
                </p>
            </div>
        </Card>
    );
}