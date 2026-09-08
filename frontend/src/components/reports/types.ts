"use client";

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

export type ReportFieldKey =
    | "num" | "nomeAtleta" | "kit" | "distancia" | "faixaEtaria" | "categoriaEspecial"
    | "nascimento" | "sexo" | "equipe" | "cidadeUf" | "camiseta" | "cpfAtleta"
    | "cel" | "email" | "retirarKit" | "notas" | "obs1" | "obs2" | "alerta"
    | "nomeEvento" | "statusEntrega" | "dataEntrega" | "usuarioEntrega" | "obsEntrega"
    | "dataEstorno" | "usuarioEstorno";

export type ReportField = { key: ReportFieldKey; label: string };
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

export const REPORT_FIELDS: ReportField[] = [
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

export const UPDATE_MODEL_FIELD_KEYS: ReportFieldKey[] = [
    "num", "nomeAtleta", "distancia", "nascimento", "sexo", "equipe", "cidadeUf", "camiseta", "cpfAtleta", "cel", "notas",
];

export const getReportFieldValue = (athlete: AthleteReportRecord, key: ReportFieldKey) => String(athlete[key] ?? "");

export const normalizeColumnName = (value: string) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const parseCsvLine = (line: string, delimiter: string) => {
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

export const MOCK_AUDIT_LOGS: AuditLogItem[] = [
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

export const MOCK_ATHLETES_REPORT: AthleteReportRecord[] = [
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
