"use client";
import { useMemo, useState } from "react";

import {
    BellRing,
    Clock3,
    MapPin,
    PackageCheck,
    QrCode,
    Search,
    Users,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { useAppState } from "@/components/providers/app-context";

type PeakPoint = { hour: string; hoje: number; ontem: number };

const MODALITY_COLORS = [
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-slate-500",
    "bg-cyan-500",
    "bg-emerald-500",
];

function parseBrDate(str: string | null | undefined): Date | null {
    if (!str) return null;
    const dayMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (!dayMatch) return null;
    const date = new Date(Number(dayMatch[3]), Number(dayMatch[2]) - 1, Number(dayMatch[1]));
    const timeMatch = str.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) date.setHours(Number(timeMatch[1]), Number(timeMatch[2]));
    return date;
}

function dateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function hourOf(str: string | null | undefined): string {
    const match = (str ?? "").match(/(\d{1,2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : "";
}

function PeakLineChart({ data }: { data: PeakPoint[] }) {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; d: PeakPoint } | null>(null);
    const W = 400, H = 120, PAD = 14;
    const max = Math.max(1, ...data.flatMap((d) => [d.hoje, d.ontem]));

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
                    <linearGradient id="gradHojeDashboard" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#152238" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#152238" stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id="gradOntemDashboard" x1="0" y1="0" x2="0" y2="1">
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
                <path d={areaPath("ontem")} fill="url(#gradOntemDashboard)" />
                <path d={linePath("ontem")} fill="none" stroke="#F5A623" strokeWidth="1.8" strokeDasharray="5 3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Área + Linha Hoje */}
                <path d={areaPath("hoje")} fill="url(#gradHojeDashboard)" />
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

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-sm font-medium text-slate-900">{children}</h2>;
}

export function Dashboard() {
    const { selectedEvent, athletesByEvent } = useAppState();

    const athletes = useMemo(
        () => (selectedEvent ? athletesByEvent[selectedEvent.id] ?? [] : []),
        [selectedEvent, athletesByEvent],
    );

    const total = athletes.length;
    const entregues = useMemo(() => athletes.filter((a) => a.statusEntrega === "ENTREGUE").length, [athletes]);
    const estornados = useMemo(() => athletes.filter((a) => a.statusEntrega === "ESTORNADO").length, [athletes]);
    const pendentes = Math.max(0, total - entregues - estornados);
    const alertas = useMemo(() => athletes.filter((a) => (a.alerta ?? "").trim().length > 0).length, [athletes]);
    const pct = total > 0 ? Math.round((entregues / total) * 100) : 0;

    const statusLabel: Record<string, string> = {
        RASCUNHO: "Preparação",
        PROXIMO: "Próximo",
        EM_ANDAMENTO: "Em andamento",
        FINALIZADO: "Finalizado",
    };
    const status = statusLabel[selectedEvent?.status ?? "RASCUNHO"] ?? "Preparação";
    const statusTone =
        selectedEvent?.status === "EM_ANDAMENTO"
            ? "text-emerald-700"
            : selectedEvent?.status === "FINALIZADO"
            ? "text-blue-700"
            : "text-slate-500";

    const peakData = useMemo((): PeakPoint[] => {
        const now = new Date();
        const todayKey = dateKey(now);
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayKey = dateKey(yesterday);

        const points: PeakPoint[] = [];
        for (let hour = 8; hour <= 22; hour++) {
            points.push({ hour: `${String(hour).padStart(2, "0")}h`, hoje: 0, ontem: 0 });
        }
        for (const athlete of athletes) {
            if (athlete.statusEntrega !== "ENTREGUE") continue;
            const date = parseBrDate(athlete.dataEntrega);
            if (!date) continue;
            const index = date.getHours() - 8;
            if (index < 0 || index >= points.length) continue;
            const key = dateKey(date);
            if (key === todayKey) points[index].hoje++;
            else if (key === yesterdayKey) points[index].ontem++;
        }
        return points;
    }, [athletes]);

    const peak = useMemo(() => peakData.reduce((a, b) => (b.hoje > a.hoje ? b : a)), [peakData]);

    const modalidades = useMemo(() => {
        const map = new Map<string, number>();
        for (const athlete of athletes) {
            const key = (athlete.modalidade ?? "").trim() || "Sem distância";
            map.set(key, (map.get(key) ?? 0) + 1);
        }
        return [...map.entries()]
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count);
    }, [athletes]);

    const equipes = useMemo(() => {
        const map = new Map<string, number>();
        let sem = 0;
        for (const athlete of athletes) {
            const key = (athlete.equipe ?? "").trim();
            if (!key) {
                sem++;
                continue;
            }
            map.set(key, (map.get(key) ?? 0) + 1);
        }
        const top = [...map.entries()]
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        return { top, sem };
    }, [athletes]);

    const cidades = useMemo(() => {
        const map = new Map<string, number>();
        let sem = 0;
        for (const athlete of athletes) {
            const key = (athlete.cidadeUf ?? "").trim();
            if (!key) {
                sem++;
                continue;
            }
            map.set(key, (map.get(key) ?? 0) + 1);
        }
        const sorted = [...map.entries()]
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);
        return { top: sorted.slice(0, 5), rest: sorted.slice(5).reduce((acc, c) => acc + c.value, 0), sem };
    }, [athletes]);

    const activities = useMemo(() => {
        const list: { time: string; text: string }[] = [];
        for (const athlete of athletes) {
            const name = (athlete.nomeAtleta ?? "").trim() || "Atleta";
            if (athlete.statusEntrega === "ENTREGUE" && athlete.dataEntrega) {
                list.push({
                    time: athlete.dataEntrega,
                    text: `${name} recebeu o kit${athlete.usuarioEntrega ? ` · ${athlete.usuarioEntrega}` : ""}`,
                });
            }
            if (athlete.statusEntrega === "ESTORNADO" && athlete.dataEstorno) {
                list.push({
                    time: athlete.dataEstorno,
                    text: `${name} teve entrega estornada${athlete.usuarioEstorno ? ` · ${athlete.usuarioEstorno}` : ""}`,
                });
            }
        }
        return list
            .sort((a, b) => {
                const da = parseBrDate(a.time);
                const db = parseBrDate(b.time);
                if (!da || !db) return 0;
                return db.getTime() - da.getTime();
            })
            .slice(0, 6);
    }, [athletes]);

    const metrics = [
        { label: "Atletas inscritos", value: total.toLocaleString("pt-BR"), Icon: Users, tone: "text-blue-700 bg-blue-50" },
        { label: "Kits entregues", value: entregues.toLocaleString("pt-BR"), Icon: PackageCheck, tone: "text-emerald-700 bg-emerald-50" },
        { label: "Pendentes", value: pendentes.toLocaleString("pt-BR"), Icon: Clock3, tone: "text-amber-700 bg-amber-50" },
        { label: "Alertas ativos", value: alertas.toLocaleString("pt-BR"), Icon: BellRing, tone: "text-rose-700 bg-rose-50" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <Sidebar />

            <main className="space-y-6 p-4 sm:p-6 lg:ml-64 lg:p-8">
                <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-blue-600">Painel operacional</p>
                        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{selectedEvent?.name ?? "Nenhum evento selecionado"}</h1>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4" /> {selectedEvent?.place ?? "Local a definir"}</p>
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
                    {metrics.map(({ label, value, Icon, tone }) => (
                        <Card key={label} className="flex items-center justify-between border-slate-200 p-4 shadow-sm">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                                <p className="mt-1 text-2xl font-semibold">{value}</p>
                            </div>
                            <div className={"flex h-11 w-11 items-center justify-center rounded-xl " + tone}>
                                <Icon className="h-5 w-5" />
                            </div>
                        </Card>
                    ))}
                </section>

                <section className="grid gap-4 xl:grid-cols-3">
                    <Card className="border-slate-200 p-5 shadow-sm xl:col-span-2">
                        <SectionTitle>Evolução do evento</SectionTitle>
                        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-4xl font-semibold text-slate-900">{pct}%</p>
                                <p className="mt-1 text-sm font-normal text-slate-600">
                                    {total > 0 ? `Entrega concluída · ${entregues.toLocaleString("pt-BR")} / ${total.toLocaleString("pt-BR")}` : "Nenhum evento selecionado"}
                                </p>
                            </div>
                            <p className={"text-sm font-medium " + statusTone}>{status}</p>
                        </div>
                        <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
                            <div className={"h-full rounded-full " + (pct > 0 ? "bg-gradient-to-r from-blue-600 to-emerald-500" : "bg-slate-100")} style={{ width: Math.max(pct, 2) + "%" }} />
                        </div>
                        <div className="mt-6 grid grid-cols-3 text-center text-xs">
                            <div><span className="mx-auto mb-2 block h-3 w-3 rounded-full bg-blue-600" />Preparação</div>
                            <div className="relative"><span className="mx-auto mb-2 block h-4 w-4 rounded-full border-4 border-blue-200 bg-blue-600" />Entrega</div>
                            <div className="text-slate-400"><span className="mx-auto mb-2 block h-3 w-3 rounded-full border-2 border-slate-300 bg-white" />Finalizado</div>
                        </div>
                    </Card>
                    <Card className="border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <SectionTitle>Picos de atendimento</SectionTitle>
                                <p className="mt-0.5 text-xs text-slate-500">Entregas por hora · Hoje vs Ontem</p>
                            </div>
                            {peak.hoje > 0 ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 border border-rose-200">
                                    <span className="h-2 w-2 rounded-full bg-[#FF6B4A]" /> Pico: {peak.hoje} ({peak.hour})
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 border border-slate-200">
                                    Sem entregas hoje
                                </span>
                            )}
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
                    <Card className="border-slate-200 p-5 shadow-sm">
                        <SectionTitle>Modalidade</SectionTitle>
                        {modalidades.length === 0 ? (
                            <p className="mt-4 text-sm text-slate-500">Nenhum atleta importado.</p>
                        ) : (
                            <div className="mt-4 space-y-4">
                                {modalidades.map((item, index) => {
                                    const p = total > 0 ? Math.round((item.count / total) * 100) : 0;
                                    return (
                                        <div key={item.label}>
                                            <div className="mb-1 flex justify-between text-sm font-medium">
                                                <span>{item.label} · {item.count}</span>
                                                <span>{p}%</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                <div className={"h-full rounded-full " + MODALITY_COLORS[index % MODALITY_COLORS.length]} style={{ width: p + "%" }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                    <Card className="border-slate-200 p-5 shadow-sm">
                        <SectionTitle>Kits</SectionTitle>
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                <span className="text-sm text-slate-600">Entregues</span>
                                <span className="font-medium text-emerald-700">{entregues.toLocaleString("pt-BR")}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                <span className="text-sm text-slate-600">Disponíveis</span>
                                <span className="font-medium text-blue-700">{pendentes.toLocaleString("pt-BR")}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                <span className="text-sm text-slate-600">Estornados</span>
                                <span className="font-medium text-amber-700">{estornados.toLocaleString("pt-BR")}</span>
                            </div>
                        </div>
                    </Card>
                    <Card className="border-slate-200 p-5 shadow-sm">
                        <SectionTitle>Equipes</SectionTitle>
                        <div className="mt-4 space-y-3">
                            {equipes.top.length === 0 && <p className="text-sm text-slate-500">Sem equipes ainda.</p>}
                            {equipes.top.map(({ label, value }) => (
                                <div key={label} className="flex justify-between border-b border-slate-100 pb-2 text-sm">
                                    <span>{label}</span>
                                    <span className="font-medium">{value.toLocaleString("pt-BR")}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm">
                            <span className="font-medium">Sem equipe: {equipes.sem.toLocaleString("pt-BR")}</span>
                        </div>
                    </Card>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Card className="border-slate-200 p-5 shadow-sm">
                        <SectionTitle>Cidade dos atletas</SectionTitle>
                        <div className="mt-4 space-y-3">
                            {cidades.top.length === 0 && cidades.sem === 0 && <p className="text-sm text-slate-500">Nenhum atleta importado.</p>}
                            {cidades.top.map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-rose-500" />
                                        {label}
                                    </span>
                                    <span className="font-medium">{value.toLocaleString("pt-BR")}</span>
                                </div>
                            ))}
                        </div>
                        {(cidades.rest > 0 || cidades.sem > 0) && (
                            <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
                                {cidades.rest > 0 && (
                                    <div className="flex justify-between text-slate-500">
                                        <span>Outras</span>
                                        <span className="font-medium text-slate-700">{cidades.rest.toLocaleString("pt-BR")}</span>
                                    </div>
                                )}
                                {cidades.sem > 0 && (
                                    <div className="flex justify-between text-slate-500">
                                        <span>Sem cidade</span>
                                        <span className="font-medium text-slate-700">{cidades.sem.toLocaleString("pt-BR")}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                    <WeatherCard place={selectedEvent?.place} eventDate={selectedEvent?.date} />
                    <Card className="border-slate-200 p-5 shadow-sm">
                        <SectionTitle>Últimas atividades</SectionTitle>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {activities.length === 0 ? (
                                <div className="col-span-full rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                                    Nenhuma atividade registrada.
                                </div>
                            ) : (
                                activities.map((activity) => (
                                    <div key={activity.time + activity.text} className="flex gap-3 rounded-xl bg-slate-50 p-3">
                                        <p className="font-mono text-xs font-medium text-blue-700">{hourOf(activity.time)}</p>
                                        <p className="text-sm text-slate-700">{activity.text}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </section>
            </main>
        </div>
    );
}