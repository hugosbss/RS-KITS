"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { REPORT_FIELDS, type ReportFieldKey, type AthleteReportRecord } from "./types";

interface RelacaoEntregaTabProps {
    deliveryRelationFields: ReportFieldKey[];
    setDeliveryRelationFields: React.Dispatch<React.SetStateAction<ReportFieldKey[]>>;
    reportAthletes: AthleteReportRecord[];
    isDeliveryRelationGenerated: boolean;
    setIsDeliveryRelationGenerated: React.Dispatch<React.SetStateAction<boolean>>;
    exportDeliveryRelation: () => void;
    toggleField: (field: ReportFieldKey, fields: ReportFieldKey[], setFields: (fields: ReportFieldKey[]) => void) => void;
}

export function RelacaoEntregaTab({
    deliveryRelationFields,
    setDeliveryRelationFields,
    reportAthletes,
    isDeliveryRelationGenerated,
    setIsDeliveryRelationGenerated,
    exportDeliveryRelation,
    toggleField,
}: RelacaoEntregaTabProps) {
    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="border-slate-200 p-5 shadow-none">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-medium text-slate-900">Relatório de Relação de Entrega</h2>
                        <p className="mt-1 text-xs text-slate-500">Selecione os campos que deverão aparecer no relatório final.</p>
                    </div>
                    <Button
                        size="sm"
                        disabled={deliveryRelationFields.length === 0}
                        onClick={() => setIsDeliveryRelationGenerated(true)}
                        className="rounded-xl text-xs font-medium"
                    >
                        Gerar relatório
                    </Button>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {REPORT_FIELDS.map((field) => {
                        const checked = deliveryRelationFields.includes(field.key);
                        return (
                            <label key={field.key} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${checked ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                                <input type="checkbox" checked={checked} onChange={() => toggleField(field.key, deliveryRelationFields, setDeliveryRelationFields)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                {field.label}
                            </label>
                        );
                    })}
                </div>
            </Card>

            <Card className="border-slate-200 p-5 shadow-none">
                <h3 className="text-sm font-medium text-slate-900">Resumo da exportação</h3>
                <dl className="mt-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between"><dt className="text-slate-500">Atletas no relatório</dt><dd className="font-medium text-slate-900">{reportAthletes.length}</dd></div>
                    <div className="flex items-center justify-between"><dt className="text-slate-500">Campos selecionados</dt><dd className="font-medium text-slate-900">{deliveryRelationFields.length}</dd></div>
                </dl>
                <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Colunas selecionadas</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        {deliveryRelationFields.length ? deliveryRelationFields.map((key) => REPORT_FIELDS.find((field) => field.key === key)?.label).join(" · ") : "Nenhum campo selecionado"}
                    </p>
                </div>
                <Button
                    size="sm"
                    disabled={!isDeliveryRelationGenerated || deliveryRelationFields.length === 0}
                    onClick={exportDeliveryRelation}
                    className="mt-5 w-full rounded-xl bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700"
                >
                    <Download className="mr-1.5 h-4 w-4" /> Exportar relação em Excel/CSV
                </Button>
            </Card>
        </div>
    );
}
