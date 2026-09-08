"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AthleteReportRecord } from "./types";

interface AuditFullTabProps {
    athletes: AthleteReportRecord[];
    onExportFull: () => void;
}

export function AuditFullTab({ athletes, onExportFull }: AuditFullTabProps) {
    return (
        <Card className="border-slate-200 p-5 shadow-none space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-medium text-slate-900">Relatório Dados Full (Exportação Completa)</h3>
                </div>
                <Button
                    size="sm"
                    onClick={onExportFull}
                    className="bg-blue-600 hover:bg-blue-600 text-white rounded-xl text-xs font-medium"
                >
                    <Download className="h-4 w-4 mr-1.5" /> Baixar Planilha Completa (Full Excel)
                </Button>
            </div>

            <div className="max-h-[500px] overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
                    <thead className="sticky top-0 bg-slate-100 font-medium uppercase text-slate-600 border-b border-slate-200">
                        <tr>
                            <th className="p-3">NUM</th>
                            <th className="p-3">Nome Atleta</th>
                            <th className="p-3">KIT</th>
                            <th className="p-3">Distância</th>
                            <th className="p-3">Faixa Etaria</th>
                            <th className="p-3">Categoria Especial</th>
                            <th className="p-3">Nascimento</th>
                            <th className="p-3">Sexo</th>
                            <th className="p-3">Equipe</th>
                            <th className="p-3">Cidade/UF</th>
                            <th className="p-3">Camiseta</th>
                            <th className="p-3">CPF Atleta</th>
                            <th className="p-3">Cel</th>
                            <th className="p-3">E-mail</th>
                            <th className="p-3">Retirar KIT</th>
                            <th className="p-3">Notas</th>
                            <th className="p-3">Obs1</th>
                            <th className="p-3">Obs2</th>
                            <th className="p-3">Alerta</th>
                            <th className="p-3">Nome Evento</th>
                            <th className="p-3">status_entrega</th>
                            <th className="p-3">data_entrega</th>
                            <th className="p-3">usuario_entrega</th>
                            <th className="p-3">obs_entrega</th>
                            <th className="p-3">data_estorno</th>
                            <th className="p-3">usuario_estorno</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {athletes.map((athlete) => (
                            <tr key={athlete.num} className="hover:bg-slate-50">
                                <td className="p-3 font-medium">{athlete.num}</td>
                                <td className="p-3 font-medium">{athlete.nomeAtleta}</td>
                                <td className="p-3">{athlete.kit}</td>
                                <td className="p-3">{athlete.distancia}</td>
                                <td className="p-3">{athlete.faixaEtaria}</td>
                                <td className="p-3">{athlete.categoriaEspecial}</td>
                                <td className="p-3">{athlete.nascimento}</td>
                                <td className="p-3">{athlete.sexo}</td>
                                <td className="p-3">{athlete.equipe}</td>
                                <td className="p-3">{athlete.cidadeUf}</td>
                                <td className="p-3 font-medium text-blue-600">{athlete.camiseta}</td>
                                <td className="p-3">{athlete.cpfAtleta}</td>
                                <td className="p-3">{athlete.cel}</td>
                                <td className="p-3">{athlete.email}</td>
                                <td className="p-3">{athlete.retirarKit}</td>
                                <td className="p-3">{athlete.notas}</td>
                                <td className="p-3">{athlete.obs1}</td>
                                <td className="p-3">{athlete.obs2}</td>
                                <td className="p-3">{athlete.alerta}</td>
                                <td className="p-3">{athlete.nomeEvento}</td>
                                <td className="p-3 font-medium">{athlete.statusEntrega}</td>
                                <td className="p-3 font-mono">{athlete.dataEntrega || "-"}</td>
                                <td className="p-3">{athlete.usuarioEntrega || "-"}</td>
                                <td className="p-3">{athlete.obsEntrega || "-"}</td>
                                <td className="p-3 font-mono">{athlete.dataEstorno || "-"}</td>
                                <td className="p-3">{athlete.usuarioEstorno || "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
