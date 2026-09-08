"use client";

import { FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AuditLogItem } from "./types";

interface AuditStaticTabProps {
    logs: AuditLogItem[];
    onExportAgrupado: () => void;
}

export function AuditStaticTab({ logs, onExportAgrupado }: AuditStaticTabProps) {
    return (
        <Card className="border-slate-200 p-5 shadow-none space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-medium text-slate-900">Histórico Estático de Alterações Recentes</h3>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={onExportAgrupado}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Exportar para Excel/CSV
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.print()}
                        className="rounded-xl text-xs font-medium"
                    >
                        <Printer className="h-4 w-4 mr-1.5" /> Imprimir / PDF
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 font-medium uppercase tracking-wider text-slate-600 border-b border-slate-200">
                        <tr>
                            <th className="p-3">Data / Hora</th>
                            <th className="p-3">Usuário</th>
                            <th className="p-3">Nº Atleta</th>
                            <th className="p-3">Nome Atleta</th>
                            <th className="p-3">Campo Alterado</th>
                            <th className="p-3">Antes</th>
                            <th className="p-3">Depois</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="p-3 font-mono text-slate-500">{log.timestamp}</td>
                                <td className="p-3 font-medium text-slate-800">{log.usuario}</td>
                                <td className="p-3 font-medium text-slate-900">{log.numAtleta}</td>
                                <td className="p-3 font-medium">{log.nomeAtleta}</td>
                                <td className="p-3 text-blue-600 font-medium">{log.campoAlterado}</td>
                                <td className="p-3 text-rose-600 line-through bg-rose-50/50 rounded">{log.valorAnterior}</td>
                                <td className="p-3 text-emerald-700 font-medium bg-emerald-50/50 rounded">{log.valorNovo}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
