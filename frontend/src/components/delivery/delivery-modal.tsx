"use client";

import {
    Edit,
    Monitor,
    PackageCheck,
    RotateCcw,
    ShieldAlert,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Athlete } from "./types";

interface DeliveryModalProps {
    selectedAthlete: Athlete;
    closeDeliveryModal: () => void;
    isThirdParty: boolean;
    setIsThirdParty: React.Dispatch<React.SetStateAction<boolean>>;
    thirdPartyForm: { nome: string; cpf: string; fone: string; email: string };
    setThirdPartyForm: React.Dispatch<React.SetStateAction<{ nome: string; cpf: string; fone: string; email: string }>>;
    handleDeliverKit: (athleteId?: string) => void;
    handleReverseDelivery: (athleteId: string) => void;
    showAthleteOnSecondScreen: (athlete?: Athlete) => void;
    setShowEditAthleteModal: React.Dispatch<React.SetStateAction<boolean>>;
    setEditingAthlete: React.Dispatch<React.SetStateAction<Athlete | null>>;
}

export function DeliveryModal({
    selectedAthlete,
    closeDeliveryModal,
    isThirdParty,
    setIsThirdParty,
    thirdPartyForm,
    setThirdPartyForm,
    handleDeliverKit,
    handleReverseDelivery,
    showAthleteOnSecondScreen,
    setShowEditAthleteModal,
    setEditingAthlete,
}: DeliveryModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
                {/* Topo do Modal */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-xl shadow-md">
                            {selectedAthlete.num}
                        </div>
                        <div>
                            <h2 className="text-xl semi-bold text-slate-900">{selectedAthlete.nome}</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                CPF: <span className="semi-bold text-slate-900">{selectedAthlete.cpf}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={closeDeliveryModal}
                        className="text-slate-400 hover:text-slate-600 p-1"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Status Atual do Atleta */}
                {/* <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">STATUS:</span>
                    {selectedAthlete.status === "ENTREGUE" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5" /> KIT JÁ ENTREGUE
                        </span>
                    )}
                    {selectedAthlete.status === "ESTORNADO" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                            <RotateCcw className="h-3.5 w-3.5" /> ENTREGA ESTORNADA
                        </span>
                    )}
                    {selectedAthlete.status === "PENDENTE" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                            ● DISPONÍVEL
                        </span>
                    )}
                </div> */}

                {/* Ficha Resumida */}
                {/* <div className="flex flex-nowrap md:flex-wrap justify-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs"> */}
                <div className="grid grid-cols-2 gap-3 rounded-2xl justify-items-center border border-slate-200 bg-slate-50 p-4 text-xs md:grid-cols-3 lg:grid-cols-5">
                    <div className="w-25 text-center">
                        <span className="text-slate-400 block center">Modalidade:</span>
                        <span className="text-slate-800">{selectedAthlete.distancia}</span>
                    </div>
                    <div className="w-25 text-center">
                        <span className="text-slate-400 block center">Camiseta:</span>
                        <span className="text-slate-800">{selectedAthlete.camiseta}</span>
                    </div>
                    <div className="w-25 text-center">
                        <span className="text-slate-400 block center">Equipe:</span>
                        <span className="text-slate-800">{selectedAthlete.equipe}</span>
                    </div>
                    <div className="w-25 text-center">
                        <span className="text-slate-400 block center">Tipo do Kit:</span>
                        <span className="text-slate-800">{selectedAthlete.kit}</span>
                    </div>
                    <div className="w-25 text-center">
                        <span className="text-slate-400 block center">Faixa etária:</span>
                        <span className="text-slate-800">{selectedAthlete.faixaEtaria}</span>
                    </div>
                </div>

                {selectedAthlete.alerta && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
                        <span>{selectedAthlete.alerta}</span>
                    </div>
                )}

                {/* Formulário de Quem está retirando (se pendente ou alteração) */}
                {selectedAthlete.status === "PENDENTE" && (
                    <div className="space-y-4 pt-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Identificação do Recebedor</p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsThirdParty(false)}
                                className={`flex-1 rounded-xl border p-3 text-left transition ${
                                    !isThirdParty ? "border-blue-2000 bg-blue-50/80 ring-2 ring-blue-5000/20" : "border-slate-200 bg-white"
                                }`}
                            >
                                <span className="text-sm font-semibold text-slate-900 block">O próprio atleta</span>
                                {/* <span className="text-xs text-slate-500">Retirada pessoalmente</span> */}
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsThirdParty(true)}
                                className={`flex-1 rounded-xl border p-3 text-left transition ${
                                    isThirdParty ? "border-blue-2000 bg-blue-50/80 ring-2 ring-blue-5000/20" : "border-slate-200 bg-white"
                                }`}
                            >
                                <span className="text-sm font-semibold text-slate-900 block">Terceiro / Responsável</span>
                                {/* <span className="text-xs text-slate-500">Retirada por representante</span> */}
                            </button>
                        </div>

                        {isThirdParty && (
                            <div className="grid gap-3 sm:grid-cols-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Nome de quem está retirando</label>
                                    <input
                                        value={thirdPartyForm.nome}
                                        onChange={(e) => setThirdPartyForm((p) => ({ ...p, nome: e.target.value }))}
                                        placeholder="Nome completo do terceiro"
                                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">CPF do Responsável</label>
                                    <input
                                        value={thirdPartyForm.cpf}
                                        onChange={(e) => setThirdPartyForm((p) => ({ ...p, cpf: e.target.value }))}
                                        placeholder="000.000.000-00"
                                        className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs bg-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Botões de Ação Principais no Modal */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                    {selectedAthlete.status === "PENDENTE" && (
                        <Button
                            onClick={(event) => {
                                event.preventDefault();
                                handleDeliverKit();
                            }}
                            size="lg"
                            className="h-14 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm"
                        >
                            <PackageCheck className="h-5 w-5 mr-2" /> CONFIRMAR ENTREGA DO KIT
                        </Button>
                    )}

                    {selectedAthlete.status === "ENTREGUE" && (
                        <Button
                            onClick={() => handleReverseDelivery(selectedAthlete.id)}
                            size="lg"
                            className="h-12 w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-sm"
                        >
                            <RotateCcw className="h-5 w-5 mr-2" /> ESTORNAR ENTREGA DO KIT
                        </Button>
                    )}

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => showAthleteOnSecondScreen()}
                            className="flex-1 rounded-xl text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold"
                        >
                            <Monitor className="h-4 w-4 mr-1.5" />Espelhar
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                closeDeliveryModal();
                                setEditingAthlete(selectedAthlete);
                                setShowEditAthleteModal(true);
                            }}
                            className="flex-1 rounded-xl text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-semibold"
                        >
                            <Edit className="h-4 w-4 mr-1.5" /> Editar Cadastro
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
