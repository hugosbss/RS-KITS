"use client";

import {
    Sparkles,
    Trophy,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Athlete } from "./types";

interface DeliveryRaffleModalProps {
    showRaffleModal: boolean;
    setShowRaffleModal: React.Dispatch<React.SetStateAction<boolean>>;
    raffleFilterCategory: string;
    setRaffleFilterCategory: React.Dispatch<React.SetStateAction<string>>;
    raffleFilterAge: string;
    setRaffleFilterAge: React.Dispatch<React.SetStateAction<string>>;
    raffleFilterCity: string;
    setRaffleFilterCity: React.Dispatch<React.SetStateAction<string>>;
    raffleWinner: Athlete | null;
    isRaffling: boolean;
    handleRunRaffle: () => void;
}

export function DeliveryRaffleModal({
    showRaffleModal,
    setShowRaffleModal,
    raffleFilterCategory,
    setRaffleFilterCategory,
    raffleFilterAge,
    setRaffleFilterAge,
    raffleFilterCity,
    setRaffleFilterCity,
    raffleWinner,
    isRaffling,
    handleRunRaffle,
}: DeliveryRaffleModalProps) {
    if (!showRaffleModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-amber-600">
                        <Trophy className="h-6 w-6" />
                        <h3 className="text-lg font-bold text-slate-900">Realizar Sorteio do Evento</h3>
                    </div>
                    <button onClick={() => setShowRaffleModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 text-xs">
                    {/* <p className="text-slate-500">Defina os filtros desejados para o sorteio ou escolha "TODOS" para sorteio geral.</p> */}

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="font-semibold text-slate-700 block mb-1">Modalidade/Cat.</label>
                            <select
                                value={raffleFilterCategory}
                                onChange={(e) => setRaffleFilterCategory(e.target.value)}
                                className="w-full h-9 rounded-lg border border-slate-300 px-2 bg-white text-xs"
                            >
                                <option value="TODOS">Todas</option>
                                <option value="5 KM">5 KM</option>
                                <option value="10 KM">10 KM</option>
                                <option value="21 KM">21 KM</option>
                                <option value="42 KM">42 KM</option>
                            </select>
                        </div>

                        <div>
                            <label className="font-semibold text-slate-700 block mb-1">Faixa Etária</label>
                            <select
                                value={raffleFilterAge}
                                onChange={(e) => setRaffleFilterAge(e.target.value)}
                                className="w-full h-9 rounded-lg border border-slate-300 px-2 bg-white text-xs"
                            >
                                <option value="TODOS">Todas</option>
                                <option value="25–29">25–29</option>
                                <option value="30–34">30–34</option>
                                <option value="35–39">35–39</option>
                                <option value="40–44">40–44</option>
                                <option value="50–54">50–54</option>
                            </select>
                        </div>

                        <div>
                            <label className="font-semibold text-slate-700 block mb-1">Cidade</label>
                            <select
                                value={raffleFilterCity}
                                onChange={(e) => setRaffleFilterCity(e.target.value)}
                                className="w-full h-9 rounded-lg border border-slate-300 px-2 bg-white text-xs"
                            >
                                <option value="TODOS">Todas</option>
                                <option value="Bauru/SP">Bauru/SP</option>
                                <option value="São Paulo/SP">São Paulo/SP</option>
                                <option value="Campinas/SP">Campinas/SP</option>
                                <option value="Sorocaba/SP">Sorocaba/SP</option>
                            </select>
                        </div>
                    </div>
                </div>

                {raffleWinner && (
                    <div className="rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-5 text-center text-white shadow-lg space-y-2 animate-bounce">
                        <Sparkles className="h-8 w-8 mx-auto text-white" />
                        <p className="text-xs uppercase tracking-wider font-bold text-amber-100">Ganhador do Sorteio!</p>
                        <h4 className="text-2xl font-black text-slate-900">{raffleWinner.nome}</h4>
                        <p className="text-sm font-semibold text-slate-800">
                            Nº {raffleWinner.num} · Equipe: {raffleWinner.equipe} ({raffleWinner.cidadeUf})
                        </p>
                    </div>
                )}

                <div className="flex gap-3 pt-2 border-t border-slate-100">
                    <Button
                        onClick={handleRunRaffle}
                        disabled={isRaffling}
                        className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md"
                    >
                        <Sparkles className="h-5 w-5 mr-2" /> {isRaffling ? "SORTEANDO..." : "SORTEAR AGORA"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
