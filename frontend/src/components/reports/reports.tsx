"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    Download,
    FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/providers/app-context";
import {
    REPORT_FIELDS,
    UPDATE_MODEL_FIELD_KEYS,
    getReportFieldValue,
    parseCsvLine,
    normalizeColumnName,
    type AuditLogItem,
    type ReportFieldKey,
    type AthleteReportRecord,
    type AthleteUpdate,
    type ReportShellProps,
} from "./types";
import { downloadCSV } from "./export-utils";
import { ReportsHeader } from "./reports-header";
import { AuditStaticTab } from "./audit-static-tab";
import { AuditModelExportTab } from "./audit-model-export-tab";
import { AuditFullTab } from "./audit-full-tab";
import { ModeloAtualizacaoTab } from "./modelo-atualizacao-tab";
import { RelacaoEntregaTab } from "./relacao-entrega-tab";
import type { ImportedRow } from "@/components/import/import";

export type { AuditLogItem, AthleteReportRecord, AthleteUpdate, ReportShellProps } from "./types";

function mapImportedRowToReport(row: ImportedRow, eventName: string): AthleteReportRecord {
    return {
        num: row.num,
        nomeAtleta: row.nomeAtleta,
        kit: row.kit,
        distancia: row.modalidade,
        faixaEtaria: row.fxEtaria,
        categoriaEspecial: row.categEspecial,
        nascimento: row.nascto,
        sexo: row.sexo === "F" ? "F" : "M",
        equipe: row.equipe,
        cidadeUf: row.cidadeUf,
        camiseta: row.camiseta,
        cpfAtleta: row.cpfAtleta,
        cel: row.cel,
        email: row.email,
        retirarKit: row.quemVaiRetirar,
        notas: row.notas,
        obs1: row.obs1,
        obs2: row.obs2,
        alerta: row.alerta,
        nomeEvento: row.nomeEvento || eventName,
        statusEntrega: row.statusEntrega ?? "PENDENTE",
        dataEntrega: row.dataEntrega,
        usuarioEntrega: row.usuarioEntrega,
        obsEntrega: row.obsEntrega,
        dataEstorno: row.dataEstorno,
        usuarioEstorno: row.usuarioEstorno,
        foiAlterado: false,
        camposAlterados: [],
    };
}

function formatTimestamp(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ReportShell({ initialAthletes, onApplyAthleteUpdates }: ReportShellProps) {
    const { selectedEvent, athletesByEvent, currentUser } = useAppState();
    const eventId = selectedEvent?.id ?? "";
    const eventName = selectedEvent?.name ?? "";

    const realReportAthletes = useMemo<AthleteReportRecord[]>(
        () => (eventId ? (athletesByEvent[eventId] ?? []).map((row) => mapImportedRowToReport(row, eventName)) : []),
        [athletesByEvent, eventId, eventName],
    );

    // Abas Principais
    const [activeTab, setActiveTab] = useState<"ALTERACOES" | "MODELO_ATUALIZACAO" | "RELACAO_ENTREGA">("ALTERACOES");
    const [subTabAlteracoes, setSubTabAlteracoes] = useState<
        "ESTATICO" | "AGRUPADO" | "LINHAS_AMARELO" | "MODELO_EXPORT" | "FULL"
    >("ESTATICO");
    const [subTabDinamico, setSubTabDinamico] = useState<
        "MODALIDADE" | "EQUIPE" | "CIDADE" | "CAMISETA" | "SEXO" | "SEXO_DISTANCIA" | "IDADE" | "ENTREGAS_HORA"
    >("MODALIDADE");

    // Filtros globais do módulo dinâmico
    const [filterSexo, setFilterSexo] = useState("TODOS");
    const [filterModalidade, setFilterModalidade] = useState("TODOS");
    const [filterCidade, setFilterCidade] = useState("TODOS");
    const [filterCamiseta, setFilterCamiseta] = useState("TODOS");
    const [filterFaixaEtaria, setFilterFaixaEtaria] = useState("TODOS");

    // Modelo de atualização (de/para): somente atletas com alterações.
    const [updateModelFields, setUpdateModelFields] = useState<ReportFieldKey[]>(UPDATE_MODEL_FIELD_KEYS);
    const [updateModelHeaders, setUpdateModelHeaders] = useState<Record<ReportFieldKey, string>>(() =>
        Object.fromEntries(REPORT_FIELDS.map((field) => [field.key, field.label])) as Record<ReportFieldKey, string>,
    );
    const [reportAthletes, setReportAthletes] = useState<AthleteReportRecord[]>(() => initialAthletes ?? realReportAthletes);
    const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
    const [importSummary, setImportSummary] = useState<{ updated: number; unchanged: number; notFound: number; fieldsChanged: number } | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Mantém os relatórios sempre alinhados com os atletas reais do evento selecionado.
    useEffect(() => {
        setReportAthletes(realReportAthletes);
        setAuditLogs([]);
        setImportSummary(null);
        setSubTabAlteracoes("ESTATICO");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [realReportAthletes]);

    // Relação de entrega: o operador define as colunas que farão parte da planilha final.
    const [deliveryRelationFields, setDeliveryRelationFields] = useState<ReportFieldKey[]>([
        "num", "nomeAtleta", "distancia", "kit", "camiseta", "retirarKit", "statusEntrega", "dataEntrega",
    ]);
    const [isDeliveryRelationGenerated, setIsDeliveryRelationGenerated] = useState(false);

    // Dados filtrados dinamicamente
    const filteredAthletes = useMemo(() => {
        return reportAthletes.filter((a) => {
            if (filterSexo !== "TODOS" && a.sexo !== filterSexo) return false;
            if (filterModalidade !== "TODOS" && a.distancia !== filterModalidade) return false;
            if (filterCidade !== "TODOS" && a.cidadeUf !== filterCidade) return false;
            if (filterCamiseta !== "TODOS" && a.camiseta !== filterCamiseta) return false;
            if (filterFaixaEtaria !== "TODOS" && a.faixaEtaria !== filterFaixaEtaria) return false;
            return true;
        });
    }, [filterSexo, filterModalidade, filterCidade, filterCamiseta, filterFaixaEtaria, reportAthletes]);

    // Cálculos de Relatório Dinâmico
    const statsModalidade = useMemo(() => {
        const map: Record<string, number> = {};
        filteredAthletes.forEach((a) => {
            map[a.distancia] = (map[a.distancia] || 0) + 1;
        });
        return Object.entries(map).map(([modalidade, total]) => ({ modalidade, total }));
    }, [filteredAthletes]);

    const statsEquipe = useMemo(() => {
        const map: Record<string, number> = {};
        filteredAthletes.forEach((a) => {
            map[a.equipe] = (map[a.equipe] || 0) + 1;
        });
        return Object.entries(map)
            .map(([equipe, total]) => ({ equipe, total }))
            .sort((a, b) => b.total - a.total);
    }, [filteredAthletes]);

    const statsCidade = useMemo(() => {
        const map: Record<string, number> = {};
        filteredAthletes.forEach((a) => {
            map[a.cidadeUf] = (map[a.cidadeUf] || 0) + 1;
        });
        return Object.entries(map).map(([cidade, total]) => ({ cidade, total }));
    }, [filteredAthletes]);

    const statsCamiseta = useMemo(() => {
        const map: Record<string, number> = {};
        filteredAthletes.forEach((a) => {
            map[a.camiseta] = (map[a.camiseta] || 0) + 1;
        });
        return Object.entries(map).map(([tamanho, total]) => ({ tamanho, total }));
    }, [filteredAthletes]);

    const statsSexo = useMemo(() => {
        const m = filteredAthletes.filter((a) => a.sexo === "M").length;
        const f = filteredAthletes.filter((a) => a.sexo === "F").length;
        const total = filteredAthletes.length;
        return {
            masculino: m,
            feminino: f,
            pctM: total > 0 ? Math.round((m / total) * 100) : 0,
            pctF: total > 0 ? Math.round((f / total) * 100) : 0,
        };
    }, [filteredAthletes]);

    const statsSexoDistancia = useMemo(() => {
        const map: Record<string, { m: number; f: number; total: number }> = {};
        filteredAthletes.forEach((a) => {
            if (!map[a.distancia]) map[a.distancia] = { m: 0, f: 0, total: 0 };
            if (a.sexo === "M") map[a.distancia].m += 1;
            if (a.sexo === "F") map[a.distancia].f += 1;
            map[a.distancia].total += 1;
        });
        return Object.entries(map).map(([distancia, val]) => ({ distancia, ...val }));
    }, [filteredAthletes]);

    const statsFaixaEtaria = useMemo(() => {
        const ranges = [
            "Até 20 anos",
            "De 21 anos até 30 Anos",
            "De 31 anos até 40 Anos",
            "De 41 anos até 50 Anos",
            "De 51 anos até 60 Anos",
            "Mais de 61 Anos",
        ];
        const map: Record<string, number> = {};
        ranges.forEach((r) => (map[r] = 0));

        filteredAthletes.forEach((a) => {
            if (a.faixaEtaria.includes("20")) map["Até 20 anos"]++;
            else if (a.faixaEtaria.includes("25") || a.faixaEtaria.includes("30")) map["De 21 anos até 30 Anos"]++;
            else if (a.faixaEtaria.includes("35") || a.faixaEtaria.includes("40")) map["De 31 anos até 40 Anos"]++;
            else if (a.faixaEtaria.includes("45") || a.faixaEtaria.includes("50")) map["De 41 anos até 50 Anos"]++;
            else if (a.faixaEtaria.includes("51") || a.faixaEtaria.includes("54") || a.faixaEtaria.includes("60")) map["De 51 anos até 60 Anos"]++;
            else if (a.faixaEtaria.includes("61") || a.categoriaEspecial.includes("Idoso")) map["Mais de 61 Anos"]++;
            else map["De 31 anos até 40 Anos"]++;
        });

        return Object.entries(map).map(([faixa, total]) => ({ faixa, total }));
    }, [filteredAthletes]);

    const statsEntregasHora = useMemo(() => {
        return [
            { hora: "08:00 - 09:00", entregas: 12, operador: "Carlos Operador" },
            { hora: "09:00 - 10:00", entregas: 45, operador: "Fernanda Operadora" },
            { hora: "10:00 - 11:00", entregas: 88, operador: "Carlos Operador" },
            { hora: "11:00 - 12:00", entregas: 62, operador: "Supervisão Ana" },
        ];
    }, []);

    const toggleField = (
        field: ReportFieldKey,
        fields: ReportFieldKey[],
        setFields: (fields: ReportFieldKey[]) => void,
    ) => {
        setFields(fields.includes(field) ? fields.filter((item) => item !== field) : [...fields, field]);
    };

    const exportUpdateModel = () => {
        const changedAthletes = reportAthletes.filter((athlete) => athlete.foiAlterado);
        downloadCSV(
            "Modelo_Atualizacao_Atletas.csv",
            updateModelFields.map((field) => updateModelHeaders[field] || REPORT_FIELDS.find((item) => item.key === field)?.label || field),
            changedAthletes.map((athlete) => updateModelFields.map((field) => {
                const isIdentifier = field === "num" || field === "cpfAtleta";
                return isIdentifier || athlete.camposAlterados?.includes(field)
                    ? getReportFieldValue(athlete, field)
                    : "";
            })),
        );
    };

    const importAthleteUpdates = async (file: File) => {
        setIsImporting(true);
        setImportSummary(null);

        try {
            const content = (await file.text()).replace(/^\uFEFF/, "");
            const lines = content.split(/\r?\n/).filter((line) => line.trim());
            if (lines.length < 2) throw new Error("A planilha precisa conter cabeçalho e ao menos uma atualização.");

            const delimiter = lines[0].includes(";") ? ";" : ",";
            const headers = parseCsvLine(lines[0], delimiter);
            const aliases = new Map<string, ReportFieldKey>();
            REPORT_FIELDS.forEach((field) => {
                aliases.set(normalizeColumnName(field.label), field.key);
                aliases.set(normalizeColumnName(updateModelHeaders[field.key]), field.key);
            });
            aliases.set("numero", "num");
            aliases.set("numerodoatleta", "num");
            aliases.set("cpf", "cpfAtleta");
            aliases.set("cpfdoatleta", "cpfAtleta");

            const columnFields = headers.map((header) => aliases.get(normalizeColumnName(header)));
            if (!columnFields.includes("num") && !columnFields.includes("cpfAtleta")) {
                throw new Error("Inclua a coluna NUM ou CPF Atleta para identificar cada atleta.");
            }

            const updates: AthleteUpdate[] = [];
            const newAuditLogs: AuditLogItem[] = [];
            let unchanged = 0;
            let notFound = 0;
            let fieldsChanged = 0;
            const normalizeCpf = (value: string) => value.replace(/\D/g, "");
            const next = reportAthletes.map((athlete) => ({ ...athlete }));

            lines.slice(1).forEach((line) => {
                    const cells = parseCsvLine(line, delimiter);
                    const incoming = new Map<ReportFieldKey, string>();
                    columnFields.forEach((field, index) => {
                        const value = cells[index]?.trim();
                        if (field && value) incoming.set(field, value);
                    });

                    const num = incoming.get("num");
                    const cpf = incoming.get("cpfAtleta");
                    const athleteIndex = next.findIndex((athlete) =>
                        (num && athlete.num === num) || (cpf && normalizeCpf(athlete.cpfAtleta) === normalizeCpf(cpf)),
                    );
                    if (athleteIndex < 0) {
                        notFound += 1;
                        return;
                    }

                    const athlete = next[athleteIndex];
                    const fieldUpdates: AthleteUpdate["fields"] = [];
                    incoming.forEach((after, field) => {
                        if (field === "num" || field === "cpfAtleta") return;
                        const before = getReportFieldValue(athlete, field);
                        if (before !== after) fieldUpdates.push({ field, before, after });
                    });

                    if (!fieldUpdates.length) {
                        unchanged += 1;
                        return;
                    }

                    const updatedAthlete = fieldUpdates.reduce(
                        (result, change) => ({ ...result, [change.field]: change.after }),
                        athlete,
                    ) as AthleteReportRecord;
                    next[athleteIndex] = {
                        ...updatedAthlete,
                        foiAlterado: true,
                        camposAlterados: Array.from(new Set([...(athlete.camposAlterados ?? []), ...fieldUpdates.map((change) => change.field)])),
                    };
                    fieldsChanged += fieldUpdates.length;
                    updates.push({ athleteNum: athlete.num, athleteCpf: athlete.cpfAtleta, fields: fieldUpdates });
                    fieldUpdates.forEach((change) => {
                        newAuditLogs.push({
                            id: crypto.randomUUID(),
                            timestamp: formatTimestamp(new Date()),
                            usuario: currentUser?.name ?? "Operador",
                            numAtleta: athlete.num,
                            nomeAtleta: athlete.nomeAtleta,
                            campoAlterado: REPORT_FIELDS.find((field) => field.key === change.field)?.label ?? change.field,
                            valorAnterior: change.before,
                            valorNovo: change.after,
                            ipOuDispositivo: "Importação de planilha",
                        });
                    });
            });
            setReportAthletes(next);
            setAuditLogs((current) => [...newAuditLogs, ...current]);

            setImportSummary({ updated: updates.length, unchanged, notFound, fieldsChanged });
            await onApplyAthleteUpdates?.(updates);
        } catch (error) {
            setImportSummary({ updated: 0, unchanged: 0, notFound: 0, fieldsChanged: 0 });
            window.alert(error instanceof Error ? error.message : "Não foi possível importar a planilha.");
        } finally {
            setIsImporting(false);
        }
    };

    const exportDeliveryRelation = () => {
        downloadCSV(
            "Relacao_de_Entrega.csv",
            deliveryRelationFields.map((field) => REPORT_FIELDS.find((item) => item.key === field)?.label || field),
            reportAthletes.map((athlete) => deliveryRelationFields.map((field) => getReportFieldValue(athlete, field))),
        );
    };

    // Handler de Exportação do Relatório Selecionado
    const handleExportReport = (type: string) => {
        if (type === "FULL") {
            const headers = [
                "NUM", "Nome Atleta", "KIT", "Distância", "Faixa Etaria", "Categoria Especial", "Nascimento",
                "Sexo", "Equipe", "Cidade/UF", "Camiseta", "CPF Atleta", "Cel", "E-mail", "Retirar KIT",
                "Notas", "Obs1", "Obs2", "Alerta", "Nome Evento", "status_entrega", "data_entrega",
                "usuario_entrega", "obs_entrega", "data_estorno", "usuario_estorno"
            ];
            const rows = reportAthletes.map((a) => [
                a.num, a.nomeAtleta, a.kit, a.distancia, a.faixaEtaria, a.categoriaEspecial, a.nascimento,
                a.sexo, a.equipe, a.cidadeUf, a.camiseta, a.cpfAtleta, a.cel, a.email, a.retirarKit,
                a.notas, a.obs1, a.obs2, a.alerta, a.nomeEvento, a.statusEntrega, a.dataEntrega,
                a.usuarioEntrega, a.obsEntrega, a.dataEstorno, a.usuarioEstorno
            ]);
            downloadCSV("Relatorio_Dados_Full.csv", headers, rows);
        } else if (type === "MODELO_EXPORT") {
            const headers = ["Num", "Nome atleta", "Modalidade", "Nascto.", "Sexo", "Equipe", "Cidade / UF", "Camiseta", "CPF Atleta", "Cel", "Notas"];
            const rows = reportAthletes.filter((a) => a.foiAlterado).map((a) => [
                a.num, a.nomeAtleta, a.distancia, a.nascimento, a.sexo, a.equipe, a.cidadeUf, a.camiseta, a.cpfAtleta, a.cel, a.notas
            ]);
            downloadCSV("Relatorio_Modelo_Exportacao_Alterados.csv", headers, rows);
        } else if (type === "LINHAS_AMARELO") {
            const headers = [
                "NUM", "Nome Atleta", "KIT", "Distância", "Faixa Etaria", "Categoria Especial", "Nascimento",
                "Sexo", "Equipe", "Cidade/UF", "Camiseta", "CPF Atleta", "Cel", "E-mail", "Retirar KIT",
                "Notas", "Obs1", "Obs2", "Alerta", "Nome Evento", "status_entrega", "data_entrega",
                "usuario_entrega", "obs_entrega", "data_estorno", "usuario_estorno"
            ];
            const rows = reportAthletes.map((a) => [
                a.num, a.nomeAtleta, a.kit, a.distancia, a.faixaEtaria, a.categoriaEspecial, a.nascimento,
                a.sexo, a.equipe, a.cidadeUf, a.camiseta, a.cpfAtleta, a.cel, a.email, a.retirarKit,
                a.notas, a.obs1, a.obs2, a.alerta, a.nomeEvento, a.statusEntrega, a.dataEntrega,
                a.usuarioEntrega, a.obsEntrega, a.dataEstorno, a.usuarioEstorno
            ]);
            downloadCSV("Relatorio_Alteracoes_Linhas_Amarelo.csv", headers, rows);
        } else if (type === "AGRUPADO") {
            const headers = ["Timestamp", "Usuário", "Num Atleta", "Nome Atleta", "Campo Alterado", "Valor Anterior", "Valor Novo", "Dispositivo"];
            const rows = auditLogs.map((l) => [
                l.timestamp, l.usuario, l.numAtleta, l.nomeAtleta, l.campoAlterado, l.valorAnterior, l.valorNovo, l.ipOuDispositivo
            ]);
            downloadCSV("Relatorio_Alteracoes_Agrupado.csv", headers, rows);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <ReportsHeader />

            <main className="p-4 sm:p-6 lg:ml-64 lg:p-8 space-y-6">
                {/* Seletor da Aba Principal */}
                <div className="flex max-w-full flex-wrap rounded-2xl bg-slate-200/80 p-1.5">
                    <button
                        onClick={() => setActiveTab("ALTERACOES")}
                        className={`flex-none flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[11px] sm:text-xs font-medium transition ${
                            activeTab === "ALTERACOES" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <Activity className="h-4 w-4" /> Relatórios de Alterações & Auditoria
                    </button>
                    <button
                        onClick={() => setActiveTab("MODELO_ATUALIZACAO")}
                        className={`flex-none flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[11px] sm:text-xs font-medium transition ${
                            activeTab === "MODELO_ATUALIZACAO" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <FileSpreadsheet className="h-4 w-4" /> Excel Modelo e Exportação
                    </button>
                    <button
                        onClick={() => setActiveTab("RELACAO_ENTREGA")}
                        className={`flex-none flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[11px] sm:text-xs font-medium transition ${
                            activeTab === "RELACAO_ENTREGA" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <Download className="h-4 w-4" /> Relação de Entrega
                    </button>
                </div>

                {/* CONTEÚDO DA ABA 1: RELATÓRIOS DE ALTERAÇÕES & EXPORTAÇÕES */}
                {activeTab === "ALTERACOES" && (
                    <div className="space-y-6">
                        {/* Sub-Abas do Módulo de Alterações */}
                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                            <Button
                                size="sm"
                                variant={subTabAlteracoes === "ESTATICO" ? "default" : "outline"}
                                onClick={() => setSubTabAlteracoes("ESTATICO")}
                                className="rounded-xl text-xs font-medium"
                            >
                                Relatório Analítico
                            </Button>
                            <Button
                                size="sm"
                                variant={subTabAlteracoes === "MODELO_EXPORT" ? "default" : "outline"}
                                onClick={() => setSubTabAlteracoes("MODELO_EXPORT")}
                                className="rounded-xl text-xs font-medium"
                            >
                                Excel - Modelo Exportação
                            </Button>
                            <Button
                                size="sm"
                                variant={subTabAlteracoes === "FULL" ? "default" : "outline"}
                                onClick={() => setSubTabAlteracoes("FULL")}
                                className="rounded-xl text-xs font-medium bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                            >
                                Excel - Dados Full
                            </Button>
                        </div>

                        {subTabAlteracoes === "ESTATICO" && (
                            <AuditStaticTab logs={auditLogs} onExportAgrupado={() => handleExportReport("AGRUPADO")} />
                        )}

                        {subTabAlteracoes === "MODELO_EXPORT" && (
                            <AuditModelExportTab athletes={reportAthletes} onExportModel={() => handleExportReport("MODELO_EXPORT")} />
                        )}

                        {subTabAlteracoes === "FULL" && (
                            <AuditFullTab athletes={reportAthletes} onExportFull={() => handleExportReport("FULL")} />
                        )}
                    </div>
                )}

                {activeTab === "MODELO_ATUALIZACAO" && (
                    <ModeloAtualizacaoTab
                        updateModelFields={updateModelFields}
                        setUpdateModelFields={setUpdateModelFields}
                        updateModelHeaders={updateModelHeaders}
                        setUpdateModelHeaders={setUpdateModelHeaders}
                        reportAthletes={reportAthletes}
                        importSummary={importSummary}
                        isImporting={isImporting}
                        exportUpdateModel={exportUpdateModel}
                        importAthleteUpdates={importAthleteUpdates}
                        toggleField={toggleField}
                    />
                )}

                {activeTab === "RELACAO_ENTREGA" && (
                    <RelacaoEntregaTab
                        deliveryRelationFields={deliveryRelationFields}
                        setDeliveryRelationFields={setDeliveryRelationFields}
                        reportAthletes={reportAthletes}
                        isDeliveryRelationGenerated={isDeliveryRelationGenerated}
                        setIsDeliveryRelationGenerated={setIsDeliveryRelationGenerated}
                        exportDeliveryRelation={exportDeliveryRelation}
                        toggleField={toggleField}
                    />
                )}
            </main>
        </div>
    );
}
