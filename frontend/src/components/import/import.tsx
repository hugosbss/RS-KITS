"use client";

import { useEffect, useState, useRef } from "react";
import {
    CheckCircle2,
    Database,
    Download,
    FileSpreadsheet,
    HardDriveDownload,
    PackageCheck,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppState } from "@/components/providers/app-context";
import { parseAthletesFromExcel } from "@/services/excel-parser";
import { ImportDropzone } from "./import-dropzone";
import { ImportPreviewTable } from "./import-preview-table";
import { TEMPLATE_HEADERS } from "./types";
import type { ImportedRow } from "./types";

export type { ImportedRow } from "./types";

export function ImportShell() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { currentUser, selectedEvent, importAthletes } = useAppState();

    const [online, setOnline] = useState(true);

    // Estados de Importação
    const [previewData, setPreviewData] = useState<ImportedRow[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Estados de Backup
    const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);
    const [backupMessage, setBackupMessage] = useState<string | null>(null);

    useEffect(() => {
        setOnline(navigator.onLine);

        const on = () => setOnline(true);
        const off = () => setOnline(false);

        addEventListener("online", on);
        addEventListener("offline", off);

        return () => {
            removeEventListener("online", on);
            removeEventListener("offline", off);
        };
    }, []);

    // 1. GERAR BACKUP DO BANCO DE DADOS (JSON)
    const handleGenerateBackup = () => {
        setIsGeneratingBackup(true);
        setBackupMessage(null);

        setTimeout(() => {
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 16);

            const backupData = {
                metadata: {
                    sistema: "RS KITS Offline-First",
                    versao: "1.0.0",
                    dataExportacao: now.toLocaleString("pt-BR"),
                    operador: "Operador RS KITS",
                },
                dbStats: {
                    totalAtletas: previewData.length,
                    entregasRealizadas: 0,
                    eventosAtivos: 1,
                },
                evento: selectedEvent?.name ?? "Nenhum evento selecionado",
                atletas: previewData,
                logsAuditoria: [
                    { id: "1", acao: "BACKUP_CRIADO", usuario: "Operador RS KITS", timestamp: now.toISOString() },
                ],
            };

            const jsonStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `backup_rs_kits_${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setIsGeneratingBackup(false);
            setBackupMessage(`Backup gerado com sucesso! Arquivo backup_rs_kits_${timestamp}.json baixado.`);
        }, 600);
    };

    // 2. BAIXAR PLANILHA MODELO EM CSV
    const handleDownloadTemplate = () => {
        const bom = "\uFEFF";
        const csvHeader = TEMPLATE_HEADERS.join(";");
        const csvExampleRow = [
            "101",
            "AMANDA SALVA",
            "KIT PARTICIPAÇÃO",
            "10 KM FEM",
            "CORRIDA 10 KM",
            "40 A 49 ANOS",
            "12/03/1983",
            "F",
            "CAFé COM LEITE RUNNERS",
            "IBITINGA/SP",
            "BL P",
            "311.888.958-69",
            "(16)99749-5116",
            "AMANDASALVA040@GMAIL.COM",
            "",
            "1415900013",
            "",
            "",
            "",
            "4ª ETAPA - JAÚ SERVE NOVO HORIZONTE",
            "",
            "",
            "",
            "",
            "",
        ].map((v) => `"${v}"`).join(";");

        const csvContent = bom + csvHeader + "\n" + csvExampleRow;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "modelo_importacao_atletas_rs_kits.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 3. LEITURA E PARSER DE ARQUIVOS CSV / XLSX
    const processFile = async (file: File) => {
        setFileName(file.name);
        setImportSuccess(null);
        setImportError(null);

        const isExcel = file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls");

        if (isExcel) {
            try {
                const { rows } = await parseAthletesFromExcel(file);
                const parsed: ImportedRow[] = rows.map((row, idx) => ({
                    id: `parsed-${Date.now()}-${idx + 1}`,
                    num: row.num,
                    nomeAtleta: row.nomeAtleta,
                    kit: row.kit,
                    modalidade: row.distancia,
                    fxEtaria: row.fxEtaria,
                    categEspecial: row.categEspecial,
                    nascto: row.nascto,
                    sexo: row.sexo,
                    equipe: row.equipe,
                    cidadeUf: row.cidadeUf,
                    camiseta: row.camiseta,
                    cpfAtleta: row.cpfAtleta,
                    cel: row.cel,
                    email: row.email,
                    quemVaiRetirar: row.quemVaiRetirar,
                    notas: row.notas,
                    obs1: row.obs1,
                    obs2: row.obs2,
                    alerta: row.alerta,
                    nomeEvento: selectedEvent?.name || row.nomeEvento,
                    contato: row.contato,
                    grauParentesco: row.grauParentesco,
                    celularContato: row.celularContato,
                    pin: row.pin,
                    itensAdicionais: row.itensAdicionais,
                    statusValidacao: !row.cpfAtleta ? "ATENÇÃO" : "VALIDO",
                }));
                setPreviewData(parsed);
            } catch (err) {
                setImportError(err instanceof Error ? err.message : "Não foi possível ler a planilha.");
            }
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
            if (lines.length <= 1) {
                setImportError("O arquivo selecionado está vazio ou não possui linhas de dados.");
                return;
            }

            const delimiter = lines[0].includes(";") ? ";" : ",";
            const dataRows = lines.slice(1);

            const parsed: ImportedRow[] = dataRows.map((line, idx) => {
                const cols = line
                    .split(delimiter)
                    .map((col) => col.replace(/^"(.*)"$/, "$1").replace(/""/g, '"').trim());

                return {
                    id: `parsed-${idx + 1}`,
                    num: cols[0] || `${1000 + idx}`,
                    nomeAtleta: cols[1] || `Atleta Importado ${idx + 1}`,
                    kit: cols[2] || "Kit Padrão",
                    modalidade: cols[3] || "10 KM",
                    fxEtaria: cols[4] || "30–34",
                    categEspecial: cols[5] || "Não",
                    nascto: cols[6] || "01/01/1990",
                    sexo: cols[7] || "M",
                    equipe: cols[8] || "Avulso",
                    cidadeUf: cols[9] || "São Paulo/SP",
                    camiseta: cols[10] || "M",
                    cpfAtleta: cols[11] || "000.000.000-00",
                    cel: cols[12] || "",
                    email: cols[13] || "",
                    quemVaiRetirar: cols[14] || "Próprio atleta",
                    notas: cols[15] || "",
                    obs1: cols[16] || "",
                    obs2: cols[17] || "",
                    alerta: cols[18] || "",
                    nomeEvento: selectedEvent?.name || cols[19] || "",
                    contato: cols[20] || "",
                    grauParentesco: cols[21] || "",
                    celularContato: cols[22] || "",
                    pin: cols[23] || "",
                    itensAdicionais: cols[24] || "",
                    statusValidacao: !cols[11] ? "ATENÇÃO" : "VALIDO",
                };
            });

            setPreviewData(parsed);
        };

        reader.readAsText(file, "UTF-8");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";
        await processFile(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        await processFile(file);
    };

    // 4. CONFIRMAR IMPORTAÇÃO (persiste no banco quando autenticado)
    const handleConfirmImport = async () => {
        if (previewData.length === 0 || !selectedEvent) return;

        setIsImporting(true);
        setImportSuccess(null);
        setImportError(null);

        try {
            await importAthletes(
                previewData.map((row) => ({ ...row, nomeEvento: selectedEvent.name || row.nomeEvento })),
            );
            setImportSuccess(`${previewData.length} atleta(s) importado(s) para ${selectedEvent.name}.`);
        } catch (err) {
            setImportError(err instanceof Error ? err.message : "Não foi possível importar os atletas.");
        } finally {
            setIsImporting(false);
        }
    };

    if (currentUser.role !== "ADMIN") return <div className="min-h-screen bg-slate-50"><Sidebar /><main className="p-8 lg:ml-64"><Card className="max-w-lg p-6"><h1 className="text-xl font-bold">Acesso restrito</h1><p className="mt-2 text-sm text-slate-500">Somente o administrador pode importar a planilha de um evento.</p></Card></main></div>;
    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <Sidebar />

            {/* Cabeçalho */}
            <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur lg:ml-64">
                <div className="flex flex-col gap-3 p-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-600" /> Importação de Dados e Backup
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">Evento selecionado: <strong>{selectedEvent?.name ?? "nenhum"}</strong></p>
                    </div>
                </div>
            </header>

            <main className="p-4 sm:p-6 lg:ml-64 lg:p-8 space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-slate-200 p-6 shadow-none flex flex-col justify-between space-y-5 bg-white">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-bold">
                                    <HardDriveDownload className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">1. Gerar Backup do Banco de Dados</h2>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3 text-xs">
                                <div className="grid grid-cols-2 gap-3 text-slate-600">
                                    <div>
                                        {/* <span className="text-slate-400 block">Atletas Cadastrados:</span>
                                        <span className="font-bold text-slate-900 text-sm">1.450 registros</span> */}
                                    </div>
                                    <div>
                                        {/* <span className="text-slate-400 block">Kits Entregues:</span>
                                        <span className="font-bold text-emerald-600 text-sm">890 entregues</span> */}
                                    </div>
                                </div>
                            </div>

                            {backupMessage && (
                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <span>{backupMessage}</span>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleGenerateBackup}
                            disabled={isGeneratingBackup}
                            size="lg"
                            className="h-14 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm"
                        >
                            <Download className="h-5 w-5 mr-2" />
                            {isGeneratingBackup ? "Gerando Backup JSON..." : "GERAR E BAIXAR BACKUP DO BANCO"}
                        </Button>
                    </Card>

                    {/* OPÇÃO 2: IMPORTAR DADOS DO EXCEL / CSV */}
                    <Card className="border-slate-200 p-6 shadow-none flex flex-col justify-between space-y-5 bg-white">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 font-bold">
                                        <FileSpreadsheet className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">2. Importar Dados do Excel</h2>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadTemplate}
                                    className="text-xs text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 font-semibold"
                                >
                                    <Download className="h-3.5 w-3.5 mr-1" /> Baixar Modelo de Planilha
                                </Button>
                            </div>

                            {/* Dropzone de Upload */}
                            <ImportDropzone
                                fileInputRef={fileInputRef}
                                isDragging={isDragging}
                                handleDragOver={handleDragOver}
                                handleDragLeave={handleDragLeave}
                                handleDrop={handleDrop}
                                handleFileUpload={handleFileUpload}
                                fileName={fileName}
                                previewDataLength={previewData.length}
                                importSuccess={importSuccess}
                                importError={importError}
                            />
                        </div>

                        <Button
                            onClick={handleConfirmImport}
                            disabled={isImporting || previewData.length === 0 || !selectedEvent}
                            size="lg"
                            className="h-14 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm"
                        >
                            <PackageCheck className="h-5 w-5 mr-2" />
                            {isImporting ? "Importando Registros..." : `CONFIRMAR IMPORTAÇÃO DE ${previewData.length} ATLETAS`}
                        </Button>
                    </Card>
                </div>

                {/* TABELA DE PRÉ-VISUALIZAÇÃO DAS COLUNAS OFICIAIS DA PLANILHA */}
                <ImportPreviewTable previewData={previewData} />
            </main>
        </div>
    );
}
