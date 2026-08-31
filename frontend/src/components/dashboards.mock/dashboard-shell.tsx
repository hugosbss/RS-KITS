"use client";
import { useState } from "react";

import {
    BellRing,
    Clock3,
    CloudSun,
    MapPin,
    PackageCheck,
    QrCode,
    Search,
    Shirt,
    Users,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const distances = [
    { label: "5 KM", value: 42, color: "bg-blue-500" },
    { label: "10 KM", value: 31, color: "bg-indigo-500" },
    { label: "21 KM", value: 18, color: "bg-violet-500" },
    { label: "42 KM", value: 9, color: "bg-slate-500" },
];

const shirts = [
    ["PP", 12], ["P", 124], ["M", 853], ["G", 1023], ["GG", 420],
];

const peakData = [
    { hour: "08h", hoje: 26, ontem: 18 },
    { hour: "09h", hoje: 52, ontem: 45 },
    { hour: "10h", hoje: 76, ontem: 60 },
    { hour: "11h", hoje: 61, ontem: 70 },
    { hour: "12h", hoje: 32, ontem: 38 },
    { hour: "13h", hoje: 88, ontem: 55 },
    { hour: "14h", hoje: 73, ontem: 80 },
    { hour: "15h", hoje: 46, ontem: 42 },
];

function PeakLineChart({ data }: { data: typeof peakData }) {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; d: (typeof peakData)[0] } | null>(null);
    const W = 400, H = 120, PAD = 14;
    const max = Math.max(...data.flatMap((d) => [d.hoje, d.ontem]));

    const toX = (i: number) => PAD + (i * (W - PAD * 2)) / (data.length - 1);
    const toY = (v: number) => PAD + (H - PAD * 2) * (1 - v / max);

    const linePath = (key: "hoje" | "ontem") =>
        data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(2)} ${toY(d[key]).toFixed(2)}`).join(" ");

    const areaPath = (key: "hoje" | "ontem") =>
        `${linePath(key)} L ${toX(data.length - 1).toFixed(2)} ${(H - PAD).toFixed(2)} L ${PAD} ${(H - PAD).toFixed(2)} Z`;

    const peakHoje = data.reduce((a, b) => (b.hoje > a.hoje ? b : a));

    return (
        <div className="relative">
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full"
                style={{ height: 120 }}
                onMouseLeave={() => setTooltip(null)}
            >
                <defs>
                    <linearGradient id="gradHojeMock" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#152238" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#152238" stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id="gradOntemMock" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F5A623" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grade horizontal */}
                {[25, 50, 75].map((pct) => {
                    const y = PAD + (H - PAD * 2) * (1 - pct / 100);
                    return <line key={pct} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3" />;
                })}

                {/* Área + Linha Ontem */}
                <path d={areaPath("ontem")} fill="url(#gradOntemMock)" />
                <path d={linePath("ontem")} fill="none" stroke="#F5A623" strokeWidth="1.8" strokeDasharray="5 3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Área + Linha Hoje */}
                <path d={areaPath("hoje")} fill="url(#gradHojeMock)" />
                <path d={linePath("hoje")} fill="none" stroke="#152238" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Ponto de pico em coral */}
                <circle cx={toX(data.indexOf(peakHoje))} cy={toY(peakHoje.hoje)} r="5" fill="#FF6B4A" stroke="white" strokeWidth="2" />

                {/* Pontos e áreas de hover */}
                {data.map((d, i) => (
                    <g key={i}>
                        {d !== peakHoje && <circle cx={toX(i)} cy={toY(d.hoje)} r="3" fill="#152238" stroke="white" strokeWidth="1.5" />}
                        <rect x={toX(i) - 18} y={PAD} width={36} height={H - PAD * 2} fill="transparent" className="cursor-pointer" onMouseEnter={() => setTooltip({ x: toX(i), y: toY(d.hoje), d })} />
                    </g>
                ))}

                {/* Labels de hora */}
                {data.map((d, i) => (
                    <text key={`l${i}`} x={toX(i)} y={H} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">{d.hour}</text>
                ))}
            </svg>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="pointer-events-none absolute rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg -translate-x-1/2 -translate-y-full"
                    style={{ left: `${(tooltip.x / W) * 100}%`, top: `${(tooltip.y / H) * 100}%` }}
                >
                    <p className="font-medium">{tooltip.d.hour}</p>
                    <p style={{ color: "#F5A623" }}>Ontem: {tooltip.d.ontem}</p>
                    <p className="text-white">Hoje: {tooltip.d.hoje}</p>
                </div>
            )}
        </div>
    );
}

const activities = [
    ["15:25", "João Carlos recebeu o kit"],
    ["15:24", "Maria atualizou o cadastro de uma atleta"],
    ["15:23", "Relatório do evento foi gerado"],
    ["15:20", "Fernanda confirmou entrega VIP"],
];

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-sm font-medium text-slate-900">{children}</h2>;
}

export function DashboardMockShell() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <Sidebar />

            <main className="space-y-6 p-4 sm:p-6 lg:ml-64 lg:p-8">
                <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-blue-600">Painel operacional</p>
                        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Maratona Internacional 2027</h1>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4" /> São Paulo, SP · 15 de agosto</p>
                    </div>
                </header>

                <Card className="border-slate-200 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Busca rápida: nome, número ou CPF" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:flex">
                            <Button className="h-12 rounded-xl"><Search className="mr-1.5 h-4 w-4" /> Buscar</Button>
                            <Button variant="outline" className="h-12 rounded-xl"><QrCode className="mr-1.5 h-4 w-4" /> QR Code</Button>
                        </div>
                    </div>
                </Card>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        ["Atletas inscritos", "8.452", Users, "text-blue-700 bg-blue-50"],
                        ["Kits entregues", "5.230", PackageCheck, "text-emerald-700 bg-emerald-50"],
                        ["Pendentes", "3.222", Clock3, "text-amber-700 bg-amber-50"],
                        ["Alertas ativos", "19", BellRing, "text-rose-700 bg-rose-50"],
                    ].map(([label, value, Icon, tone]) => {
                        const MetricIcon = Icon as typeof Users;
                        return <Card key={label as string} className="flex items-center justify-between border-slate-200 p-4 shadow-sm"><div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label as string}</p><p className="mt-1 text-2xl font-semibold">{value as string}</p></div><div className={"flex h-11 w-11 items-center justify-center rounded-xl " + tone}><MetricIcon className="h-5 w-5" /></div></Card>;
                    })}
                </section>

                <section className="grid gap-4 xl:grid-cols-3">
                    <Card className="border-slate-200 p-5 shadow-sm xl:col-span-2">
                        <SectionTitle>Evolução do evento</SectionTitle>
                        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                            <div><p className="text-4xl font-semibold text-slate-900">61%</p><p className="mt-1 text-sm font-normal text-slate-600">Entrega concluída · 5.230 / 8.452</p></div>
                            <p className="text-sm font-medium text-emerald-700">Em andamento</p>
                        </div>
                        <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[61%] rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" /></div>
                        <div className="mt-6 grid grid-cols-3 text-center text-xs"><div><span className="mx-auto mb-2 block h-3 w-3 rounded-full bg-blue-600" />Preparação</div><div className="relative"><span className="mx-auto mb-2 block h-4 w-4 rounded-full border-4 border-blue-200 bg-blue-600" />Entrega</div><div className="text-slate-400"><span className="mx-auto mb-2 block h-3 w-3 rounded-full border-2 border-slate-300 bg-white" />Finalizado</div></div>
                    </Card>
                    <Card className="border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <SectionTitle>Picos de atendimento</SectionTitle>
                                <p className="mt-0.5 text-xs text-slate-500">Entregas por hora · Hoje vs Ontem</p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 border border-rose-200">
                                <span className="h-2 w-2 rounded-full bg-[#FF6B4A]" /> Pico: 88 (13h)
                            </span>
                        </div>
                        <div className="mt-3">
                            <PeakLineChart data={peakData} />
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block h-2.5 w-4 rounded-sm bg-[#152238]" />
                                Hoje
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block h-0 w-4" style={{ borderTop: "2px dashed #F5A623" }} />
                                Ontem
                            </span>
                        </div>
                    </Card>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Card className="border-slate-200 p-5 shadow-sm"><SectionTitle>Modalidade</SectionTitle><div className="mt-4 space-y-4">{distances.map((item) => <div key={item.label}><div className="mb-1 flex justify-between text-sm font-medium"><span>{item.label}</span><span>{item.value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={"h-full rounded-full " + item.color} style={{ width: item.value + "%" }} /></div></div>)}</div></Card>
                    <Card className="border-slate-200 p-5 shadow-sm"><SectionTitle>Kits</SectionTitle><div className="mt-4 space-y-3">{[["Entregues", "5.230", "text-emerald-700"], ["Disponíveis", "3.210", "text-blue-700"], ["Reservados", "12", "text-amber-700"]].map(([label, value, color]) => <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="text-sm text-slate-600">{label}</span><span className={"font-medium " + color}>{value}</span></div>)}</div></Card>
                    <Card className="border-slate-200 p-5 shadow-sm"><SectionTitle>Equipes</SectionTitle><div className="mt-4 space-y-3">{[["Team A", "150"], ["Team B", "35"], ["Team C", "50"]].map(([label, value]) => <div key={label} className="flex justify-between border-b border-slate-100 pb-2 text-sm"><span>{label}</span><span className="font-medium">{value}</span></div>)}</div><div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm"><span className="font-medium">Sem equipe: 812</span></div></Card>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Card className="border-slate-200 p-5 shadow-sm"><SectionTitle>Cidade dos atletas</SectionTitle><div className="mt-4 space-y-3">{[["São Paulo", "2.450"], ["Bauru", "820"], ["Campinas", "630"], ["Agudos", "630"], ["Jáu", "630"]].map(([city, total]) => <div key={city} className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-rose-500" />{city}</span><span className="font-medium">{total}</span></div>)}</div></Card>
                    <Card className="border-slate-200 p-5 shadow-sm"><div className="flex items-center justify-between"><SectionTitle>Clima</SectionTitle><CloudSun className="h-6 w-6 text-amber-500" /></div><div className="mt-5 flex items-end gap-8"><p className="text-5xl font-semibold">24°</p><div className="text-sm"><p className="text-slate-500">Umidade</p><span className="font-medium">72%</span><p className="mt-2 text-slate-500">Parcialmente nublado</p></div></div></Card>
                    <Card className="border-slate-200 p-5 shadow-sm">
                        <SectionTitle>Últimas atividades</SectionTitle>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {activities.map(([time, action]) => 
                            <div key={time} className="flex gap-3 rounded-xl bg-slate-50 p-3">
                                <p className="font-mono text-xs font-medium text-blue-700">{time}</p>
                                <p className="text-sm text-slate-700">{action}</p>
                            </div>)}
                        </div>
                    </Card>
                </section>
            </main>
        </div>
    );
}
