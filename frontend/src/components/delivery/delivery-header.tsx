"use client";

import {
    Clock3,
    MapPin,
    Monitor,
    PackageCheck,
    Settings2,
    Trophy,
    Trash2,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SecondScreenDisplayMode } from "@/components/delivery/second-screen";

interface DeliveryHeaderProps {
    eventName: string;
    eventPlace: string;
    stats: { total: number; entregues: number; pendentes: number; pct: number };
    showDropDownUtilities: boolean;
    setShowDropDownUtilities: React.Dispatch<React.SetStateAction<boolean>>;
    setShowResetModal: React.Dispatch<React.SetStateAction<boolean>>;
    openSecondScreen: () => void;
    secondScreenMode: SecondScreenDisplayMode;
    setSecondScreenMode: React.Dispatch<React.SetStateAction<SecondScreenDisplayMode>>;
    setShowRaffleModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export function DeliveryHeader({
    eventName,
    eventPlace,
    stats,
    showDropDownUtilities,
    setShowDropDownUtilities,
    setShowResetModal,
    openSecondScreen,
    secondScreenMode,
    setSecondScreenMode,
    setShowRaffleModal,
}: DeliveryHeaderProps) {
    return (
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur lg:ml-64">
            <div
                className="
                    grid
                    grid-cols-[minmax(0,1fr)_auto]
                    items-center
                    gap-3
                    p-3
                    sm:px-6
                    lg:grid-cols-[minmax(180px,auto)_minmax(0,1fr)_auto]
                    lg:gap-5
                    lg:px-8
                "
            >
                {/* Coluna 1: informações do evento */}
                <div className="min-w-0 justify-self-start">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Evento Atual
                    </p>
                        <span className="min-w-0 truncate group
                            flex
                            max-w-full
                            items-center
                            gap-1
                            text-base
                            font-bold
                            text-slate-900
                            transition
                            hover:text-blue-600
                            sm:text-lg">
                            {eventName}
                        </span>

                    <p className="mt-0.5 flex max-w-full items-center gap-1 truncate text-[10px] text-slate-500 sm:text-xs">
                        <MapPin className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                        <span className="truncate">
                            {eventPlace}
                        </span>
                    </p>
                </div>

                {/* Mini dashboard */}
                <div
                    className="
                        hidden
                        min-w-0
                        grid-cols-3
                        gap-2
                        min-[1200px]:col-start-2
                        min-[1200px]:grid
                        min-[1200px]:w-full
                        min-[1200px]:max-w-none
                        min-[1200px]:justify-self-stretch
                        lg:gap-3
                    "
                >
                    <Card className="flex min-w-0 items-center justify-between border-slate-200 px-3 py-2 shadow-none">
                        <div className="min-w-0">
                            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                Total
                            </p>

                            <p className="text-xl font-bold leading-tight text-slate-900">
                                {stats.total}
                            </p>
                        </div>

                        <div className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <Users className="h-4 w-4" />
                        </div>
                    </Card>

                    <Card className="flex min-w-0 items-center justify-between border-emerald-200 bg-emerald-50/40 px-3 py-2 shadow-none">
                        <div className="min-w-0">
                            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                Entregues
                            </p>

                            <p className="text-xl font-bold leading-tight text-emerald-700">
                                {stats.entregues}
                            </p>

                            <p className="truncate text-[10px] font-medium text-emerald-600">
                                {stats.pct}% do total
                            </p>
                        </div>

                        <div className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                            <PackageCheck className="h-4 w-4" />
                        </div>
                    </Card>

                    <Card className="flex min-w-0 items-center justify-between border-blue-200 bg-blue-50/40 px-3 py-2 shadow-none">
                        <div className="min-w-0">
                            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                                Pendentes
                            </p>

                            <p className="text-xl font-bold leading-tight text-blue-600">
                                {stats.pendentes}
                            </p>

                            <p className="truncate text-[10px] font-medium text-blue-600">
                                Aguardando na fila
                            </p>
                        </div>

                        <div className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                            <Clock3 className="h-4 w-4" />
                        </div>
                    </Card>
                </div>

                {/* Coluna 3: utilitários */}
                <div
                    className="
                        relative
                        justify-self-end
                        lg:col-start-3
                    "
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDropDownUtilities((prev) => !prev)}
                        className="
                            flex
                            items-center
                            gap-1
                            whitespace-nowrap
                            border-accent-200
                            bg-accent
                            px-2
                            text-xs
                            font-semibold
                            text-accent-foreground
                            hover:bg-accent/90
                            sm:px-3
                            sm:text-sm
                        "
                    >
                        <Settings2 className="h-3.5 w-3.5 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />

                        <span className="hidden sm:inline">
                            Utilitários
                        </span>
                    </Button>

                    {showDropDownUtilities && (
                        <div className="absolute right-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowDropDownUtilities(false);
                                    setShowResetModal(true);
                                }}
                                className="w-full justify-start rounded-lg text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                            >
                                <Trash2 className="mr-2 h-4 w-4 shrink-0" />
                                Zerar Entregas
                            </Button>
                            
                            <div className="mt-1 rounded-lg border border-indigo-100 bg-indigo-50/60 p-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDropDownUtilities(false);
                                        openSecondScreen();
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                                >
                                    <Monitor className="h-4 w-4 shrink-0" />
                                    Abrir Segunda Tela
                                </button>
                                <div className="mt-2 px-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">Transmissão</p>
                                    <div className="mt-1 grid grid-cols-2 rounded-lg bg-white p-0.5 text-xs font-semibold">
                                        {(["MANUAL", "AUTOMATICO"] as SecondScreenDisplayMode[]).map((mode) => (
                                            <button
                                                key={mode}
                                                type="button"
                                                aria-pressed={secondScreenMode === mode}
                                                onClick={() => setSecondScreenMode(mode)}
                                                className={`rounded-md px-2 py-1.5 transition ${secondScreenMode === mode ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                                            >
                                                {mode === "MANUAL" ? "Manual" : "Automático"}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-1.5 text-[10px] leading-tight text-slate-500">
                                        {secondScreenMode === "AUTOMATICO" ? "Exibe o atleta selecionado por 90 segundos." : "Use \"Espelhar\" para enviar o atleta à segunda tela."}
                                    </p>
                                </div>
                            </div>
                            
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowDropDownUtilities(false);
                                    setShowRaffleModal(true);
                                }}
                                className="mt-1 w-full justify-start rounded-lg text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                            >
                                <Trophy className="mr-2 h-4 w-4 shrink-0" />
                                Realizar Sorteio
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
