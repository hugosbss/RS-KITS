"use client";

import { useState, useMemo } from "react";
import {
    Activity,
    BarChart3,
    Download,
    FileSpreadsheet,
    PieChart,
    Printer,
    Upload,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

type ReportFieldKey =
    | "num" | "nomeAtleta" | "kit" | "distancia" | "faixaEtaria" | "categoriaEspecial"
    | "nascimento" | "sexo" | "equipe" | "cidadeUf" | "camiseta" | "cpfAtleta"
    | "cel" | "email" | "retirarKit" | "notas" | "obs1" | "obs2" | "alerta"
    | "nomeEvento" | "statusEntrega" | "dataEntrega" | "usuarioEntrega" | "obsEntrega"
    | "dataEstorno" | "usuarioEstorno";

type ReportField = { key: ReportFieldKey; label: string };
export type AthleteUpdate = {
    athleteNum: string;
    athleteCpf: string;
    fields: Array<{ field: ReportFieldKey; before: string; after: string }>;
};

export interface ReportShellProps {
    /** Substitua os dados demonstrativos pelos atletas carregados da API. */
    initialAthletes?: AthleteReportRecord[];
    /** Ponto de integração para persistir as alterações na API quando ela estiver disponível. */
    onApplyAthleteUpdates?: (updates: AthleteUpdate[]) => void | Promise<void>;
}

const REPORT_FIELDS: ReportField[] = [
    { key: "num", label: "NUM" }, { key: "nomeAtleta", label: "Nome Atleta" },
    { key: "kit", label: "KIT" }, { key: "distancia", label: "Modalidade" },
    { key: "faixaEtaria", label: "Faixa Etária" }, { key: "categoriaEspecial", label: "Categoria Especial" },
    { key: "nascimento", label: "Nascimento" }, { key: "sexo", label: "Sexo" },
    { key: "equipe", label: "Equipe" }, { key: "cidadeUf", label: "Cidade / UF" },
    { key: "camiseta", label: "Camiseta" }, { key: "cpfAtleta", label: "CPF Atleta" },
    { key: "cel", label: "Celular" }, { key: "email", label: "E-mail" },
    { key: "retirarKit", label: "Retirar KIT" }, { key: "notas", label: "Notas" },
    { key: "obs1", label: "Obs1" }, { key: "obs2", label: "Obs2" },
    { key: "alerta", label: "Alerta" }, { key: "nomeEvento", label: "Nome Evento" },
    { key: "statusEntrega", label: "Status da Entrega" }, { key: "dataEntrega", label: "Data Entrega" },
    { key: "usuarioEntrega", label: "Usuário Entrega" }, { key: "obsEntrega", label: "Obs. Entrega" },
    { key: "dataEstorno", label: "Data Estorno" }, { key: "usuarioEstorno", label: "Usuário Estorno" },
];

const UPDATE_MODEL_FIELD_KEYS: ReportFieldKey[] = [
    "num", "nomeAtleta", "distancia", "nascimento", "sexo", "equipe", "cidadeUf", "camiseta", "cpfAtleta", "cel", "notas",
];

const getReportFieldValue = (athlete: AthleteReportRecord, key: ReportFieldKey) => String(athlete[key] ?? "");

const normalizeColumnName = (value: string) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const parseCsvLine = (line: string, delimiter: string) => {
    const values: string[] = [];
    let value = "";
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        if (character === '"') {
            if (quoted && line[index + 1] === '"') {
                value += '"';
                index += 1;
            } else {
                quoted = !quoted;
            }
        } else if (character === delimiter && !quoted) {
            values.push(value.trim());
            value = "";
        } else {
            value += character;
        }
    }
    values.push(value.trim());
    return values;
};

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

export function ReportShell({ initialAthletes, onApplyAthleteUpdates }: ReportShellProps) {
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
    const [reportAthletes, setReportAthletes] = useState<AthleteReportRecord[]>(() => initialAthletes ?? MOCK_ATHLETES_REPORT);
    const [importSummary, setImportSummary] = useState<{ updated: number; unchanged: number; notFound: number; fieldsChanged: number } | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Relação de entrega: o operador define as colunas que farão parte da planilha final.
    const [deliveryRelationFields, setDeliveryRelationFields] = useState<ReportFieldKey[]>([
        "num", "nomeAtleta", "distancia", "kit", "camiseta", "retirarKit", "statusEntrega", "dataEntrega",
    ]);
    const [isDeliveryRelationGenerated, setIsDeliveryRelationGenerated] = useState(false);

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
            });
            setReportAthletes(next);

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
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400"></p>
                        <h1 className="text-xl font-medium text-slate-900 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" /> Relatórios
                        </h1>
                        <p className="text-xs text-slate-500">Maratona Internacional 2027 · São Paulo, SP</p>
                    </div>
                </div>
            </header>

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

                        {/* SUB-ABA 1.1: ESTATÍCO / HISTÓRICO RECENTE */}
                        {subTabAlteracoes === "ESTATICO" && (
                            <Card className="border-slate-200 p-5 shadow-none space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-medium text-slate-900">Histórico Estático de Alterações Recentes</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleExportReport("AGRUPADO")}
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
                                            {MOCK_AUDIT_LOGS.map((log) => (
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
                        )}
                        
                        {/* SUB-ABA 1.4: MODELO EXPORTAÇÃO (APENAS ATLETAS ALTERADOS) */}
                        {subTabAlteracoes === "MODELO_EXPORT" && (
                            <Card className="border-slate-200 p-5 shadow-none space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-medium text-slate-900">Modelo Exportação (Apenas Atletas Alterados)</h3>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleExportReport("MODELO_EXPORT")}
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
                                            {MOCK_ATHLETES_REPORT.filter((a) => a.foiAlterado).map((athlete) => (
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
                        )}

                        {/* SUB-ABA 1.5: DADOS FULL */}
                        {subTabAlteracoes === "FULL" && (
                            <Card className="border-slate-200 p-5 shadow-none space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-medium text-slate-900">Relatório Dados Full (Exportação Completa)</h3>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleExportReport("FULL")}
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
                                            {MOCK_ATHLETES_REPORT.map((athlete) => (
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
                        )}
                    </div>
                )}

                {activeTab === "MODELO_ATUALIZACAO" && (
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
                )}

                {activeTab === "RELACAO_ENTREGA" && (
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
                )}
            </main>
        </div>
    );
}
