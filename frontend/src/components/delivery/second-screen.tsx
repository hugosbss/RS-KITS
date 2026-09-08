"use client";

import { useEffect, useState } from "react";
import { Heart, HeartPlus } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { Athlete } from "@/components/delivery/delivery";
import { useAppState } from "@/components/providers/app-context";

export type SecondScreenDisplayMode = "MANUAL" | "AUTOMATICO";

type SecondScreenPayload = {
    athlete: Athlete | null;
    mode: SecondScreenDisplayMode;
    expiresAt: number | null;
};

const SECOND_SCREEN_CHANNEL = "rs-kits-second-screen";
const SECOND_SCREEN_STORAGE_KEY = "rs-kits:second-screen";
const AUTOMATIC_DISPLAY_DURATION_MS = 90_000;

const readSecondScreenPayload = (): SecondScreenPayload | null => {
    try {
        const value = window.localStorage.getItem(SECOND_SCREEN_STORAGE_KEY);
        return value ? (JSON.parse(value) as SecondScreenPayload) : null;
    } catch {
        return null;
    }
};

export const publishSecondScreenAthlete = (
    athlete: Athlete,
    mode: SecondScreenDisplayMode,
) => {
    if (typeof window === "undefined") return;

    const payload: SecondScreenPayload = {
        athlete,
        mode,
        expiresAt: mode === "AUTOMATICO" ? Date.now() + AUTOMATIC_DISPLAY_DURATION_MS : null,
    };

    try {
        window.localStorage.setItem(SECOND_SCREEN_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // A transmissão em tempo real ainda funciona quando o armazenamento não está disponível.
    }

    if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel(SECOND_SCREEN_CHANNEL);
        channel.postMessage(payload);
        channel.close();
    }
};

export const clearSecondScreenAthlete = () => {
    if (typeof window === "undefined") return;

    const payload: SecondScreenPayload = {
        athlete: null,
        mode: "MANUAL",
        expiresAt: null,
    };

    try {
        window.localStorage.setItem(SECOND_SCREEN_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // A mensagem abaixo ainda limpa a tela que já estiver aberta.
    }

    if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel(SECOND_SCREEN_CHANNEL);
        channel.postMessage(payload);
        channel.close();
    }
};

// const formatRemainingTime = (expiresAt: number) => {
//     const remainingSeconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
//     return `${remainingSeconds}s restantes`;
// };

export function SecondScreen() {
    const { selectedEvent } = useAppState();
    const [payload, setPayload] = useState<SecondScreenPayload | null>(null);
    const [, setNow] = useState(Date.now());

    useEffect(() => {
        const applyPayload = (nextPayload: SecondScreenPayload | null) => {
            if (nextPayload?.expiresAt && nextPayload.expiresAt <= Date.now()) {
                setPayload(null);
                return;
            }
            setPayload(nextPayload);
        };

        applyPayload(readSecondScreenPayload());

        const channel = "BroadcastChannel" in window
            ? new BroadcastChannel(SECOND_SCREEN_CHANNEL)
            : null;
        channel?.addEventListener("message", (event: MessageEvent<SecondScreenPayload | null>) => {
            applyPayload(event.data);
        });

        const onStorage = (event: StorageEvent) => {
            if (event.key === SECOND_SCREEN_STORAGE_KEY) {
                applyPayload(readSecondScreenPayload());
            }
        };
        window.addEventListener("storage", onStorage);

        return () => {
            channel?.close();
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    useEffect(() => {
        if (!payload?.expiresAt) return;

        const interval = window.setInterval(() => setNow(Date.now()), 1_000);
        const timeout = window.setTimeout(() => setPayload(null), Math.max(0, payload.expiresAt - Date.now()));

        return () => {
            window.clearInterval(interval);
            window.clearTimeout(timeout);
        };
    }, [payload?.expiresAt]);

    const athlete = payload?.athlete;

    return (
        <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-8">
            <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
                {/* <header className="flex items-center justify-between border-b border-slate-800 pb-5">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">· RS Kits ·</p>
                        <h1 className="mt-1 text-2xl font-black sm:text-3xl">Informações do atleta</h1>
                    </div>
                    <Monitor className="h-7 w-7 text-blue-400" aria-hidden="true" />
                </header> */}

                {!athlete ? (
                    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">

                    {/* Identidade */}
                    <div>
                        <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">
                            RS - KITS
                        </p>
                    </div>

                    {/* Animação central */}
                    <div className="relative mt-10">
                        <DotLottieReact
                            src="/animations/loading.lottie"
                            loop
                            autoplay
                            style={{ width: 120, height: 120 }}
                        />
                    </div>

                    {/* Mensagem */}
                    {/* <h2 className="mt-7 text-2xl font-bold text-slate-100">
                        Aguardando atleta
                    </h2> */}

                    {/* <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                        O próximo atleta será exibido aqui após a seleção
                        no painel de atendimento.
                    </p> */}

                    {/* Evento */}
                    <div className="mt-10 w-full max-w-sm border-t border-slate-800 pt-6">
                        {/* <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                            Evento atual
                        </p> */}

                        <p className="mt-2 text-lg font-bold text-slate-200">
                            {selectedEvent?.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            {selectedEvent?.place}
                        </p>
                    </div>

                </div>
                ) : (
                    <div className="flex flex-1 flex-col">
                        <div className="mt-6 grid gap-5 lg:grid-cols-[240px_1fr]">
                            <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/15 p-6 text-center">
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-300">Número do atleta</p>
                                <p className="mt-2 text-7xl font-black text-blue-300">{athlete.num}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 sm:p-8">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Nome completo</p>
                                <h2 className="mt-2 text-3xl font-black sm:text-5xl">{athlete.nome}</h2>
                                <p className="mt-6 text-3xl font-semibold text-slate-200">Nascimento: {athlete.nascimento}</p>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-5 sm:grid-cols-2 lg:grid-cols-3">
                            <Detail label="Modalidade" value={athlete.distancia} />
                            <Detail label="Equipe" value={athlete.equipe} />
                            <Detail
                                label="Categoria / Faixa etária"
                                value={`${athlete.categoriaEspecial === "Não"
                                    ? "Geral"
                                    : athlete.categoriaEspecial} · ${athlete.faixaEtaria || "-"}`}
                            />
                            {/* <Detail label="Faixa etária" value={athlete.faixaEtaria} /> */}
                            <Detail label="Kit" value={athlete.kit} />
                            <Detail label="Camiseta" value={athlete.camiseta} highlighted />
                        </div>

                        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                            {/* Cabeçalho da seção de saúde */}
                            <div className="mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                                    <HeartPlus className="h-5 w-5" />
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-white sm:text-base">
                                        Saúde e emergência
                                    </h3>
                                </div>
                            </div>

                            {/* saúde */}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Detail label="Convênio médico" value={athlete.convenioMedico || "-"}/>
                                <Detail label="Tipo sanguíneo" value={athlete.tipoSanguineo || "-"}/>
                                <Detail label="Contato de emergência" value={athlete.contatoEmergencia || "-"}/>
                                <Detail label="Relação com o atleta" value={athlete.relacaoAtleta || "-"}/>
                                <Detail label="Telefone de emergência" value={athlete.telefoneEmergencia || "-"}/>
                            </div>
                        </div>

                        <footer className="mt-auto flex flex-col items-center justify-between gap-3 pt-6 text-sm text-slate-400 sm:flex-row">
                            {/* <span className="inline-flex items-center gap-2"><Heart className="h-4 w-4 text-rose-400" /> Confira seus dados com o operador.</span> */}
                            {/* {payload?.expiresAt && <span>{formatRemainingTime(payload.expiresAt)}</span>} */}
                        </footer>
                    </div>
                )}
            </section>
        </main>
    );
}

function Detail({ label, value, highlighted = false }: { label: string; value: string; highlighted?: boolean }) {
    return (
        <div>
            <p className="text-xs text-slate-400">{label}</p>
            <p className={`mt-1 font-bold ${highlighted ? "text-2xl text-whte-400" : "text-white text-2xl"}`}>{value}</p>
        </div>
    );
}
