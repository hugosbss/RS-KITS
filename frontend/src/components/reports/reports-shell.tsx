"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Activity,
    BarChart3,
    Calendar,
    ChevronDown,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    Layers,
    LogOut,
    MapPin,
    PieChart,
    Printer,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldAlert,
    Users,
    Wifi,
    WifiOff,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clearAuth, getUser, type AuthUser } from "@/services/auth.service";

export interface AuditLogItem {
    id: string;
    timestamp: string;
    usuario: string;
    numAtleta: string;
    nomeAtleta: string;
    campoAlterado: string;
    valorAnterior: string;
    valorNovo: string;
    ipOuDispositivo: string;
}

export interface AthleteReportRecord {
    num: string;
    nomeAtleta: string;
    kit: string;
    distancia: string;
    faixaEtaria: string;
    categoriaEspecial: string;
    nascimento: string;
    sexo: "M" | "F";
    equipe: string;
    cidadeUf: string;
    camiseta: string;
    cpfAtleta: string;
    cel: string;
    email: string;
    retirarKit: string;
    notas: string;
    obs1: string;
    obs2: string;
    alerta: string;
    nomeEvento: string;
    statusEntrega: "PENDENTE" | "ENTREGUE" | "ESTORNADO";
    dataEntrega?: string;
    usuarioEntrega?: string;
    obsEntrega?: string;
    dataEstorno?: string;
    usuarioEstorno?: string;
    foiAlterado: boolean;
    camposAlterados?: string[];
}

const MOCK_AUDIT_LOGS: AuditLogItem[] = [
    {
        id: "log-1",
        timestamp: "04/08/2026 10:45",
        usuario: "Supervisão Ana",
        numAtleta: "1457",
        nomeAtleta: "Maria Costa Ribeiro",
        campoAlterado: "Status da Entrega",
        valorAnterior: "ENTREGUE",
        valorNovo: "ESTORNADO",
        ipOuDispositivo: "Mesa 01 - Windows",
    },
    {
        id: "log-2",
        timestamp: "04/08/2026 10:30",
        usuario: "Carlos Operador",
        numAtleta: "1455",
        nomeAtleta: "João Carlos da Silva",
        campoAlterado: "Tamanho da Camiseta",
        valorAnterior: "M",
        valorNovo: "G",
        ipOuDispositivo: "Notebook 02",
    },
    {
        id: "log-3",
        timestamp: "04/08/2026 10:12",
        usuario: "Carlos Operador",
        numAtleta: "1458",
        nomeAtleta: "Ana Beatriz Lima",
        campoAlterado: "Equipe",
        valorAnterior: "Avulso",
        valorNovo: "Sprint Team",
        ipOuDispositivo: "Notebook 02",
    },
    {
        id: "log-4",
        timestamp: "04/08/2026 09:55",
        usuario: "Fernanda Operadora",
        numAtleta: "1460",
        nomeAtleta: "Fernanda Oliveira Rossi",
        campoAlterado: "Retirado Por Terceiro",
        valorAnterior: "Não",
        valorNovo: "Sim (Roberto Rossi)",
        ipOuDispositivo: "Mesa 03",
    },
];

const MOCK_ATHLETES_REPORT: AthleteReportRecord[] = [
    {
        num: "1455",
        nomeAtleta: "João Carlos da Silva",
        kit: "Kit Padrão",
        distancia: "10 KM",
        faixaEtaria: "35–39",
        categoriaEspecial: "Não",
        nascimento: "12/04/1989",
        sexo: "M",
        equipe: "Runners Club",
        cidadeUf: "Bauru/SP",
        camiseta: "G",
        cpfAtleta: "123.456.789-00",
        cel: "(14) 99876-5432",
        email: "joao.carlos@email.com",
        retirarKit: "Pendente",
        notas: "Documentação conferida",
        obs1: "",
        obs2: "",
        alerta: "Atestado OK",
        nomeEvento: "Maratona Internacional 2027",
        statusEntrega: "PENDENTE",
        foiAlterado: true,
        camposAlterados: ["camiseta"],
    },
    {
        num: "1456",
        nomeAtleta: "Pedro Alves de Souza",
        kit: "Kit VIP",
        distancia: "21 KM",
        faixaEtaria: "30–34",
        categoriaEspecial: "Não",
        nascimento: "05/08/1992",
        sexo: "M",
        equipe: "Pace Makers",
        cidadeUf: "São Paulo/SP",
        camiseta: "M",
        cpfAtleta: "234.567.890-11",
        cel: "(11) 98765-4321",
        email: "pedro.alves@email.com",
        retirarKit: "Retirado",
        notas: "",
        obs1: "Retirado com documento",
        obs2: "",
        alerta: "",
        nomeEvento: "Maratona Internacional 2027",
        statusEntrega: "ENTREGUE",
        dataEntrega: "04/08/2026 10:23",
        usuarioEntrega: "Carlos Operador",
        obsEntrega: "Titular",
        foiAlterado: false,
    },
    {
        num: "1457",
        nomeAtleta: "Maria Costa Ribeiro",
        kit: "Kit Padrão",
        distancia: "5 KM",
        faixaEtaria: "40–44",
        categoriaEspecial: "Não",
        nascimento: "18/11/1985",
        sexo: "F",
        equipe: "Runners Club",
        cidadeUf: "Campinas/SP",
        camiseta: "P",
        cpfAtleta: "345.678.901-22",
        cel: "(19) 97654-3210",
        email: "maria.costa@email.com",
        retirarKit: "Estornado",
        notas: "Solicitado estorno por desistência",
        obs1: "",
        obs2: "",
        alerta: "Pendência documento",
        nomeEvento: "Maratona Internacional 2027",
        statusEntrega: "ESTORNADO",
        dataEntrega: "04/08/2026 09:15",
        usuarioEntrega: "Fernanda Operadora",
        dataEstorno: "04/08/2026 10:45",
        usuarioEstorno: "Supervisão Ana",
        foiAlterado: true,
        camposAlterados: ["statusEntrega", "retirarKit", "dataEstorno"],
    },
    {
        num: "1458",
        nomeAtleta: "Ana Beatriz Lima",
        kit: "Kit Padrão",
        distancia: "10 KM",
        faixaEtaria: "25–29",
        categoriaEspecial: "Não",
        nascimento: "22/01/1998",
        sexo: "F",
        equipe: "Sprint Team",
        cidadeUf: "Bauru/SP",
        camiseta: "M",
        cpfAtleta: "456.789.012-33",
        cel: "(14) 99123-4567",
        email: "ana.lima@email.com",
        retirarKit: "Pendente",
        notas: "Mudança de equipe realizada",
        obs1: "",
        obs2: "",
        alerta: "",
        nomeEvento: "Maratona Internacional 2027",
        statusEntrega: "PENDENTE",
        foiAlterado: true,
        camposAlterados: ["equipe"],
    },
    {
        num: "1459",
        nomeAtleta: "Carlos Eduardo Santos",
        kit: "Kit Premium",
        distancia: "42 KM",
        faixaEtaria: "51–60",
        categoriaEspecial: "Master",
        nascimento: "30/03/1975",
        sexo: "M",
        equipe: "Avulso",
        cidadeUf: "Sorocaba/SP",
        camiseta: "GG",
        cpfAtleta: "567.890.123-44",
        cel: "(15) 98111-2233",
        email: "carlos.santos@email.com",
        retirarKit: "Pendente",
        notas: "",
        obs1: "",
        obs2: "",
        alerta: "",
        nomeEvento: "Maratona Internacional 2027",
        statusEntrega: "PENDENTE",
        foiAlterado: false,
    },
    {
        num: "1460",
        nomeAtleta: "Fernanda Oliveira Rossi",
        kit: "Kit VIP",
        distancia: "21 KM",
        faixaEtaria: "31–40",
        categoriaEspecial: "Não",
        nascimento: "14/07/1990",
        sexo: "F",
        equipe: "Pace Makers",
        cidadeUf: "São Paulo/SP",
        camiseta: "Baby Look M",
        cpfAtleta: "678.901.234-55",
        cel: "(11) 97222-3344",
        email: "fernanda.rossi@email.com",
        retirarKit: "Retirado por Terceiro",
        notas: "Retirado pelo esposo",
        obs1: "",
        obs2: "",
        alerta: "",
        nomeEvento: "Maratona Internacional 2027",
        statusEntrega: "ENTREGUE",
        dataEntrega: "04/08/2026 11:10",
        usuarioEntrega: "Carlos Operador",
        obsEntrega: "Roberto Rossi (Esposo)",
        foiAlterado: true,
        camposAlterados: ["obsEntrega"],
    },
    {
        num: "1461",
        nomeAtleta: "Lucas Gabriel Mendes",
        kit: "Kit Padrão",
        distancia: "5 KM",
        faixaEtaria: "Até 20 anos",
        categoriaEspecial: "Não",
        nascimento: "10/10/2007",
        sexo: "M",
        equipe: "Sprint Team",
        cidadeUf: "Bauru/SP",
        camiseta: "P",
        cpfAtleta: "789.012.345-66",
        cel: "(14) 99777-8899",
        email: "lucas.mendes@email.com",
        retirarKit: "Retirado",
        notas: "",
        obs1: "",
        obs2: "",
        alerta: "",
        nomeEvento: "Maratona Internacional 2027",
        statusEntrega: "ENTREGUE",
        dataEntrega: "04/08/2026 11:25",
        usuarioEntrega: "Fernanda Operadora",
        foiAlterado: false,
    },
    {
        num: "1462",
        nomeAtleta: "Roberto Silva Viana",
        kit: "Kit Premium",
        distancia: "42 KM",
        faixaEtaria: "Mais de 61 Anos",
        categoriaEspecial: "Idoso",
        nascimento: "01/01/1960",
        sexo: "M",
        equipe: "Avulso",
        cidadeUf: "São Paulo/SP",
        camiseta: "XGG",
        cpfAtleta: "890.123.456-77",
        cel: "(11) 98888-7766",
        email: "roberto.viana@email.com",
        retirarKit: "Pendente",
        notas: "Kit especial idoso",
        obs1: "",
        obs2: "",
        alerta: "",
        nomeEvento: "Maratona Internacional 2027",
        statusEntrega: "PENDENTE",
        foiAlterado: false,
    },
];

export function ReportShell() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [online, setOnline] = useState(true);

    // Abas Principais
    const [activeTab, setActiveTab] = useState<"ALTERACOES" | "DINAMICO">("ALTERACOES");
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

    useEffect(() => {
        const current = getUser();
        if (!current) {
            router.replace("/login");
            return;
        }
        setUser(current);
        setOnline(navigator.onLine);
    }, [router]);

    // Dados filtrados dinamicamente
    const filteredAthletes = useMemo(() => {
        return MOCK_ATHLETES_REPORT.filter((a) => {
            if (filterSexo !== "TODOS" && a.sexo !== filterSexo) return false;
            if (filterModalidade !== "TODOS" && a.distancia !== filterModalidade) return false;
            if (filterCidade !== "TODOS" && a.cidadeUf !== filterCidade) return false;
            if (filterCamiseta !== "TODOS" && a.camiseta !== filterCamiseta) return false;
            if (filterFaixaEtaria !== "TODOS" && a.faixaEtaria !== filterFaixaEtaria) return false;
            return true;
        });
    }, [filterSexo, filterModalidade, filterCidade, filterCamiseta, filterFaixaEtaria]);

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

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
                Carregando relatórios...
            </div>
        );
    }

    // Função de Exportação CSV/Excel em UTF-8 com BOM
    const downloadCSV = (filename: string, headers: string[], rows: (string | undefined)[][]) => {
        const bom = "\uFEFF";
        const csvContent =
            bom +
            [headers.join(";"), ...rows.map((row) => row.map((val) => `"${(val || "").replace(/"/g, '""')}"`).join(";"))].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            const rows = MOCK_ATHLETES_REPORT.map((a) => [
                a.num, a.nomeAtleta, a.kit, a.distancia, a.faixaEtaria, a.categoriaEspecial, a.nascimento,
                a.sexo, a.equipe, a.cidadeUf, a.camiseta, a.cpfAtleta, a.cel, a.email, a.retirarKit,
                a.notas, a.obs1, a.obs2, a.alerta, a.nomeEvento, a.statusEntrega, a.dataEntrega,
                a.usuarioEntrega, a.obsEntrega, a.dataEstorno, a.usuarioEstorno
            ]);
            downloadCSV("Relatorio_Dados_Full.csv", headers, rows);
        } else if (type === "MODELO_EXPORT") {
            const headers = ["Num", "Nome atleta", "Modalidade", "Nascto.", "Sexo", "Equipe", "Cidade / UF", "Camiseta", "CPF Atleta", "Cel", "Notas"];
            const rows = MOCK_ATHLETES_REPORT.filter((a) => a.foiAlterado).map((a) => [
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
            const rows = MOCK_ATHLETES_REPORT.map((a) => [
                a.num, a.nomeAtleta, a.kit, a.distancia, a.faixaEtaria, a.categoriaEspecial, a.nascimento,
                a.sexo, a.equipe, a.cidadeUf, a.camiseta, a.cpfAtleta, a.cel, a.email, a.retirarKit,
                a.notas, a.obs1, a.obs2, a.alerta, a.nomeEvento, a.statusEntrega, a.dataEntrega,
                a.usuarioEntrega, a.obsEntrega, a.dataEstorno, a.usuarioEstorno
            ]);
            downloadCSV("Relatorio_Alteracoes_Linhas_Amarelo.csv", headers, rows);
        } else if (type === "AGRUPADO") {
            const headers = ["Timestamp", "Usuário", "Num Atleta", "Nome Atleta", "Campo Alterado", "Valor Anterior", "Valor Novo", "Dispositivo"];
            const rows = MOCK_AUDIT_LOGS.map((l) => [
                l.timestamp, l.usuario, l.numAtleta, l.nomeAtleta, l.campoAlterado, l.valorAnterior, l.valorNovo, l.ipOuDispositivo
            ]);
            downloadCSV("Relatorio_Alteracoes_Agrupado.csv", headers, rows);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <Sidebar />

            {/* Cabeçalho */}
            <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur lg:ml-64">
                <div className="flex flex-col gap-3 p-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Módulo de Business Intelligence</p>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" /> Relatórios & Auditoria do Evento
                        </h1>
                        <p className="text-xs text-slate-500">Maratona Internacional 2027 · São Paulo, SP</p>
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
                {/* Seletor da Aba Principal */}
                <div className="flex rounded-2xl bg-slate-200/80 p-1.5 max-w-xl">
                    <button
                        onClick={() => setActiveTab("ALTERACOES")}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                            activeTab === "ALTERACOES" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <Activity className="h-4 w-4" /> Relatórios de Alterações & Auditoria
                    </button>
                    <button
                        onClick={() => setActiveTab("DINAMICO")}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                            activeTab === "DINAMICO" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <PieChart className="h-4 w-4" /> Relatórios & Estátisticas
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
                                className="rounded-xl text-xs font-semibold"
                            >
                                Alterações - Estático (Histórico Recente)
                            </Button>
                            <Button
                                size="sm"
                                variant={subTabAlteracoes === "AGRUPADO" ? "default" : "outline"}
                                onClick={() => setSubTabAlteracoes("AGRUPADO")}
                                className="rounded-xl text-xs font-semibold"
                            >
                                Excel - Agrupado
                            </Button>
                            <Button
                                size="sm"
                                variant={subTabAlteracoes === "LINHAS_AMARELO" ? "default" : "outline"}
                                onClick={() => setSubTabAlteracoes("LINHAS_AMARELO")}
                                className="rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                            >
                                Excel - Linhas/Amarelo
                            </Button>
                            <Button
                                size="sm"
                                variant={subTabAlteracoes === "MODELO_EXPORT" ? "default" : "outline"}
                                onClick={() => setSubTabAlteracoes("MODELO_EXPORT")}
                                className="rounded-xl text-xs font-semibold"
                            >
                                Excel - Modelo Exportação
                            </Button>
                            <Button
                                size="sm"
                                variant={subTabAlteracoes === "FULL" ? "default" : "outline"}
                                onClick={() => setSubTabAlteracoes("FULL")}
                                className="rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                            >
                                Excel - Dados Full
                            </Button>
                        </div>

                        {/* SUB-ABA 1.1: ESTATÍCO / HISTÓRICO RECENTE */}
                        {subTabAlteracoes === "ESTATICO" && (
                            <Card className="border-slate-200 p-5 shadow-none space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Histórico Estático de Alterações Recentes</h3>
                                        <p className="text-xs text-slate-500">Log de auditoria do sistema em tempo real.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleExportReport("AGRUPADO")}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                                        >
                                            <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Exportar para Excel/CSV
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.print()}
                                            className="rounded-xl text-xs font-semibold"
                                        >
                                            <Printer className="h-4 w-4 mr-1.5" /> Imprimir / PDF
                                        </Button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-left text-xs text-slate-700">
                                        <thead className="bg-slate-100 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                            <tr>
                                                <th className="p-3">Data / Hora</th>
                                                <th className="p-3">Usuário</th>
                                                <th className="p-3">Nº Atleta</th>
                                                <th className="p-3">Nome Atleta</th>
                                                <th className="p-3">Campo Alterado</th>
                                                <th className="p-3">Antes</th>
                                                <th className="p-3">Depois</th>
                                                <th className="p-3">Estação / IP</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {MOCK_AUDIT_LOGS.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50">
                                                    <td className="p-3 font-mono text-slate-500">{log.timestamp}</td>
                                                    <td className="p-3 font-semibold text-slate-800">{log.usuario}</td>
                                                    <td className="p-3 font-bold text-slate-900">#{log.numAtleta}</td>
                                                    <td className="p-3 font-medium">{log.nomeAtleta}</td>
                                                    <td className="p-3 text-blue-600 font-semibold">{log.campoAlterado}</td>
                                                    <td className="p-3 text-rose-600 line-through bg-rose-50/50 rounded">{log.valorAnterior}</td>
                                                    <td className="p-3 text-emerald-700 font-bold bg-emerald-50/50 rounded">{log.valorNovo}</td>
                                                    <td className="p-3 text-slate-400 text-[11px]">{log.ipOuDispositivo}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}

                        {/* SUB-ABA 1.2: AGRUPADO */}
                        {subTabAlteracoes === "AGRUPADO" && (
                            <Card className="border-slate-200 p-5 shadow-none space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Relatório Agrupado por Operador e Data</h3>
                                        <p className="text-xs text-slate-500">Exibição analítica de alterações consolidadas por usuário.</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleExportReport("AGRUPADO")}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                                    >
                                        <Download className="h-4 w-4 mr-1.5" /> Baixar Planilha Agrupada (Excel)
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                        <h4 className="font-bold text-xs text-slate-800 uppercase mb-2">Operador: Carlos Operador (2 Alterações)</h4>
                                        <ul className="text-xs space-y-2 text-slate-700">
                                            <li className="flex items-center justify-between p-2 bg-white rounded border border-slate-100">
                                                <span>Atleta #1455 - João Carlos (Tamanho da Camiseta)</span>
                                                <span className="font-mono text-slate-400">04/08 10:30</span>
                                            </li>
                                            <li className="flex items-center justify-between p-2 bg-white rounded border border-slate-100">
                                                <span>Atleta #1458 - Ana Beatriz (Equipe / Assessoria)</span>
                                                <span className="font-mono text-slate-400">04/08 10:12</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                        <h4 className="font-bold text-xs text-slate-800 uppercase mb-2">Operador: Supervisão Ana (1 Alteração)</h4>
                                        <ul className="text-xs space-y-2 text-slate-700">
                                            <li className="flex items-center justify-between p-2 bg-white rounded border border-slate-100">
                                                <span>Atleta #1457 - Maria Costa (Estorno de Kit)</span>
                                                <span className="font-mono text-slate-400">04/08 10:45</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* SUB-ABA 1.3: LINHAS / AMARELO (DESTALHE DAS CÉLULAS ALTERADAS EM AMARELO) */}
                        {subTabAlteracoes === "LINHAS_AMARELO" && (
                            <Card className="border-amber-200 bg-amber-50/20 p-5 shadow-none space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
                                            <span className="h-3 w-3 rounded-full bg-amber-400 inline-block" /> Relatório de Alterações em Linhas (Destaque Amarelo)
                                        </h3>
                                        <p className="text-xs text-amber-800">
                                            Nesta visualização, as informações alteradas no sistema são exibidas com fundo amarelo destacado.
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleExportReport("LINHAS_AMARELO")}
                                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold"
                                    >
                                        <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Baixar Excel (Com Amarelo)
                                    </Button>
                                </div>

                                <div className="max-h-[500px] overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 bg-white">
                                    <table className="w-full text-left text-xs whitespace-nowrap">
                                        <thead className="sticky top-0 bg-slate-100 font-bold uppercase text-slate-600 border-b border-slate-200">
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
                                                <th className="p-3">Alerta</th>
                                                <th className="p-3">status_entrega</th>
                                                <th className="p-3">data_entrega</th>
                                                <th className="p-3">usuario_entrega</th>
                                                <th className="p-3">data_estorno</th>
                                                <th className="p-3">usuario_estorno</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {MOCK_ATHLETES_REPORT.map((athlete) => {
                                                const rowIsYellow = athlete.foiAlterado;
                                                const rowClass = rowIsYellow ? "bg-amber-100/80 text-amber-950 font-medium" : "hover:bg-slate-50 text-slate-700";

                                                return (
                                                    <tr key={athlete.num} className={rowClass}>
                                                        <td className="p-3 font-bold">#{athlete.num}</td>
                                                        <td className="p-3 font-semibold">{athlete.nomeAtleta}</td>
                                                        <td className="p-3">{athlete.kit}</td>
                                                        <td className="p-3">{athlete.distancia}</td>
                                                        <td className="p-3">{athlete.faixaEtaria}</td>
                                                        <td className="p-3">{athlete.categoriaEspecial}</td>
                                                        <td className="p-3">{athlete.nascimento}</td>
                                                        <td className="p-3">{athlete.sexo}</td>

                                                        {/* Destacar a célula se o campo específico foi alterado */}
                                                        <td className={`p-3 ${athlete.camposAlterados?.includes("equipe") ? "bg-amber-300 font-bold text-amber-950" : ""}`}>
                                                            {athlete.equipe}
                                                        </td>

                                                        <td className="p-3">{athlete.cidadeUf}</td>

                                                        <td className={`p-3 ${athlete.camposAlterados?.includes("camiseta") ? "bg-amber-300 font-bold text-amber-950" : ""}`}>
                                                            {athlete.camiseta}
                                                        </td>

                                                        <td className="p-3">{athlete.cpfAtleta}</td>
                                                        <td className="p-3">{athlete.cel}</td>
                                                        <td className="p-3">{athlete.email}</td>
                                                        <td className="p-3">{athlete.retirarKit}</td>
                                                        <td className="p-3">{athlete.notas}</td>
                                                        <td className="p-3">{athlete.alerta}</td>
                                                        <td className="p-3 font-bold">{athlete.statusEntrega}</td>
                                                        <td className="p-3 font-mono">{athlete.dataEntrega || "-"}</td>
                                                        <td className="p-3">{athlete.usuarioEntrega || "-"}</td>
                                                        <td className="p-3 font-mono">{athlete.dataEstorno || "-"}</td>
                                                        <td className="p-3">{athlete.usuarioEstorno || "-"}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}

                        {/* SUB-ABA 1.4: MODELO EXPORTAÇÃO (APENAS ATLETAS ALTERADOS) */}
                        {subTabAlteracoes === "MODELO_EXPORT" && (
                            <Card className="border-slate-200 p-5 shadow-none space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Modelo Exportação (Apenas Atletas Alterados)</h3>
                                        <p className="text-xs text-slate-500">Exibindo apenas cadastros que sofreram edições de dados.</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleExportReport("MODELO_EXPORT")}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                                    >
                                        <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Baixar Modelo Exportação
                                    </Button>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                    <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
                                        <thead className="bg-slate-100 font-bold uppercase text-slate-600 border-b border-slate-200">
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
                                            {MOCK_ATHLETES_REPORT.filter((a) => a.foiAlterado).map((athlete) => (
                                                <tr key={athlete.num} className="hover:bg-slate-50">
                                                    <td className="p-3 font-bold">#{athlete.num}</td>
                                                    <td className="p-3 font-semibold text-slate-900">{athlete.nomeAtleta}</td>
                                                    <td className="p-3">{athlete.distancia}</td>
                                                    <td className="p-3">{athlete.nascimento}</td>
                                                    <td className="p-3">{athlete.sexo}</td>
                                                    <td className="p-3">{athlete.equipe}</td>
                                                    <td className="p-3">{athlete.cidadeUf}</td>
                                                    <td className="p-3 font-bold text-blue-600">{athlete.camiseta}</td>
                                                    <td className="p-3">{athlete.cpfAtleta}</td>
                                                    <td className="p-3">{athlete.cel}</td>
                                                    <td className="p-3 text-slate-500">{athlete.notas}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}

                        {/* SUB-ABA 1.5: DADOS FULL */}
                        {subTabAlteracoes === "FULL" && (
                            <Card className="border-slate-200 p-5 shadow-none space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Relatório Dados Full (Exportação Completa)</h3>
                                        <p className="text-xs text-slate-500">Todas as colunas e registros cadastrados no sistema.</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleExportReport("FULL")}
                                        className="bg-blue-600 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold"
                                    >
                                        <Download className="h-4 w-4 mr-1.5" /> Baixar Planilha Completa (Full Excel)
                                    </Button>
                                </div>

                                <div className="max-h-[500px] overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 bg-white">
                                    <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
                                        <thead className="sticky top-0 bg-slate-100 font-bold uppercase text-slate-600 border-b border-slate-200">
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
                                            {MOCK_ATHLETES_REPORT.map((athlete) => (
                                                <tr key={athlete.num} className="hover:bg-slate-50">
                                                    <td className="p-3 font-bold">#{athlete.num}</td>
                                                    <td className="p-3 font-semibold">{athlete.nomeAtleta}</td>
                                                    <td className="p-3">{athlete.kit}</td>
                                                    <td className="p-3">{athlete.distancia}</td>
                                                    <td className="p-3">{athlete.faixaEtaria}</td>
                                                    <td className="p-3">{athlete.categoriaEspecial}</td>
                                                    <td className="p-3">{athlete.nascimento}</td>
                                                    <td className="p-3">{athlete.sexo}</td>
                                                    <td className="p-3">{athlete.equipe}</td>
                                                    <td className="p-3">{athlete.cidadeUf}</td>
                                                    <td className="p-3 font-bold text-blue-600">{athlete.camiseta}</td>
                                                    <td className="p-3">{athlete.cpfAtleta}</td>
                                                    <td className="p-3">{athlete.cel}</td>
                                                    <td className="p-3">{athlete.email}</td>
                                                    <td className="p-3">{athlete.retirarKit}</td>
                                                    <td className="p-3">{athlete.notas}</td>
                                                    <td className="p-3">{athlete.obs1}</td>
                                                    <td className="p-3">{athlete.obs2}</td>
                                                    <td className="p-3">{athlete.alerta}</td>
                                                    <td className="p-3">{athlete.nomeEvento}</td>
                                                    <td className="p-3 font-bold">{athlete.statusEntrega}</td>
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
                        )}
                    </div>
                )}

                {/* CONTEÚDO DA ABA 2: TABELA DINÂMICA, DASHBOARDS E GRÁFICOS */}
                {activeTab === "DINAMICO" && (
                    <div className="space-y-6">
                        {/* Painel de Filtros Globais */}
                        <Card className="border-slate-200 p-4 shadow-none space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase">
                                <Filter className="h-4 w-4 text-blue-600" /> Filtros Globais de Análise
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                                <div>
                                    <label className="text-slate-500 block mb-1">Modalidade</label>
                                    <select
                                        value={filterModalidade}
                                        onChange={(e) => setFilterModalidade(e.target.value)}
                                        className="w-full h-9 rounded-lg border border-slate-300 px-2 bg-white"
                                    >
                                        <option value="TODOS">Todas</option>
                                        <option value="5 KM">5 KM</option>
                                        <option value="10 KM">10 KM</option>
                                        <option value="21 KM">21 KM</option>
                                        <option value="42 KM">42 KM</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-slate-500 block mb-1">Sexo</label>
                                    <select
                                        value={filterSexo}
                                        onChange={(e) => setFilterSexo(e.target.value)}
                                        className="w-full h-9 rounded-lg border border-slate-300 px-2 bg-white"
                                    >
                                        <option value="TODOS">Todos</option>
                                        <option value="M">Masculino</option>
                                        <option value="F">Feminino</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-slate-500 block mb-1">Cidade</label>
                                    <select
                                        value={filterCidade}
                                        onChange={(e) => setFilterCidade(e.target.value)}
                                        className="w-full h-9 rounded-lg border border-slate-300 px-2 bg-white"
                                    >
                                        <option value="TODOS">Todas</option>
                                        <option value="Bauru/SP">Bauru/SP</option>
                                        <option value="São Paulo/SP">São Paulo/SP</option>
                                        <option value="Campinas/SP">Campinas/SP</option>
                                        <option value="Sorocaba/SP">Sorocaba/SP</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-slate-500 block mb-1">Camiseta</label>
                                    <select
                                        value={filterCamiseta}
                                        onChange={(e) => setFilterCamiseta(e.target.value)}
                                        className="w-full h-9 rounded-lg border border-slate-300 px-2 bg-white"
                                    >
                                        <option value="TODOS">Todas</option>
                                        <option value="P">P</option>
                                        <option value="M">M</option>
                                        <option value="G">G</option>
                                        <option value="GG">GG</option>
                                        <option value="XGG">XGG</option>
                                        <option value="Baby Look M">Baby Look M</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-slate-500 block mb-1">Faixa Etária</label>
                                    <select
                                        value={filterFaixaEtaria}
                                        onChange={(e) => setFilterFaixaEtaria(e.target.value)}
                                        className="w-full h-9 rounded-lg border border-slate-300 px-2 bg-white"
                                    >
                                        <option value="TODOS">Todas</option>
                                        <option value="25–29">25–29</option>
                                        <option value="30–34">30–34</option>
                                        <option value="35–39">35–39</option>
                                        <option value="40–44">40–44</option>
                                        <option value="51–60">51–60</option>
                                    </select>
                                </div>
                            </div>
                        </Card>

                        {/* Botões de Seleção do Relatório Dinâmico */}
                        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                            {[
                                { id: "MODALIDADE", label: "Rel - Modalidade" },
                                { id: "EQUIPE", label: "Rel - Equipe" },
                                { id: "CIDADE", label: "Rel - Cidade" },
                                { id: "CAMISETA", label: "Rel - Camiseta" },
                                { id: "SEXO", label: "Rel - Sexo" },
                                { id: "SEXO_DISTANCIA", label: "Rel - Sexo e Distância" },
                                { id: "IDADE", label: "Rel - Idade (Faixas)" },
                                { id: "ENTREGAS_HORA", label: "Rel - Entregas (Dia/Hora/Usuário)" },
                            ].map((btn) => (
                                <Button
                                    key={btn.id}
                                    size="sm"
                                    variant={subTabDinamico === btn.id ? "default" : "outline"}
                                    onClick={() => setSubTabDinamico(btn.id as "MODALIDADE" | "EQUIPE" | "CIDADE" | "CAMISETA" | "SEXO" | "SEXO_DISTANCIA" | "IDADE" | "ENTREGAS_HORA")}
                                    className="rounded-xl text-xs font-semibold"
                                >
                                    {btn.label}
                                </Button>
                            ))}
                        </div>

                        {/* VISUALIZAÇÕES DINÂMICAS */}
                        {subTabDinamico === "MODALIDADE" && (
                            <Card className="border-slate-200 p-5 shadow-none space-y-4">
                                <h3 className="text-base font-bold text-slate-900">Relatório por Modalidade / Distância</h3>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {statsModalidade.map((item) => (
                                        <div key={item.modalidade} className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
                                            <p className="text-xs font-bold text-blue-600 uppercase">{item.modalidade}</p>
                                            <p className="text-3xl font-black text-slate-900 mt-1">{item.total} atletas</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {subTabDinamico === "EQUIPE" && (
                            <Card className="border-slate-200 p-5 shadow-none space-y-4">
                                <h3 className="text-base font-bold text-slate-900">Ranking por Equipes / Assessorias</h3>
                                <div className="space-y-3">
                                    {statsEquipe.map((item) => (
                                        <div key={item.equipe} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                            <span className="font-bold text-slate-800">{item.equipe}</span>
                                            <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                                                {item.total} inscritos
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {subTabDinamico === "CIDADE" && (
                            <Card className="border-slate-200 p-5 shadow-none space-y-4">
                                <h3 className="text-base font-bold text-slate-900">Distribuição Geográfica por Cidade/UF</h3>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {statsCidade.map((item) => (
                                        <div key={item.cidade} className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                                            <p className="text-xs font-bold text-slate-500 uppercase">{item.cidade}</p>
                                            <p className="text-2xl font-bold text-slate-900 mt-1">{item.total} atletas</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {subTabDinamico === "CAMISETA" && (
                            <Card className="border-slate-200 p-5 shadow-none space-y-4">
                                <h3 className="text-base font-bold text-slate-900">Demanda por Tamanho de Camiseta</h3>
                                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                                    {statsCamiseta.map((item) => (
                                        <div key={item.tamanho} className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 text-center">
                                            <p className="text-xs font-bold text-indigo-700 uppercase">Tamanho {item.tamanho}</p>
                                            <p className="text-3xl font-black text-indigo-950 mt-1">{item.total}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {subTabDinamico === "SEXO" && (
                            <Card className="border-slate-200 p-5 shadow-none space-y-4">
                                <h3 className="text-base font-bold text-slate-900">Distribuição de Atletas por Sexo</h3>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200 text-center space-y-2">
                                        <p className="text-xs font-bold text-blue-600 uppercase">Masculino</p>
                                        <p className="text-4xl font-black text-blue-600">{statsSexo.masculino}</p>
                                        <p className="text-sm font-semibold text-blue-600">{statsSexo.pctM}% do total</p>
                                    </div>

                                    <div className="p-6 rounded-2xl bg-pink-50 border border-pink-200 text-center space-y-2">
                                        <p className="text-xs font-bold text-pink-700 uppercase">Feminino</p>
                                        <p className="text-4xl font-black text-pink-900">{statsSexo.feminino}</p>
                                        <p className="text-sm font-semibold text-pink-600">{statsSexo.pctF}% do total</p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {subTabDinamico === "SEXO_DISTANCIA" && (
                            <Card className="border-slate-200 p-5 shadow-none space-y-4">
                                <h3 className="text-base font-bold text-slate-900">Matriz Cruzada: Sexo × Distância</h3>
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100 font-bold uppercase text-slate-600 border-b border-slate-200">
                                            <tr>
                                                <th className="p-3">Distância / Prova</th>
                                                <th className="p-3">Masculino (M)</th>
                                                <th className="p-3">Feminino (F)</th>
                                                <th className="p-3 font-black">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {statsSexoDistancia.map((row) => (
                                                <tr key={row.distancia} className="hover:bg-slate-50">
                                                    <td className="p-3 font-bold text-slate-900">{row.distancia}</td>
                                                    <td className="p-3 text-blue-600 font-semibold">{row.m} atletas</td>
                                                    <td className="p-3 text-pink-700 font-semibold">{row.f} atletas</td>
                                                    <td className="p-3 font-black text-slate-900 bg-slate-50">{row.total} atletas</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}

                        {subTabDinamico === "IDADE" && (
                            <Card className="border-slate-200 p-5 shadow-none space-y-4">
                                <h3 className="text-base font-bold text-slate-900">Distribuição por Faixas de Idade</h3>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {statsFaixaEtaria.map((item) => (
                                        <div key={item.faixa} className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                                            <p className="text-xs font-bold text-emerald-800 uppercase">{item.faixa}</p>
                                            <p className="text-3xl font-black text-emerald-950 mt-1">{item.total} atletas</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {subTabDinamico === "ENTREGAS_HORA" && (
                            <Card className="border-slate-200 p-5 shadow-none space-y-4">
                                <h3 className="text-base font-bold text-slate-900">Relatório de Entregas por Dia/Hora e Operador</h3>
                                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100 font-bold uppercase text-slate-600 border-b border-slate-200">
                                            <tr>
                                                <th className="p-3">Intervalo de Horário</th>
                                                <th className="p-3">Operador / Atendente</th>
                                                <th className="p-3 font-bold">Total de Kits Entregues</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {statsEntregasHora.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="p-3 font-mono font-bold text-slate-800">{row.hora}</td>
                                                    <td className="p-3 font-medium text-slate-900">{row.operador}</td>
                                                    <td className="p-3 font-black text-emerald-600 bg-emerald-50/50">{row.entregas} kits</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
