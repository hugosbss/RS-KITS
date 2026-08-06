"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Cloud,
  LogOut,
  MapPin,
  PackageCheck,
  RefreshCw,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "./widgets/stat-card";
import { clearAuth, getUser, type AuthUser } from "@/services/auth.service";

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

const distances = [
  ["5 KM", "1.246", "48%", "bg-sky-500"],
  ["10 KM", "2.875", "74%", "bg-blue-500"],
  ["21 KM", "3.112", "88%", "bg-indigo-500"],
  ["42 KM", "1.219", "39%", "bg-violet-500"],
];

const deliveries = [
  ["15:21", "1456", "Carlos Silva", "João"],
  ["15:18", "2831", "Mariana Costa", "Ana Clara"],
  ["15:16", "4120", "Rafael Souza", "João"],
  ["15:13", "0987", "Beatriz Lima", "Pedro"],
];

function PeakLineChart({ data }: { data: typeof peakData }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; d: (typeof peakData)[0] } | null>(null);
  const W = 400;
  const H = 120;
  const PAD = 14;
  const max = Math.max(...data.flatMap((d) => [d.hoje, d.ontem]));

  const toX = (i: number) => PAD + (i * (W - PAD * 2)) / (data.length - 1);
  const toY = (v: number) => PAD + (H - PAD * 2) * (1 - v / max);

  const linePath = (key: "hoje" | "ontem") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(2)} ${toY(d[key]).toFixed(2)}`).join(" ");

  const areaPath = (key: "hoje" | "ontem") =>
    `${linePath(key)} L ${toX(data.length - 1).toFixed(2)} ${(H - PAD).toFixed(2)} L ${PAD} ${(H - PAD).toFixed(2)} Z`;

  const peakHoje = data.reduce((a, b) => (b.hoje > a.hoje ? b : a));
  const peakOntem = data.reduce((a, b) => (b.ontem > a.ontem ? b : a));

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 130 }}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="gradHoje" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#152238" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#152238" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="gradOntem" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5A623" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grade horizontal suave */}
        {[25, 50, 75].map((pct) => {
          const y = PAD + (H - PAD * 2) * (1 - pct / 100);
          return (
            <line
              key={pct}
              x1={PAD}
              y1={y}
              x2={W - PAD}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          );
        })}

        {/* Área Ontem */}
        <path d={areaPath("ontem")} fill="url(#gradOntem)" />
        {/* Linha Ontem (tracejada, âmbar) */}
        <path
          d={linePath("ontem")}
          fill="none"
          stroke="#F5A623"
          strokeWidth="1.8"
          strokeDasharray="5 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Área Hoje */}
        <path d={areaPath("hoje")} fill="url(#gradHoje)" />
        {/* Linha Hoje (sólida, azul-marinho) */}
        <path
          d={linePath("hoje")}
          fill="none"
          stroke="#152238"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Ponto de pico "Hoje" destacado em coral */}
        <circle
          cx={toX(data.indexOf(peakHoje))}
          cy={toY(peakHoje.hoje)}
          r="5"
          fill="#FF6B4A"
          stroke="white"
          strokeWidth="2"
        />

        {/* Pontos interativos Hoje */}
        {data.map((d, i) => (
          <circle
            key={`dot-hoje-${i}`}
            cx={toX(i)}
            cy={toY(d.hoje)}
            r={d === peakHoje ? 0 : 3}
            fill="#152238"
            stroke="white"
            strokeWidth="1.5"
            className="cursor-pointer"
            onMouseEnter={() =>
              setTooltip({ x: toX(i), y: toY(d.hoje), d })
            }
          />
        ))}

        {/* Área de hover invisível por ponto */}
        {data.map((d, i) => (
          <rect
            key={`hit-${i}`}
            x={toX(i) - 18}
            y={PAD}
            width={36}
            height={H - PAD * 2}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() =>
              setTooltip({ x: toX(i), y: toY(d.hoje), d })
            }
          />
        ))}

        {/* Labels de hora */}
        {data.map((d, i) => (
          <text
            key={`label-${i}`}
            x={toX(i)}
            y={H}
            textAnchor="middle"
            fontSize="9"
            fill="#94a3b8"
            fontFamily="monospace"
          >
            {d.hour}
          </text>
        ))}
      </svg>

      {/* Tooltip flutuante */}
      {tooltip && (
        <div
          className="pointer-events-none absolute rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(tooltip.x / 400) * 100}%`,
            top: `${(tooltip.y / 130) * 100}%`,
          }}
        >
          <p className="font-bold">{tooltip.d.hour}</p>
          <p className="text-[#F5A623]">Ontem: {tooltip.d.ontem}</p>
          <p className="text-white">Hoje: {tooltip.d.hoje}</p>
        </div>
      )}
    </div>
  );
}

export function DashboardShell() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const current = getUser();
    if (!current) {
      router.replace("/login");
      return;
    }
    setUser(current);
    setOnline(navigator.onLine);
    const on = () => setOnline(true),
      off = () => setOnline(false);
    addEventListener("online", on);
    addEventListener("offline", off);
    return () => {
      removeEventListener("online", on);
      removeEventListener("offline", off);
    };
  }, [router]);

  if (!user)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Carregando painel...
      </div>
    );

  const peakHoje = peakData.reduce((a, b) => (b.hoje > a.hoje ? b : a));
  const peakOntem = peakData.reduce((a, b) => (b.ontem > a.ontem ? b : a));

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar />
      <header className="sticky top-0 z-20 h-20 border-b border-slate-200/80 bg-white/90 backdrop-blur lg:ml-64">
        <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Evento atual
            </p>
            <button className="flex items-center gap-1 text-sm font-semibold text-slate-800">
              Maratona Internacional 2026
              <ChevronDown className="h-4 w-4" />
            </button>
            <p className="hidden items-center gap-1 text-xs text-slate-500 xl:flex">
              <MapPin className="h-3 w-3" />
              São Paulo, SP · 15 de agosto
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user.name}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-blue-600">Visão geral</p>
            </div>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Atletas"
              value="8.452"
              detail="inscritos no evento"
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Kits entregues"
              value="5.230"
              detail="61,8% do total"
              icon={PackageCheck}
              color="emerald"
            />
            <StatCard
              title="Pendentes"
              value="322"
              detail="aguardando retirada"
              icon={Clock3}
              color="amber"
            />
            <StatCard
              title="Sincronizações"
              value="12"
              detail="na fila agora"
              icon={RefreshCw}
              color="violet"
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-5">
            {/* Gráfico de picos de atendimento — substitui o de barras */}
            <Card className="border-slate-200 p-5 shadow-none xl:col-span-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">Picos de atendimento</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Entregas por hora · Hoje vs Ontem
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="inline-block h-2 w-5 rounded-sm bg-[#FF6B4A]" />
                    Pico hoje ({peakHoje.hour}: {peakHoje.hoje})
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <PeakLineChart data={peakData} />
              </div>

              {/* Legenda */}
              <div className="mt-1 flex items-center gap-5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-5 rounded-sm bg-[#152238]" />
                  Hoje · máx {peakHoje.hoje} ({peakHoje.hour})
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-0 w-5"
                    style={{
                      borderTop: "2px dashed #F5A623",
                    }}
                  />
                  Ontem · máx {peakOntem.ontem} ({peakOntem.hour})
                </span>
              </div>
            </Card>

            <Card className="border-slate-200 p-5 shadow-none xl:col-span-2">
              <p className="text-sm font-semibold">
                Distribuição por distância
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Inscritos por modalidade
              </p>
              <div className="mt-6 space-y-4">
                {distances.map(([l, n, w, c]) => (
                  <div key={l}>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{l}</span>
                      <span className="text-slate-400">{n}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${c}`}
                        style={{ width: w }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-5">
            <Card className="border-slate-200 shadow-none xl:col-span-3">
              <div className="p-5">
                <p className="text-sm font-semibold">Últimas entregas</p>
                <p className="mt-1 text-xs text-slate-500">
                  Atualizado em tempo real
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {deliveries.map(([time, num, name, operator]) => (
                  <div
                    key={time}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <span className="w-9 text-xs text-slate-400">{time}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                      {num}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-slate-500">
                        Entregue por {operator}
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                ))}
              </div>
            </Card>
            <div className="space-y-4 xl:col-span-2">
              <Card className="border-slate-200 p-5 shadow-none">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    ● {online ? "Online" : "Offline"}
                  </p>
                  {online ? (
                    <Cloud className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-rose-500" />
                  )}
                </div>
                <div className="mt-5 grid grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">
                      Última sincronização
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {online ? "15:23:05" : "09:14"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Fila</p>
                    <p className="mt-1 text-lg font-semibold">
                      {online ? "12" : "158"} registros
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="border-slate-200 p-5 shadow-none">
                <p className="text-sm font-semibold">Operadores</p>
                <div className="mt-4 space-y-4">
                  {[
                    ["Carlos", "1.253", true],
                    ["João", "932", true],
                    ["Pedro", "412", false],
                  ].map(([name, count, status]) => (
                    <div key={String(name)} className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-slate-500">
                          {count} entregas
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium ${status ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        ● {status ? "Online" : "Offline"}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </section>

          <Card className="border-slate-200 shadow-none">
            <div className="flex items-center gap-2 p-5">
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Alertas do evento</p>
                <p className="text-xs text-slate-500">4 itens exigem atenção</p>
              </div>
            </div>
            <div className="grid divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
              {[
                "João possui pendência documental.",
                "Maria retira kit de terceiro.",
                "CPF duplicado identificado.",
                "Atleta VIP aguardando retirada.",
              ].map((alert) => (
                <div key={alert} className="flex items-center gap-3 px-5 py-4">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="text-sm text-slate-600">{alert}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
