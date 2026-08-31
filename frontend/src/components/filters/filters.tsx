"use client";

import { useMemo, useState } from "react";
import { Filter, PieChart } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DynamicReportTab = "MODALIDADE" | "EQUIPE" | "CIDADE" | "CAMISETA" | "SEXO" | "SEXO_DISTANCIA" | "IDADE" | "ENTREGAS_HORA";
type AthleteFilterRecord = {
    distancia: string;
    faixaEtaria: string;
    sexo: "M" | "F";
    equipe: string;
    cidadeUf: string;
    camiseta: string;
    kit: string;
};

// Dados temporários compartilhados com os relatórios até a fonte de dados ser conectada à API.
const MOCK_ATHLETES_REPORT: AthleteFilterRecord[] = [
    { distancia: "10 KM", faixaEtaria: "35–39", sexo: "M", equipe: "Runners Club", cidadeUf: "Bauru/SP", camiseta: "G", kit: "Kit Padrão" },
    { distancia: "21 KM", faixaEtaria: "30–34", sexo: "M", equipe: "Pace Makers", cidadeUf: "São Paulo/SP", camiseta: "M", kit: "Kit VIP" },
    { distancia: "5 KM", faixaEtaria: "40–44", sexo: "F", equipe: "Runners Club", cidadeUf: "Campinas/SP", camiseta: "P", kit: "Kit Padrão" },
    { distancia: "10 KM", faixaEtaria: "25–29", sexo: "F", equipe: "Sprint Team", cidadeUf: "Bauru/SP", camiseta: "M", kit: "Kit Padrão" },
    { distancia: "42 KM", faixaEtaria: "51–60", sexo: "M", equipe: "Avulso", cidadeUf: "Sorocaba/SP", camiseta: "GG", kit: "Kit Premium" },
    { distancia: "21 KM", faixaEtaria: "31–40", sexo: "F", equipe: "Pace Makers", cidadeUf: "São Paulo/SP", camiseta: "Baby Look M", kit: "Kit VIP" },
    { distancia: "5 KM", faixaEtaria: "Até 20 anos", sexo: "M", equipe: "Sprint Team", cidadeUf: "Bauru/SP", camiseta: "P", kit: "Kit Padrão" },
    { distancia: "42 KM", faixaEtaria: "Mais de 61 Anos", sexo: "M", equipe: "Avulso", cidadeUf: "São Paulo/SP", camiseta: "XGG", kit: "Kit Premium" },
];

const REPORT_TABS: { id: DynamicReportTab; label: string }[] = [
    { id: "MODALIDADE", label: "Rel - Modalidade" }, { id: "EQUIPE", label: "Rel - Equipe" },
    { id: "CIDADE", label: "Rel - Cidade" }, { id: "CAMISETA", label: "Rel - Camiseta" },
    { id: "SEXO", label: "Rel - Sexo" }, { id: "SEXO_DISTANCIA", label: "Rel - Sexo e Distância" },
    { id: "IDADE", label: "Rel - Idade (Faixas)" }, { id: "ENTREGAS_HORA", label: "Rel - Entregas (Dia/Hora/Usuário)" },
];

const AGE_RANGES = ["Até 20 anos", "De 21 anos até 30 Anos", "De 31 anos até 40 Anos", "De 41 anos até 50 Anos", "De 51 anos até 60 Anos", "Mais de 61 Anos"];
const DELIVERY_HOURS = [
    { hora: "08:00 - 09:00", entregas: 12, operador: "Carlos Operador" },
    { hora: "09:00 - 10:00", entregas: 45, operador: "Fernanda Operadora" },
    { hora: "10:00 - 11:00", entregas: 88, operador: "Carlos Operador" },
    { hora: "11:00 - 12:00", entregas: 62, operador: "Supervisão Ana" },
];

export function Filters() {
    const [subTabDinamico, setSubTabDinamico] = useState<DynamicReportTab>("MODALIDADE");
    const [filterSexo, setFilterSexo] = useState("TODOS");
    const [filterModalidade, setFilterModalidade] = useState("TODOS");
    const [filterCidade, setFilterCidade] = useState("TODOS");
    const [filterCamiseta, setFilterCamiseta] = useState("TODOS");
    const [filterFaixaEtaria, setFilterFaixaEtaria] = useState("TODOS");
    const [filterKit, setFilterKit] = useState("TODOS");

    const filteredAthletes = useMemo(() => MOCK_ATHLETES_REPORT.filter((athlete) =>
        (filterSexo === "TODOS" || athlete.sexo === filterSexo) &&
        (filterModalidade === "TODOS" || athlete.distancia === filterModalidade) &&
        (filterCidade === "TODOS" || athlete.cidadeUf === filterCidade) &&
        (filterCamiseta === "TODOS" || athlete.camiseta === filterCamiseta) &&
        (filterFaixaEtaria === "TODOS" || athlete.faixaEtaria === filterFaixaEtaria) &&
        (filterKit === "TODOS" || athlete.kit === filterKit),
    ), [filterCamiseta, filterCidade, filterFaixaEtaria, filterKit, filterModalidade, filterSexo]);

    const statsModalidade = useMemo(() => countBy(filteredAthletes, (athlete) => athlete.distancia), [filteredAthletes]);
    const statsEquipe = useMemo(() => countBy(filteredAthletes, (athlete) => athlete.equipe).sort((a, b) => b.total - a.total), [filteredAthletes]);
    const statsCidade = useMemo(() => countBy(filteredAthletes, (athlete) => athlete.cidadeUf), [filteredAthletes]);
    const statsCamiseta = useMemo(() => countBy(filteredAthletes, (athlete) => athlete.camiseta), [filteredAthletes]);
    const statsSexo = useMemo(() => {
        const masculino = filteredAthletes.filter((athlete) => athlete.sexo === "M").length;
        const total = filteredAthletes.length;
        return { masculino, feminino: total - masculino, pctM: total ? Math.round((masculino / total) * 100) : 0, pctF: total ? Math.round(((total - masculino) / total) * 100) : 0 };
    }, [filteredAthletes]);
    const statsSexoDistancia = useMemo(() => {
        const totals: Record<string, { m: number; f: number; total: number }> = {};
        filteredAthletes.forEach((athlete) => {
            totals[athlete.distancia] ??= { m: 0, f: 0, total: 0 };
            totals[athlete.distancia][athlete.sexo === "M" ? "m" : "f"]++;
            totals[athlete.distancia].total++;
        });
        return Object.entries(totals).map(([label, values]) => ({ label, ...values }));
    }, [filteredAthletes]);
    const statsFaixaEtaria = useMemo(() => AGE_RANGES.map((label) => ({ label, total: filteredAthletes.filter((athlete) => ageRangeFor(athlete.faixaEtaria) === label).length })), [filteredAthletes]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <Sidebar />
            <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur lg:ml-64">
                <div className="p-4 sm:px-6 lg:px-8">
                    <h1 className="flex items-center gap-2 text-xl font-medium text-slate-900"><PieChart className="h-5 w-5 text-blue-600" /> Filtros</h1>
                    <p className="text-xs text-slate-500">Maratona Internacional 2027 · São Paulo, SP</p>
                </div>
            </header>
            <main className="space-y-6 p-4 sm:p-6 lg:ml-64 lg:p-8">
                <Card className="space-y-3 border-slate-200 p-4 shadow-none">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase text-slate-700"><Filter className="h-4 w-4 text-blue-600" /> Filtros Globais de Análise</div>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 lg:grid-cols-6">
                        <SelectFilter label="Modalidade" value={filterModalidade} setValue={setFilterModalidade} options={filterValues("distancia")} />
                        <SelectFilter label="Sexo" value={filterSexo} setValue={setFilterSexo} options={["M", "F"]} labels={{ M: "Masculino", F: "Feminino" }} />
                        <SelectFilter label="Cidade" value={filterCidade} setValue={setFilterCidade} options={filterValues("cidadeUf")} />
                        <SelectFilter label="Camiseta" value={filterCamiseta} setValue={setFilterCamiseta} options={filterValues("camiseta")} />
                        <SelectFilter label="Faixa Etária" value={filterFaixaEtaria} setValue={setFilterFaixaEtaria} options={filterValues("faixaEtaria")} />
                        <SelectFilter label="Kits" value={filterKit} setValue={setFilterKit} options={filterValues("kit")} />
                    </div>
                </Card>
                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                    {REPORT_TABS.map((tab) => <Button key={tab.id} size="sm" variant={subTabDinamico === tab.id ? "default" : "outline"} onClick={() => setSubTabDinamico(tab.id)} className="rounded-xl text-xs font-medium">{tab.label}</Button>)}
                </div>
                {subTabDinamico === "MODALIDADE" && <CardsReport title="Relatório por Modalidade / Distância" items={statsModalidade} color="blue" suffix="atletas" />}
                {subTabDinamico === "EQUIPE" && <TeamReport items={statsEquipe} />}
                {subTabDinamico === "CIDADE" && <CardsReport title="Distribuição Geográfica por Cidade/UF" items={statsCidade} color="slate" suffix="atletas" />}
                {subTabDinamico === "CAMISETA" && <CardsReport title="Demanda por Tamanho de Camiseta" items={statsCamiseta} color="indigo" />}
                {subTabDinamico === "SEXO" && <SexReport stats={statsSexo} />}
                {subTabDinamico === "SEXO_DISTANCIA" && <SexDistanceReport rows={statsSexoDistancia} />}
                {subTabDinamico === "IDADE" && <CardsReport title="Distribuição por Faixas de Idade" items={statsFaixaEtaria} color="emerald" suffix="atletas" />}
                {subTabDinamico === "ENTREGAS_HORA" && <DeliveryHoursReport />}
            </main>
        </div>
    );
}

function filterValues(field: keyof AthleteFilterRecord) { return [...new Set(MOCK_ATHLETES_REPORT.map((athlete) => athlete[field]))].sort(); }
function countBy(records: AthleteFilterRecord[], selector: (athlete: AthleteFilterRecord) => string) { const totals: Record<string, number> = {}; records.forEach((athlete) => { const label = selector(athlete); totals[label] = (totals[label] ?? 0) + 1; }); return Object.entries(totals).map(([label, total]) => ({ label, total })); }
function ageRangeFor(faixa: string) { if (faixa.includes("20")) return AGE_RANGES[0]; if (faixa.includes("25") || faixa.includes("30")) return AGE_RANGES[1]; if (faixa.includes("35") || faixa.includes("40")) return AGE_RANGES[2]; if (faixa.includes("45") || faixa.includes("50")) return AGE_RANGES[3]; if (faixa.includes("51") || faixa.includes("54") || faixa.includes("60")) return AGE_RANGES[4]; return AGE_RANGES[5]; }

function SelectFilter({ label, value, setValue, options, labels = {} }: { label: string; value: string; setValue: (value: string) => void; options: string[]; labels?: Record<string, string> }) { return <div><label className="mb-1 block text-slate-500">{label}</label><select value={value} onChange={(event) => setValue(event.target.value)} className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2"><option value="TODOS">Todos</option>{options.map((option) => <option key={option} value={option}>{labels[option] ?? option}</option>)}</select></div>; }
function CardsReport({ title, items, color, suffix = "" }: { title: string; items: { label: string; total: number }[]; color: "blue" | "slate" | "indigo" | "emerald"; suffix?: string }) { const colors = { blue: "border-blue-200 bg-blue-50/60 text-blue-600", slate: "border-slate-200 bg-slate-100 text-slate-500", indigo: "border-indigo-200 bg-indigo-50/60 text-indigo-700", emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-800" }; return <Card className="space-y-4 border-slate-200 p-5 shadow-none"><h3 className="text-base font-medium text-slate-900">{title}</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map((item) => <div key={item.label} className={`rounded-2xl border p-4 ${colors[color]}`}><p className="text-xs font-medium uppercase">{item.label}</p><p className="mt-1 text-3xl font-medium text-slate-900">{item.total} {suffix}</p></div>)}</div></Card>; }
function TeamReport({ items }: { items: { label: string; total: number }[] }) { return <Card className="space-y-4 border-slate-200 p-5 shadow-none"><h3 className="text-base font-medium text-slate-900">Ranking por Equipes / Assessorias</h3><div className="space-y-3">{items.map((item) => <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"><span className="font-medium text-slate-800">{item.label}</span><span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-medium text-blue-600">{item.total} inscritos</span></div>)}</div></Card>; }
function SexReport({ stats }: { stats: { masculino: number; feminino: number; pctM: number; pctF: number } }) { return <Card className="space-y-4 border-slate-200 p-5 shadow-none"><h3 className="text-base font-medium text-slate-900">Distribuição de Atletas por Sexo</h3><div className="grid gap-6 sm:grid-cols-2"><div className="space-y-2 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center"><p className="text-xs font-medium uppercase text-blue-600">Masculino</p><p className="text-4xl font-medium text-blue-600">{stats.masculino}</p><p className="text-sm font-medium text-blue-600">{stats.pctM}% do total</p></div><div className="space-y-2 rounded-2xl border border-pink-200 bg-pink-50 p-6 text-center"><p className="text-xs font-medium uppercase text-pink-700">Feminino</p><p className="text-4xl font-medium text-pink-900">{stats.feminino}</p><p className="text-sm font-medium text-pink-600">{stats.pctF}% do total</p></div></div></Card>; }
function SexDistanceReport({ rows }: { rows: { label: string; m: number; f: number; total: number }[] }) { return <Card className="space-y-4 border-slate-200 p-5 shadow-none"><h3 className="text-base font-medium text-slate-900">Matriz Cruzada: Sexo × Distância</h3><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-left text-xs"><thead className="border-b border-slate-200 bg-slate-100 font-medium uppercase text-slate-600"><tr><th className="p-3">Distância / Prova</th><th className="p-3">Masculino (M)</th><th className="p-3">Feminino (F)</th><th className="p-3">Total</th></tr></thead><tbody className="divide-y divide-slate-100 bg-white">{rows.map((row) => <tr key={row.label}><td className="p-3 font-medium text-slate-900">{row.label}</td><td className="p-3 font-medium text-blue-600">{row.m} atletas</td><td className="p-3 font-medium text-pink-700">{row.f} atletas</td><td className="bg-slate-50 p-3 font-medium text-slate-900">{row.total} atletas</td></tr>)}</tbody></table></div></Card>; }
function DeliveryHoursReport() { return <Card className="space-y-4 border-slate-200 p-5 shadow-none"><h3 className="text-base font-medium text-slate-900">Relatório de Entregas por Dia/Hora e Operador</h3><div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-xs"><thead className="border-b border-slate-200 bg-slate-100 font-medium uppercase text-slate-600"><tr><th className="p-3">Intervalo de Horário</th><th className="p-3">Operador / Atendente</th><th className="p-3">Total de Kits Entregues</th></tr></thead><tbody className="divide-y divide-slate-100">{DELIVERY_HOURS.map((row) => <tr key={`${row.hora}-${row.operador}`}><td className="p-3 font-mono font-medium text-slate-800">{row.hora}</td><td className="p-3 font-medium text-slate-900">{row.operador}</td><td className="bg-emerald-50/50 p-3 font-medium text-emerald-600">{row.entregas} kits</td></tr>)}</tbody></table></div></Card>; }
