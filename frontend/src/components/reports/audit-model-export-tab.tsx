"use client";

import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AthleteReportRecord } from "./types";

interface AuditModelExportTabProps {
    athletes: AthleteReportRecord[];
    onExportModel: () => void;
}

export function AuditModelExportTab({ athletes, onExportModel }: AuditModelExportTabProps) {
    return (
        <Card className="border-slate-200 p-5 shadow-none space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-medium text-slate-900">Modelo Exportação (Apenas Atletas Alterados)</h3>
                </div>
                <Button
                    size="sm"
                    onClick={onExportModel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium"
                >
                    <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Baixar Modelo Exportação
                </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
                    <thead className="bg-slate-100 font-medium uppercase text-slate-600 border-b border-slate-200">
                        <tr>
                            <th className="p-3">Num</th>
                            <th className="p-3">Nome atleta</th>
                            <th className="p-3">Modalidade</th>
                            <th className="p-3">Nascto.</th>
                            <th className="p-3">Sexo</th>
                            <th className="p-3">Equipe</th>
                            <th className="p-3">Cidade / UF</th>
                            <th className="p-3">Camiseta</th>
                            <th className="p-3">CPF Atleta</th>
                            <th className="p-3">Cel</th>
                            <th className="p-3">Notas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {athletes.filter((a) => a.foiAlterado).map((athlete) => (
                            <tr key={athlete.num} className="hover:bg-slate-50">
                                <td className="p-3 font-medium">{athlete.num}</td>
                                <td className="p-3 font-medium text-slate-900">{athlete.nomeAtleta}</td>
                                <td className="p-3">{athlete.distancia}</td>
                                <td className="p-3">{athlete.nascimento}</td>
                                <td className="p-3">{athlete.sexo}</td>
                                <td className="p-3">{athlete.equipe}</td>
                                <td className="p-3">{athlete.cidadeUf}</td>
                                <td className="p-3 font-medium text-blue-600">{athlete.camiseta}</td>
                                <td className="p-3">{athlete.cpfAtleta}</td>
                                <td className="p-3">{athlete.cel}</td>
                                <td className="p-3 text-slate-500">{athlete.notas}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
