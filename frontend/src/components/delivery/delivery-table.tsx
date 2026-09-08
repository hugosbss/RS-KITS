"use client";

import {
    Check,
    Eye,
    Monitor,
    Pencil,
    QrCode,
    RotateCcw,
    Search,
    ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Athlete, DeliveryStatus, AthleteStatusFilter } from "./types";

interface DeliveryTableProps {
    query: string;
    setQuery: React.Dispatch<React.SetStateAction<string>>;
    filteredAthletes: Athlete[];
    athletes: Athlete[];
    statusFilter: AthleteStatusFilter;
    setStatusFilter: React.Dispatch<React.SetStateAction<AthleteStatusFilter>>;
    toggleStatusFilter: (status: DeliveryStatus) => void;
    selectAthleteForDelivery: (athlete: Athlete) => void;
    handleViewAthlete: (athlete: Athlete) => void;
    handleEditAthlete: (athleteId: string) => void;
    handleDeliverKit: (athleteId?: string) => void;
    handleReverseDelivery: (athleteId: string) => void;
    showAthleteOnSecondScreen: (athlete?: Athlete) => void;
    setShowPinModal: React.Dispatch<React.SetStateAction<boolean>>;
    setPin: React.Dispatch<React.SetStateAction<string>>;
    setPinError: React.Dispatch<React.SetStateAction<string>>;
    stats: { total: number; entregues: number; pendentes: number; pct: number };
}

export function DeliveryTable({
    query,
    setQuery,
    filteredAthletes,
    athletes,
    statusFilter,
    setStatusFilter,
    toggleStatusFilter,
    selectAthleteForDelivery,
    handleViewAthlete,
    handleEditAthlete,
    handleDeliverKit,
    handleReverseDelivery,
    showAthleteOnSecondScreen,
    setShowPinModal,
    setPin,
    setPinError,
    stats,
}: DeliveryTableProps) {
    return (
        <Card className="border-slate-200 p-5 shadow-none space-y-4">
            {/* Barra de Pesquisa Integrada à Tabela */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && filteredAthletes[0]) {
                                selectAthleteForDelivery(filteredAthletes[0]);
                            }
                        }}
                        placeholder="Buscar atleta por Nome, Número, CPF ou Cidade..."
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-sm outline-none ring-blue-5000 focus:ring-2"
                        autoFocus
                    />
                </div>

                <div className="flex w-full items-center gap-2 sm:w-auto">
                    <Button
                        onClick={() => {
                            if (filteredAthletes[0]) {
                                selectAthleteForDelivery(filteredAthletes[0]);
                            }
                        }}
                        className="h-12 flex-1 rounded-xl px-4 sm:flex-none sm:px-6"
                    >
                        <Search className="mr-1.5 h-4 w-4 shrink-0" />
                        Buscar
                    </Button>
                    
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (athletes[0]) {
                                selectAthleteForDelivery(athletes[0]);
                            }
                        }}
                        className="h-12 rounded-xl border-blue-200 px-3 text-blue-600 hover:bg-blue-50 sm:px-4"
                    >
                        <QrCode className="mr-1.5 h-5 w-5 shrink-0" />
                        <span className="hidden sm:inline">QR Code</span>
                    </Button>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setPin("");
                            setPinError("");
                            setShowPinModal(true);
                        }}
                        className="h-12 shrink-0 rounded-xl border-amber-200 bg-amber-50 px-3 text-amber-900 hover:bg-amber-100 sm:px-4">
                        <span className="sm:hidden">PIN</span>
                        <span className="hidden sm:inline">CÓDIGO PIN</span>
                    </Button>
                </div>
            </div>

            {/* Cabeçalho da Tabela e Legendas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div>
                    <h3 className="text-base font-bold text-slate-900">Lista de Atletas do Evento</h3>
                    {/* <p className="text-xs text-slate-500">
                        Exibindo {athletes.length} atletas.
                    </p> */}
                    {/* <Button variant="outline" size="sm" disabled={!selectedAthlete} onClick={showAthleteOnSecondScreen} className="mt-3 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40">
                        <Monitor className="mr-1.5 h-4 w-4" /> Exibir na Segunda Tela
                    </Button> */}

                    {/* <Button variant="outline" size="sm" onClick={() => { setPin(""); setPinError(""); setShowPinModal(true); }} className="mt-3 ml-2 border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100">
                        <p>CÓDIGO PIN</p>
                    </Button> */}
                </div>

                {/* Filtros de status */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                    {(["ENTREGUE", "PENDENTE"] as DeliveryStatus[]).map((status) => <button key={status} type="button" aria-pressed={statusFilter === status} onClick={() => toggleStatusFilter(status)} className={"inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 " + (statusFilter === status ? "bg-slate-700 text-white border-slate-700" : "bg-slate-100 text-slate-700 border-slate-200")}><span className={"h-2 w-2 rounded-full " + (status === "ENTREGUE" ? "bg-emerald-500" : status === "ESTORNADO" ? "bg-amber-500" : "bg-slate-400")} /> {status === "ENTREGUE" ? "Entregues" : status === "ESTORNADO" ? "Estornados" : "Pendentes"} ({status === "ENTREGUE" ? stats.entregues : stats.pendentes})</button>)}
                    {statusFilter !== "TODOS" && <button type="button" onClick={() => setStatusFilter("TODOS")} className="px-2 py-1 text-slate-500 underline">Limpar filtro</button>}
                </div>
            </div>

            {/* Tabela de Atletas */}
            <div className="rounded-xl border border-slate-200">
                <div className="max-h-[550px] overflow-x-auto overflow-y-auto rounded-xl scrollbar-hide">
                <table className="w-full table-fixed min-w-[900px] md:min-w-0 text-left text-xs text-slate-700">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                        <tr>
                            <th className="w-[5%] px-2 py-2.5">NUM</th>
                            <th className="w-[12%] px-2 py-2.5">Nome Atleta</th>
                            <th className="w-[4%] px-2 py-2.5 hidden xl:table-cell">Sexo</th>
                            <th className="w-[8%] px-2 py-2.5 hidden xl:table-cell">Nascimento</th>
                            <th className="w-[8%] px-2 py-2.5">Cidade/UF</th>
                            <th className="w-[10%] px-2 py-2.5">Equipe</th>
                            <th className="w-[9%] px-2 py-2.5">Modalidade</th>
                            <th className="w-[11%] px-2 py-2.5 text-center">KIT</th>
                            <th className="w-[6%] px-2 py-2.5 hidden xl:table-cell">Camiseta</th>
                            <th className="w-[5%] px-2 py-2.5 text-center">STATUS</th>
                            <th className="w-[18%] px-2 py-2.5 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAthletes.map((athlete) => {
                            let rowBgClass = "hover:bg-slate-50 transition cursor-pointer";
                            let statusBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";

                            if (athlete.status === "ENTREGUE") {
                                rowBgClass = "bg-emerald-50/60 hover:bg-emerald-100/50 text-emerald-950 transition cursor-pointer";
                                statusBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
                            } else if (athlete.status === "ESTORNADO") {
                                rowBgClass = "bg-amber-50/70 hover:bg-amber-100/60 text-amber-950 transition cursor-pointer";
                                statusBadgeClass = "bg-amber-100 text-amber-900 border-amber-300 font-bold";
                            }

                            return (
                                <tr key={athlete.id} onClick={() => selectAthleteForDelivery(athlete)} className={rowBgClass}>
                                    <td className="px-2 py-2.5 text-slate-900 truncate" title={athlete.num}>{athlete.num}</td>
                                    <td className="px-2 py-2.5 text-slate-900 truncate" title={athlete.nome}>{athlete.nome}</td>
                                    <td className="px-2 py-2.5 truncate hidden xl:table-cell" title={athlete.sexo}>{athlete.sexo}</td>
                                    <td className="px-2 py-2.5 truncate hidden xl:table-cell" title={athlete.nascimento}>{athlete.nascimento}</td>
                                    <td className="px-2 py-2.5 truncate" title={athlete.cidadeUf}>{athlete.cidadeUf}</td>
                                    <td className="px-2 py-2.5 font-medium text-slate-800 truncate" title={athlete.equipe}>{athlete.equipe}</td>
                                    <td className="px-2 py-2.5 font-semibold truncate" title={athlete.distancia}>{athlete.distancia}</td>
                                    <td className="px-2 py-2.5 truncate" title={athlete.kit}>{athlete.kit}</td>
                                    <td className="px-2 py-2.5 text-slate-900 truncate hidden xl:table-cell" title={athlete.camiseta}>{athlete.camiseta}</td>
                                    {/* <td className="p-3">
                                        {athlete.alerta ? (
                                            <span className="text-amber-700 inline-flex items-center justify-center p-1.5 gap-1">
                                                <ShieldAlert className="h-3.5 w-3.5" />
                                            </span>
                                        ) : (
                                            <span className="text-slate-400"></span>
                                        )}
                                    </td> */}

                                    <td className="px-2 py-2.5 text-center whitespace-nowrap">
                                        <span className={`inline-flex items-center justify-center rounded-full p-1.5 border ${statusBadgeClass}`}>
                                            {athlete.status === "ENTREGUE" && <Check className="h-3.5 w-3.5" />}
                                            {athlete.status === "ESTORNADO" && <RotateCcw className="h-3.5 w-3.5" />}
                                            {/* {athlete.status === "PENDENTE" && <Clock3 className="h-3.5 w-3.5" />} */}
                                        </span>
                                    </td>

                                    <td className="px-2 py-2.5 whitespace-nowrap">
                                      <div className="flex items-center justify-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 px-1 py-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            handleViewAthlete(athlete);
                                          }}
                                          className="h-6 w-6 shrink-0 p-0 text-slate-600 hover:bg-slate-100"
                                          title="Ver detalhes"
                                        >
                                          <Eye className="h-3 w-3" />
                                        </Button>
                                                                                    
                                        {/* Editar */}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            handleEditAthlete(athlete.id);
                                          }}
                                          className="h-6 w-6 shrink-0 p-0 text-slate-600 hover:bg-slate-100"
                                          title="Editar atleta"
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                                                                    
                                        {/* Entregar kit */}
                                        {athlete.status !== "ENTREGUE" && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              handleDeliverKit(athlete.id);
                                            }}
                                            className="h-6 w-6 shrink-0 p-0 text-green-700 hover:bg-green-100"
                                            title="Entregar Kit"
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                        )}
                                    
                                        {/* Estornar */}
                                        {athlete.status === "ENTREGUE" && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              handleReverseDelivery(athlete.id);
                                            }}
                                            className="h-6 w-6 shrink-0 p-0 text-amber-700 hover:bg-amber-100"
                                            title="Estornar Kit"
                                          >
                                            <RotateCcw className="h-3 w-3" />
                                          </Button>
                                        )}

                                        {/* Exibir na 2º tela */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                showAthleteOnSecondScreen(athlete);
                                            }}
                                            className="h-6 w-6 shrink-0 p-0 text-indigo-700 hover:bg-indigo-100"
                                            title="Espelhar"
                                          >
                                            <Monitor className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>
            </div>
        </Card>
    );
}
