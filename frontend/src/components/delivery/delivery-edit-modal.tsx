"use client";

import {
    Edit,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Athlete } from "./types";

interface DeliveryEditModalProps {
    editingAthlete: Athlete;
    setEditingAthlete: React.Dispatch<React.SetStateAction<Athlete | null>>;
    showEditAthleteModal: boolean;
    setShowEditAthleteModal: React.Dispatch<React.SetStateAction<boolean>>;
    handleSaveAthleteEdit: (e: React.FormEvent) => void;
}

export function DeliveryEditModal({
    editingAthlete,
    setEditingAthlete,
    showEditAthleteModal,
    setShowEditAthleteModal,
    handleSaveAthleteEdit,
}: DeliveryEditModalProps) {
    if (!showEditAthleteModal || !editingAthlete) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <form
                onSubmit={handleSaveAthleteEdit}
                className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Edit className="h-5 w-5" />
                        <h3 className="text-lg font-bold text-slate-900">Editar Cadastro do Atleta</h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowEditAthleteModal(false)}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                    <div>
                        <label className="font-semibold text-slate-700 block mb-1">Nome Completo</label>
                        <input
                            value={editingAthlete.nome}
                            onChange={(e) => setEditingAthlete({ ...editingAthlete, nome: e.target.value })}
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs"
                            required
                        />
                    </div>

                    <div>
                        <label className="font-semibold text-slate-700 block mb-1">CPF</label>
                        <input
                            value={editingAthlete.cpf}
                            onChange={(e) => setEditingAthlete({ ...editingAthlete, cpf: e.target.value })}
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs"
                            required
                        />
                    </div>

                    <div>
                        <label className="font-semibold text-slate-700 block mb-1">Modalidade</label>
                        <input
                            value={editingAthlete.distancia}
                            onChange={(e) => setEditingAthlete({ ...editingAthlete, distancia: e.target.value })}
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs"
                        />
                    </div>

                    <div>
                        <label className="font-semibold text-slate-700 block mb-1">Faixa Etária</label>
                        <input
                            value={editingAthlete.faixaEtaria}
                            onChange={(e) => setEditingAthlete({ ...editingAthlete, faixaEtaria: e.target.value })}
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs"
                        />
                    </div>

                    <div>
                        <label className="font-semibold text-slate-700 block mb-1">Equipe</label>
                        <input
                            value={editingAthlete.equipe}
                            onChange={(e) => setEditingAthlete({ ...editingAthlete, equipe: e.target.value })}
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs"
                        />
                    </div>

                    {/* <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <label className="font-semibold text-slate-700 block">Equipe</label>
                        <div className="flex gap-2">
                            <select
                                value={existingTeams.includes(editingAthlete.equipe) ? editingAthlete.equipe : "NOVA"}
                                onChange={(e) => {
                                    if (e.target.value !== "NOVA") {
                                        setEditingAthlete({ ...editingAthlete, equipe: e.target.value });
                                    }
                                }}
                                className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-xs bg-white"
                            >
                                <option value="NOVA">-- Criar Nova Equipe / Manter Customizada --</option>
                                {existingTeams.map((team) => (
                                    <option key={team} value={team}>
                                        {team}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <input
                            value={editingAthlete.equipe}
                            onChange={(e) => setEditingAthlete({ ...editingAthlete, equipe: e.target.value })}
                            placeholder="Digite o nome da equipe..."
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs bg-white"
                        />
                    </div> */}

                    <div>
                        <label className="font-semibold text-slate-700 block mb-1">Camiseta</label>
                        <select
                            value={editingAthlete.camiseta}
                            onChange={(e) => setEditingAthlete({ ...editingAthlete, camiseta: e.target.value })}
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs bg-white"
                        >
                            <option value="P">P</option>
                            <option value="M">M</option>
                            <option value="G">G</option>
                            <option value="GG">GG</option>
                            <option value="XGG">XGG</option>
                            <option value="Baby Look P">Baby Look P</option>
                            <option value="Baby Look M">Baby Look M</option>
                            <option value="Baby Look G">Baby Look G</option>
                        </select>
                    </div>

                    <div>
                        <label className="font-semibold text-slate-700 block mb-1">Cidade/UF</label>
                        <input
                            value={editingAthlete.cidadeUf}
                            onChange={(e) => setEditingAthlete({ ...editingAthlete, cidadeUf: e.target.value })}
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100 justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowEditAthleteModal(false)}
                        className="h-10 rounded-xl"
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" className="h-10 rounded-xl bg-blue-600 hover:bg-blue-600 text-white font-bold">
                        Salvar Alterações
                    </Button>
                </div>
            </form>
        </div>
    );
}
