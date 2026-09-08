"use client";

import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { REPORT_FIELDS, UPDATE_MODEL_FIELD_KEYS, type ReportFieldKey, type AthleteReportRecord } from "./types";

interface ModeloAtualizacaoTabProps {
    updateModelFields: ReportFieldKey[];
    setUpdateModelFields: React.Dispatch<React.SetStateAction<ReportFieldKey[]>>;
    updateModelHeaders: Record<ReportFieldKey, string>;
    setUpdateModelHeaders: React.Dispatch<React.SetStateAction<Record<ReportFieldKey, string>>>;
    reportAthletes: AthleteReportRecord[];
    importSummary: { updated: number; unchanged: number; notFound: number; fieldsChanged: number } | null;
    isImporting: boolean;
    exportUpdateModel: () => void;
    importAthleteUpdates: (file: File) => Promise<void>;
    toggleField: (field: ReportFieldKey, fields: ReportFieldKey[], setFields: (fields: ReportFieldKey[]) => void) => void;
}

export function ModeloAtualizacaoTab({
    updateModelFields,
    setUpdateModelFields,
    updateModelHeaders,
    setUpdateModelHeaders,
    reportAthletes,
    importSummary,
    isImporting,
    exportUpdateModel,
    importAthleteUpdates,
    toggleField,
}: ModeloAtualizacaoTabProps) {
    return (
        <div className="space-y-6">
            <Card className="border-slate-200 p-5 shadow-none">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-medium text-slate-900">Excel Modelo e Exportação</h2>
                        <p className="mt-1 text-xs text-slate-500">Exporte alterações ou importe uma planilha para atualizar os atletas identificados por NUM ou CPF.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <label className={`inline-flex h-9 cursor-pointer items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-medium text-blue-700 hover:bg-blue-100 ${isImporting ? "pointer-events-none opacity-60" : ""}`}>
                            <Upload className="mr-1.5 h-4 w-4" /> {isImporting ? "Importando..." : "Importar atualizações"}
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                className="sr-only"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) void importAthleteUpdates(file);
                                    event.target.value = "";
                                }}
                            />
                        </label>
                        <Button
                            size="sm"
                            disabled={updateModelFields.length === 0}
                            onClick={exportUpdateModel}
                            className="rounded-xl bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                            <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Exportar {reportAthletes.filter((athlete) => athlete.foiAlterado).length} atualizações
                        </Button>
                    </div>
                </div>

                {importSummary && (
                    <div className="mt-4 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs sm:grid-cols-4">
                        <p><span className="text-slate-500">Atletas atualizados:</span> <strong className="text-emerald-800">{importSummary.updated}</strong></p>
                        <p><span className="text-slate-500">Campos alterados:</span> <strong className="text-emerald-800">{importSummary.fieldsChanged}</strong></p>
                        <p><span className="text-slate-500">Sem mudança:</span> <strong className="text-slate-700">{importSummary.unchanged}</strong></p>
                        <p><span className="text-slate-500">Não localizados:</span> <strong className="text-amber-800">{importSummary.notFound}</strong></p>
                    </div>
                )}

                <p className="mt-4 text-xs text-slate-500">Apenas campos preenchidos substituem o valor atual</p>

                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[640px] text-left text-xs">
                        <thead className="bg-slate-100 uppercase tracking-wider text-slate-600">
                            <tr><th className="p-3">Incluir</th><th className="p-3">Campo RS Kits</th><th className="p-3">Coluna no modelo de destino</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {REPORT_FIELDS.filter((field) => UPDATE_MODEL_FIELD_KEYS.includes(field.key)).map((field) => (
                                <tr key={field.key} className="hover:bg-slate-50">
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            checked={updateModelFields.includes(field.key)}
                                            onChange={() => toggleField(field.key, updateModelFields, setUpdateModelFields)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="p-3 font-medium text-slate-800">{field.label}</td>
                                    <td className="p-3">
                                        <input
                                            value={updateModelHeaders[field.key]}
                                            onChange={(event) => setUpdateModelHeaders((current) => ({ ...current, [field.key]: event.target.value }))}
                                            className="h-8 w-full rounded-lg border border-slate-300 px-2.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
