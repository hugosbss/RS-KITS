export type DeliveryStatus = "PENDENTE" | "ENTREGUE" | "ESTORNADO";
export type AthleteStatusFilter = DeliveryStatus | "TODOS";

export interface Athlete {
    id: string;
    pin?: string;
    num: string;
    nome: string;
    cpf: string;
    sexo: "M" | "F";
    nascimento: string;
    cidadeUf: string;
    equipe: string;
    distancia: string;
    kit: string;
    faixaEtaria: string;
    categoriaEspecial: string;
    camiseta: string;
    celular: string;
    email: string;
    alerta: string;
    status: DeliveryStatus;

    // Dados de entrega
    dataEntrega?: string;
    usuarioEntrega?: string;
    obsEntrega?: string;
    nomeEntrega?: string;
    cpfEntrega?: string;
    foneEntrega?: string;
    emailEntrega?: string;
    terceiro?: boolean;

    // Dados de estorno
    dataEstorno?: string;
    usuarioEstorno?: string;

    // Informações médicas e de emergência - Saúde
    convenioMedico?: string;
    tipoSanguineo?: string;
    contatoEmergencia?: string;
    relacaoAtleta?: string;
    telefoneEmergencia?: string;
}

export const INITIAL_ATHLETES: Athlete[] = [
    {
        id: "1",
        pin: "1001",
        num: "1455",
        nome: "João Carlos da Silva",
        cpf: "123.456.789-00",
        sexo: "M",
        nascimento: "12/04/1989",
        cidadeUf: "Bauru/SP",
        equipe: "Runners Club",
        distancia: "10 KM",
        kit: "Kit Padrão",
        faixaEtaria: "35–39",
        categoriaEspecial: "Não",
        camiseta: "G",
        celular: "(14) 99876-5432",
        email: "joao.carlos@email.com",
        alerta: "Pendência de documento",
        status: "PENDENTE",

        convenioMedico: "AMIL",
        tipoSanguineo: "A+",
        contatoEmergencia: "Maria Silva",
        relacaoAtleta: "Treinador",
        telefoneEmergencia: "(14) 99876-5432",
    },
    {
        id: "2",
        pin: "1002",
        num: "1456",
        nome: "Pedro Alves de Souza",
        cpf: "234.567.890-11",
        sexo: "M",
        nascimento: "05/08/1992",
        cidadeUf: "São Paulo/SP",
        equipe: "Pace Makers",
        distancia: "21 KM",
        kit: "Kit VIP",
        faixaEtaria: "30–34",
        categoriaEspecial: "Não",
        camiseta: "M",
        celular: "(11) 98765-4321",
        email: "pedro.alves@email.com",
        alerta: "",
        status: "ENTREGUE",
        dataEntrega: "04/08/2026 10:23",
        usuarioEntrega: "Carlos Operador",
        nomeEntrega: "Pedro Alves de Souza",
        cpfEntrega: "234.567.890-11",
        foneEntrega: "(11) 98765-4321",
        emailEntrega: "pedro.alves@email.com",
        terceiro: false,

        convenioMedico: "AMIL",
        tipoSanguineo: "A+",
        contatoEmergencia: "Maria Silva",
        relacaoAtleta: "Treinador",
        telefoneEmergencia: "(14) 99876-5432",
    },
    {
        id: "3",
        pin: "1003",
        num: "1457",
        nome: "Maria Costa Ribeiro",
        cpf: "345.678.901-22",
        sexo: "F",
        nascimento: "18/11/1985",
        cidadeUf: "Campinas/SP",
        equipe: "Runners Club",
        distancia: "5 KM",
        kit: "Kit Padrão",
        faixaEtaria: "40–44",
        categoriaEspecial: "Não",
        camiseta: "P",
        celular: "(19) 97654-3210",
        email: "maria.costa@email.com",
        alerta: "Pendência de documento",
        status: "ESTORNADO",
        dataEntrega: "04/08/2026 09:15",
        usuarioEntrega: "Fernanda Operadora",
        nomeEntrega: "Maria Costa Ribeiro",
        cpfEntrega: "345.678.901-22",
        foneEntrega: "(19) 97654-3210",
        emailEntrega: "maria.costa@email.com",
        dataEstorno: "04/08/2026 10:45",
        usuarioEstorno: "Supervisão Ana",

        convenioMedico: "AMIL",
        tipoSanguineo: "A+",
        contatoEmergencia: "Maria Silva",
        relacaoAtleta: "Treinador",
        telefoneEmergencia: "(14) 99876-5432",
    },
    {
        id: "4",
        pin: "1004",
        num: "1458",
        nome: "Ana Beatriz Lima",
        cpf: "456.789.012-33",
        sexo: "F",
        nascimento: "22/01/1998",
        cidadeUf: "Bauru/SP",
        equipe: "Sprint Team",
        distancia: "10 KM",
        kit: "Kit Padrão",
        faixaEtaria: "25–29",
        categoriaEspecial: "Não",
        camiseta: "M",
        celular: "(14) 99123-4567",
        email: "ana.lima@email.com",
        alerta: "",
        status: "PENDENTE",

        convenioMedico: "AMIL",
        tipoSanguineo: "A+",
        contatoEmergencia: "Maria Silva",
        relacaoAtleta: "Treinador",
        telefoneEmergencia: "(14) 99876-5432",
    },
    {
        id: "5",
        pin: "1005",
        num: "1459",
        nome: "Carlos Eduardo Santos",
        cpf: "567.890.123-44",
        sexo: "M",
        nascimento: "30/03/1975",
        cidadeUf: "Sorocaba/SP",
        equipe: "Avulso",
        distancia: "42 KM",
        kit: "Kit Premium",
        faixaEtaria: "50–54",
        categoriaEspecial: "Master",
        camiseta: "GG",
        celular: "(15) 98111-2233",
        email: "carlos.santos@email.com",
        alerta: "",
        status: "PENDENTE",

        convenioMedico: "AMIL",
        tipoSanguineo: "A+",
        contatoEmergencia: "Maria Silva",
        relacaoAtleta: "Treinador",
        telefoneEmergencia: "(14) 99876-5432",
    },
    {
        id: "6",
        pin: "1006",
        num: "1460",
        nome: "Fernanda Oliveira Rossi",
        cpf: "678.901.234-55",
        sexo: "F",
        nascimento: "14/07/1990",
        cidadeUf: "São Paulo/SP",
        equipe: "Pace Makers",
        distancia: "21 KM",
        kit: "Kit VIP",
        faixaEtaria: "35–39",
        categoriaEspecial: "Não",
        camiseta: "Baby Look M",
        celular: "(11) 97222-3344",
        email: "fernanda.rossi@email.com",
        alerta: "",
        status: "ENTREGUE",
        dataEntrega: "04/08/2026 11:10",
        usuarioEntrega: "Carlos Operador",
        nomeEntrega: "Roberto Rossi (Esposo)",
        cpfEntrega: "789.012.345-66",
        foneEntrega: "(11) 97222-9999",
        emailEntrega: "roberto@email.com",
        terceiro: true,

        convenioMedico: "AMIL",
        tipoSanguineo: "A+",
        contatoEmergencia: "Maria Silva",
        relacaoAtleta: "Treinador",
        telefoneEmergencia: "(14) 99876-5432",
    },
];
