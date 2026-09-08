"use client";

export interface ImportedRow {
    id: string;
    num: string;
    nomeAtleta: string;
    kit: string;
    modalidade: string;
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
    contato?: string;
    grauParentesco?: string;
    celularContato?: string;
    pin?: string;
    itensAdicionais?: string;
    statusEntrega?: "PENDENTE" | "ENTREGUE" | "ESTORNADO";
    dataEntrega?: string;
    usuarioEntrega?: string;
    obsEntrega?: string;
    dataEstorno?: string;
    usuarioEstorno?: string;
    nomeEntrega?: string;
    cpfEntrega?: string;
    foneEntrega?: string;
    emailEntrega?: string;
    terceiro?: boolean;
    statusValidacao: "VALIDO" | "ATENÇÃO" | "ERRO";
}

export const TEMPLATE_HEADERS = [
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
    "Contato",
    "Grau Parentesco",
    "NºCelular",
    "PIN",
    "itens adicionais",
];

export const INITIAL_MOCK_PREVIEW: ImportedRow[] = [
    {
        id: "imp-1",
        num: "1455",
        nomeAtleta: "João Carlos da Silva",
        kit: "Kit Padrão",
        modalidade: "10 KM",
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
        modalidade: "21 KM",
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
        modalidade: "5 KM",
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
        statusValidacao: "ATENÇÃO",
    },
];
