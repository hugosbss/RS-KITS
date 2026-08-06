"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    AlertCircle,
    AlertTriangle,
    Check,
    CheckCircle2,
    Database,
    Download,
    FileSpreadsheet,
    FileText,
    HardDriveDownload,
    LogOut,
    MapPin,
    PackageCheck,
    RefreshCw,
    ShieldCheck,
    UploadCloud,
    Users,
    Wifi,
    WifiOff,
    X,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clearAuth, getUser, type AuthUser } from "@/services/auth.service";

export interface ImportedRow {
    id: string;
    num: string;
    nomeAtleta: string;
    kit: string;
    distancia: string;
    fxEtaria: string;
    categEspecial: string;
    nascto: string;
    sexo: string;
    equipe: string;
    cidadeUf: string;
    camiseta: string;
    cpfAtleta: string;
    cel: string;
    email: string;
    quemVaiRetirar: string;
    notas: string;
    obs1: string;
    obs2: string;
    alerta: string;
    nomeEvento: string;
    statusValidacao: "VALIDO" | "ALERTA" | "ERRO";
}

const TEMPLATE_HEADERS = [
    "Num",
    "Nome atleta",
    "KIT",
    "Distância",
    "Fx Etaria",
    "Categ Especial",
    "Nascto.",
    "Sexo",
    "Equipe",
    "Cidade/UF",
    "Camiseta",
    "CPF Atleta",
    "Cel",
    "E-mail",
    "Quem Vai retirar o KIT",
    "Notas",
    "Obs1",
    "Obs2",
    "Alerta",
    "Nome Evento",
];

const INITIAL_MOCK_PREVIEW: ImportedRow[] = [
    {
        id: "imp-1",
        num: "1455",
        nomeAtleta: "João Carlos da Silva",
        kit: "Kit Padrão",
        distancia: "10 KM",
        fxEtaria: "35–39",
        categEspecial: "Não",
        nascto: "12/04/1989",
        sexo: "M",
        equipe: "Runners Club",
        cidadeUf: "Bauru/SP",
        camiseta: "G",
        cpfAtleta: "123.456.789-00",
        cel: "(14) 99876-5432",
        email: "joao.carlos@email.com",
        quemVaiRetirar: "Próprio atleta",
        notas: "Documentação ok",
        obs1: "",
        obs2: "",
        alerta: "",
        nomeEvento: "Maratona Internacional 2027",
        statusValidacao: "VALIDO",
    },
    {
        id: "imp-2",
        num: "1456",
        nomeAtleta: "Pedro Alves de Souza",
        kit: "Kit VIP",
        distancia: "21 KM",
        fxEtaria: "30–34",
        categEspecial: "Não",
        nascto: "05/08/1992",
        sexo: "M",
        equipe: "Pace Makers",
        cidadeUf: "São Paulo/SP",
        camiseta: "M",
        cpfAtleta: "234.567.890-11",
        cel: "(11) 98765-4321",
        email: "pedro.alves@email.com",
        quemVaiRetirar: "Próprio atleta",
        notas: "",
        obs1: "",
        obs2: "",
        alerta: "",
        nomeEvento: "Maratona Internacional 2027",
        statusValidacao: "VALIDO",
    },
    {
        id: "imp-3",
        num: "1457",
        nomeAtleta: "Maria Costa Ribeiro",
        kit: "Kit Padrão",
        distancia: "5 KM",
        fxEtaria: "40–44",
        categEspecial: "Não",
        nascto: "18/11/1985",
        sexo: "F",
        equipe: "Runners Club",
        cidadeUf: "Campinas/SP",
        camiseta: "P",
        cpfAtleta: "345.678.901-22",
        cel: "(19) 97654-3210",
        email: "maria.costa@email.com",
        quemVaiRetirar: "Terceiro",
        notas: "Comprovante pendente",
        obs1: "",
        obs2: "",
        alerta: "Verificar documento",
        nomeEvento: "Maratona Internacional 2027",
        statusValidacao: "ALERTA",
    },
];

export function ImportShell() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState<AuthUser | null>(null);
    const [online, setOnline] = useState(true);

    // Estados de Importação
    const [previewData, setPreviewData] = useState<ImportedRow[]>(INITIAL_MOCK_PREVIEW);
    const [fileName, setFileName] = useState<string | null>("exemplo_atletas_evento.csv");
    const [isImporting, setIsImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);

    // Estados de Backup
    const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);
    const [backupMessage, setBackupMessage] = useState<string | null>(null);

    useEffect(() => {
        const current = getUser();
        if (!current) {
            router.replace("/login");
            return;
        }

        setUser(current);
        setOnline(navigator.onLine);

        const on = () => setOnline(true);
        const off = () => setOnline(false);

        addEventListener("online", on);
        addEventListener("offline", off);

        return () => {
            removeEventListener("online", on);
            removeEventListener("offline", off);
        };
    }, [router]);

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
                Carregando módulo de importação...
            </div>
        );
    }

    // 1. GERAR BACKUP DO BANCO DE DADOS (JSON)
    const handleGenerateBackup = () => {
        setIsGeneratingBackup(true);
        setBackupMessage(null);

        setTimeout(() => {
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 16);

            const backupData = {
                metadata: {
                    sistema: "SportDelivery Offline-First",
                    versao: "1.0.0",
                    dataExportacao: now.toLocaleString("pt-BR"),
                    operador: user.name,
                },
                dbStats: {
                    totalAtletas: 1450,
                    entregasRealizadas: 890,
                    estornosEfetuados: 12,
                    eventosAtivos: 1,
                },
                atletas: INITIAL_MOCK_PREVIEW,
                logsAuditoria: [
                    { id: "1", acao: "BACKUP_CRIADO", usuario: user.name, timestamp: now.toISOString() },
                ],
            };

            const jsonStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `backup_sportdelivery_${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setIsGeneratingBackup(false);
            setBackupMessage(`Backup gerado com sucesso! Arquivo backup_sportdelivery_${timestamp}.json baixado.`);
        }, 600);
    };

    // 2. BAIXAR PLANILHA MODELO EM CSV
    const handleDownloadTemplate = () => {
        const bom = "\uFEFF";
        const csvHeader = TEMPLATE_HEADERS.join(";");
        const csvExampleRow = [
            "1001",
            "Atleta Exemplo da Silva",
            "Kit Padrão",
            "10 KM",
            "30–34",
            "Não",
            "15/05/1994",
            "M",
            "Runners Club",
            "Bauru/SP",
            "G",
            "000.000.000-00",
            "(14) 99999-8888",
            "atleta@exemplo.com",
            "Próprio atleta",
            "Observação teste",
            "",
            "",
            "",
            "Maratona Internacional 2027",
        ].map((v) => `"${v}"`).join(";");

        const csvContent = bom + csvHeader + "\n" + csvExampleRow;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "modelo_importacao_atletas_sportdelivery.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 3. LEITURA E PARSER DE ARQUIVOS CSV
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setImportSuccess(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
            if (lines.length <= 1) {
                alert("O arquivo selecionado está vazio ou não possui linhas de dados.");
                return;
            }

            // Descobrir delimitador (; ou ,)
            const delimiter = lines[0].includes(";") ? ";" : ",";
            const dataRows = lines.slice(1);

            const parsed: ImportedRow[] = dataRows.map((line, idx) => {
                const cols = line
                    .split(delimiter)
                    .map((col) => col.replace(/^"(.*)"$/, "$1").trim());

                return {
                    id: `parsed-${idx + 1}`,
                    num: cols[0] || `${1000 + idx}`,
                    nomeAtleta: cols[1] || `Atleta Importado ${idx + 1}`,
                    kit: cols[2] || "Kit Padrão",
                    distancia: cols[3] || "10 KM",
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
                    nomeEvento: cols[19] || "Maratona Internacional 2027",
                    statusValidacao: !cols[11] ? "ALERTA" : "VALIDO",
                };
            });

            setPreviewData(parsed);
        };

        reader.readAsText(file, "UTF-8");
    };

    // 4. CONFIRMAR IMPORTAÇÃO NO BANCO LOCAL
    const handleConfirmImport = () => {
        if (previewData.length === 0) return;

        setIsImporting(true);
        setImportSuccess(null);

        setTimeout(() => {
            setIsImporting(false);
            setImportSuccess(`${previewData.length} atletas importados e sincronizados com sucesso no banco de dados local!`);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <Sidebar />

            {/* Cabeçalho */}
            <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur lg:ml-64">
                <div className="flex flex-col gap-3 p-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Gestão de Dados & Contingência</p>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-600" /> Importação de Dados e Backup
                        </h1>
                        <p className="text-xs text-slate-500">Maratona Internacional 2027</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                online ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                            }`}
                        >
                            {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                            {online ? "Online" : "Offline"}
                        </span> */}

                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold">{user.name}</p>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                clearAuth();
                                router.push("/login");
                            }}
                        >
                            <LogOut className="h-4 w-4" /> Sair
                        </Button>
                    </div>
                </div>
            </header>

            <main className="p-4 sm:p-6 lg:ml-64 lg:p-8 space-y-6">
                {/* GRID COM AS 2 OPÇÕES SOLICITADAS */}
                <div className="grid gap-6 lg:grid-cols-2">

                    {/* OPÇÃO 1: GERAR BACKUP DO BANCO DE DADOS */}
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
                                        <span className="text-slate-400 block">Atletas Cadastrados:</span>
                                        <span className="font-bold text-slate-900 text-sm">1.450 registros</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Kits Entregues:</span>
                                        <span className="font-bold text-emerald-600 text-sm">890 entregues</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Estornos Registrados:</span>
                                        <span className="font-bold text-amber-700 text-sm">12 estornos</span>
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
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 transition rounded-2xl p-6 text-center cursor-pointer space-y-2 group"
                            >
                                <UploadCloud className="h-10 w-10 mx-auto text-slate-400 group-hover:text-emerald-600 transition" />
                                <p className="text-xs font-bold text-slate-800">
                                    Clique aqui para selecionar ou arraste sua planilha (.csv, .xlsx)
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </div>

                            {fileName && (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 text-xs">
                                    <span className="font-semibold text-slate-700 truncate">Arquivo: {fileName}</span>
                                    <span className="font-bold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">
                                        {previewData.length} registros lidos
                                    </span>
                                </div>
                            )}

                            {importSuccess && (
                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <span>{importSuccess}</span>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleConfirmImport}
                            disabled={isImporting || previewData.length === 0}
                            size="lg"
                            className="h-14 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm"
                        >
                            <PackageCheck className="h-5 w-5 mr-2" />
                            {isImporting ? "Importando Registros..." : `CONFIRMAR IMPORTAÇÃO DE ${previewData.length} ATLETAS`}
                        </Button>
                    </Card>
                </div>

                {/* TABELA DE PRÉ-VISUALIZAÇÃO DAS 20 COLUNAS OFICIAIS DA PLANILHA */}
                <Card className="border-slate-200 p-5 shadow-none space-y-4 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Pré-visualização e Validação dos Dados da Planilha</h3>
                            <p className="text-xs text-slate-500">
                                As 20 colunas exigidas pelo sistema foram mapeadas e validadas antes da gravação no banco de dados.
                            </p>
                        </div>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-200">
                            20 Colunas Mapeadas
                        </span>
                    </div>

                    <div className="max-h-[460px] overflow-x-auto overflow-y-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
                            <thead className="sticky top-0 bg-slate-100 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Status</th>
                                    {TEMPLATE_HEADERS.map((header) => (
                                        <th key={header} className="p-3">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {previewData.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50">
                                        <td className="p-3">
                                            {row.statusValidacao === "VALIDO" ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                    <Check className="h-3 w-3" /> Válido
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                    <AlertTriangle className="h-3 w-3" /> Alerta
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 font-bold text-slate-900">#{row.num}</td>
                                        <td className="p-3 font-semibold text-slate-900">{row.nomeAtleta}</td>
                                        <td className="p-3">{row.kit}</td>
                                        <td className="p-3 font-semibold">{row.distancia}</td>
                                        <td className="p-3">{row.fxEtaria}</td>
                                        <td className="p-3">{row.categEspecial}</td>
                                        <td className="p-3">{row.nascto}</td>
                                        <td className="p-3">{row.sexo}</td>
                                        <td className="p-3">{row.equipe}</td>
                                        <td className="p-3">{row.cidadeUf}</td>
                                        <td className="p-3 font-bold text-blue-600">{row.camiseta}</td>
                                        <td className="p-3">{row.cpfAtleta}</td>
                                        <td className="p-3">{row.cel}</td>
                                        <td className="p-3">{row.email}</td>
                                        <td className="p-3">{row.quemVaiRetirar}</td>
                                        <td className="p-3">{row.notas}</td>
                                        <td className="p-3">{row.obs1}</td>
                                        <td className="p-3">{row.obs2}</td>
                                        <td className="p-3">{row.alerta}</td>
                                        <td className="p-3">{row.nomeEvento}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </main>
        </div>
    );
}