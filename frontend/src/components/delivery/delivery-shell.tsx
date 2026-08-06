"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock3,
    ContactRound,
    Edit,
    FileText,
    Filter,
    Layers,
    LogOut,
    MapPin,
    Monitor,
    PackageCheck,
    Plus,
    QrCode,
    RefreshCw,
    RotateCcw,
    Search,
    ShieldAlert,
    Sparkles,
    Trash2,
    Trophy,
    UserRound,
    Users,
    Wifi,
    WifiOff,
    X,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clearAuth, getUser, type AuthUser } from "@/services/auth.service";

export type DeliveryStatus = "PENDENTE" | "ENTREGUE" | "ESTORNADO";
type AthleteStatusFilter = DeliveryStatus | "TODOS";
type DeliveryView = "OPERADOR" | "SEGUNDA_TELA";

export interface Athlete {
    id: string;
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
    nomeEntrega?: string;
    cpfEntrega?: string;
    foneEntrega?: string;
    emailEntrega?: string;
    terceiro?: boolean;

    // Dados de estorno
    dataEstorno?: string;
    usuarioEstorno?: string;
}

const INITIAL_ATHLETES: Athlete[] = [
    {
        id: "1",
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
    },
    {
        id: "2",
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
    },
    {
        id: "3",
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
    },
    {
        id: "4",
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
    },
    {
        id: "5",
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
    },
    {
        id: "6",
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
    },
];

export function DeliveryShell() {
    const router = useRouter();

    const [user, setUser] = useState<AuthUser | null>(null);
    const [online, setOnline] = useState(true);
    const [query, setQuery] = useState("");
    const [eventName, setEventName] = useState("Maratona Internacional 2027");

    // Estado da lista de atletas
    const [athletes, setAthletes] = useState<Athlete[]>(INITIAL_ATHLETES);
    const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
    const [statusFilter, setStatusFilter] = useState<AthleteStatusFilter>("TODOS");
    const [activeView, setActiveView] = useState<DeliveryView>("OPERADOR");

    // Modal de Entrega/Ficha do Atleta
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);

    // Estados da entrega (modal)
    const [isThirdParty, setIsThirdParty] = useState(false);
    const [thirdPartyForm, setThirdPartyForm] = useState({
        nome: "",
        cpf: "",
        fone: "",
        email: "",
    });

    // Demais Modais
    const [showEventModal, setShowEventModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showRaffleModal, setShowRaffleModal] = useState(false);
    const [showEditAthleteModal, setShowEditAthleteModal] = useState(false);
    const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);

    // Filtros de sorteio
    const [raffleFilterCategory, setRaffleFilterCategory] = useState("TODOS");
    const [raffleFilterAge, setRaffleFilterAge] = useState("TODOS");
    const [raffleFilterCity, setRaffleFilterCity] = useState("TODOS");
    const [raffleWinner, setRaffleWinner] = useState<Athlete | null>(null);
    const [isRaffling, setIsRaffling] = useState(false);

    // Lista de equipes cadastradas
    const existingTeams = useMemo(() => {
        const set = new Set(athletes.map((a) => a.equipe).filter(Boolean));
        return Array.from(set);
    }, [athletes]);

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

    // Estatísticas
    const stats = useMemo(() => {
        const total = athletes.length;
        const entregues = athletes.filter((a) => a.status === "ENTREGUE").length;
        const estornados = athletes.filter((a) => a.status === "ESTORNADO").length;
        const pendentes = athletes.filter((a) => a.status === "PENDENTE").length;
        const pct = total > 0 ? Math.round((entregues / total) * 100) : 0;
        return { total, entregues, estornados, pendentes, pct };
    }, [athletes]);

    // Atletas filtrados pela busca
    const filteredAthletes = useMemo(() => {
        const byStatus = statusFilter === "TODOS" ? athletes : athletes.filter((athlete) => athlete.status === statusFilter);
        if (!query.trim()) return byStatus;
        const q = query.toLowerCase().trim();
        return byStatus.filter((athlete) => athlete.nome.toLowerCase().includes(q) || athlete.num.toLowerCase().includes(q) || athlete.cpf.toLowerCase().includes(q) || athlete.cidadeUf.toLowerCase().includes(q) || athlete.equipe.toLowerCase().includes(q));
    }, [athletes, query, statusFilter]);

    const toggleStatusFilter = (status: DeliveryStatus) => setStatusFilter((current) => current === status ? "TODOS" : status);
    const showAthleteOnSecondScreen = () => { if (!selectedAthlete) return; setShowDeliveryModal(false); setActiveView("SEGUNDA_TELA"); };

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
                Carregando sistema de entrega...
            </div>
        );
    }

    // Ação de seleção do atleta -> ABRE O MODAL DE ENTREGA
    if (activeView === "SEGUNDA_TELA" && selectedAthlete) {
        const personalDetails = [
            ["CPF do atleta", selectedAthlete.cpf], ["Nascimento", selectedAthlete.nascimento], ["Sexo", selectedAthlete.sexo], ["Celular", selectedAthlete.celular], ["E-mail", selectedAthlete.email], ["Cidade / UF", selectedAthlete.cidadeUf], ["Modalidade / Distância", selectedAthlete.distancia], ["Categoria", selectedAthlete.categoriaEspecial], ["Equipe / Assessoria", selectedAthlete.equipe], ["Faixa et?ria", selectedAthlete.faixaEtaria],
        ];
        return <div className="min-h-screen bg-slate-950 p-4 text-white sm:p-8"><section className="mx-auto max-w-6xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8"><div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Conferência de cadastro</p><h1 className="mt-1 text-2xl font-black">Informações do atleta</h1></div><Button variant="outline" onClick={() => setActiveView("OPERADOR")} className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white">Voltar</Button></div><div className="mt-6 grid gap-5 lg:grid-cols-[220px_1fr]"><div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/15 p-6 text-center"><p className="text-xs font-bold uppercase tracking-wider text-blue-300">Número do atleta</p><p className="mt-2 text-6xl font-black text-blue-300">#{selectedAthlete.num}</p></div><div className="rounded-2xl border border-slate-700 bg-slate-800 p-6"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Nome completo</p><h2 className="mt-2 text-3xl font-black">{selectedAthlete.nome}</h2><div className="mt-6 grid gap-4 sm:grid-cols-2">{personalDetails.slice(0,4).map(([label,value]) => <div key={label}><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div></div></div><div className="mt-5 grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-5 sm:grid-cols-2 lg:grid-cols-3">{personalDetails.slice(4).map(([label,value]) => <div key={label}><p className="text-xs text-slate-400">{label}</p><p className="mt-1 font-bold">{value}</p></div>)}<div><p className="text-xs text-slate-400">Kit</p><p className="mt-1 font-bold">{selectedAthlete.kit}</p></div><div><p className="text-xs text-slate-400">Camiseta</p><p className="mt-1 text-xl font-black text-amber-400">{selectedAthlete.camiseta}</p></div><div><p className="text-xs text-slate-400">Status da retirada</p><p className="mt-1 font-black text-blue-300">{selectedAthlete.status === "PENDENTE" ? "PRONTO PARA RETIRADA" : selectedAthlete.status}</p></div></div></section></div>;
    }

    const selectAthleteForDelivery = (athlete: Athlete) => {
        setSelectedAthlete(athlete);
        setIsThirdParty(!!athlete.terceiro);
        setThirdPartyForm({
            nome: athlete.nomeEntrega || "",
            cpf: athlete.cpfEntrega || "",
            fone: athlete.foneEntrega || "",
            email: athlete.emailEntrega || "",
        });
        setShowDeliveryModal(true);
    };

    // Confirmar entrega do kit
    const handleDeliverKit = () => {
        if (!selectedAthlete) return;

        const now = new Date().toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        const updated: Athlete = {
            ...selectedAthlete,
            status: "ENTREGUE",
            dataEntrega: now,
            usuarioEntrega: user.name,
            terceiro: isThirdParty,
            nomeEntrega: isThirdParty ? thirdPartyForm.nome || "Terceiro" : selectedAthlete.nome,
            cpfEntrega: isThirdParty ? thirdPartyForm.cpf || selectedAthlete.cpf : selectedAthlete.cpf,
            foneEntrega: isThirdParty ? thirdPartyForm.fone || selectedAthlete.celular : selectedAthlete.celular,
            emailEntrega: isThirdParty ? thirdPartyForm.email || selectedAthlete.email : selectedAthlete.email,
        };

        setAthletes((prev) => prev.map((a) => (a.id === selectedAthlete.id ? updated : a)));
        setSelectedAthlete(updated);
        setShowDeliveryModal(false);
    };

    // Estornar entrega do kit
    const handleReverseDelivery = (athleteId: string) => {
        const now = new Date().toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        setAthletes((prev) =>
            prev.map((a) => {
                if (a.id === athleteId) {
                    return {
                        ...a,
                        // Ao estornar, retornamos o atleta ao status PENDENTE
                        // e limpamos os dados de entrega para permitir nova retirada.
                        status: "PENDENTE",
                        dataEstorno: now,
                        usuarioEstorno: user.name,
                        dataEntrega: undefined,
                        usuarioEntrega: undefined,
                        nomeEntrega: undefined,
                        cpfEntrega: undefined,
                        foneEntrega: undefined,
                        emailEntrega: undefined,
                        terceiro: false,
                    };
                }
                return a;
            })
        );

        if (selectedAthlete?.id === athleteId) {
            setSelectedAthlete((prev) =>
                prev
                    ? {
                          ...prev,
                          status: "PENDENTE",
                          dataEstorno: now,
                          usuarioEstorno: user.name,
                          dataEntrega: undefined,
                          usuarioEntrega: undefined,
                          nomeEntrega: undefined,
                          cpfEntrega: undefined,
                          foneEntrega: undefined,
                          emailEntrega: undefined,
                          terceiro: false,
                      }
                    : null
            );
        }
        setShowDeliveryModal(false);
    };

    // Zerar todas as alterações e entregas
    const handleResetAllDeliveries = () => {
        setAthletes(
            INITIAL_ATHLETES.map((a) => ({
                ...a,
                status: "PENDENTE",
                dataEntrega: undefined,
                usuarioEntrega: undefined,
                dataEstorno: undefined,
                usuarioEstorno: undefined,
            }))
        );
        setSelectedAthlete(null);
        setShowResetModal(false);
    };

    // Realizar Sorteio
    const handleRunRaffle = () => {
        setIsRaffling(true);
        setRaffleWinner(null);

        let pool = [...athletes];
        if (raffleFilterCategory !== "TODOS") {
            pool = pool.filter((a) => a.distancia === raffleFilterCategory);
        }
        if (raffleFilterAge !== "TODOS") {
            pool = pool.filter((a) => a.faixaEtaria === raffleFilterAge);
        }
        if (raffleFilterCity !== "TODOS") {
            pool = pool.filter((a) => a.cidadeUf === raffleFilterCity);
        }

        if (pool.length === 0) {
            setIsRaffling(false);
            alert("Nenhum atleta encontrado com os filtros selecionados.");
            return;
        }

        let stepCount = 0;
        const interval = setInterval(() => {
            const tempIdx = Math.floor(Math.random() * pool.length);
            setRaffleWinner(pool[tempIdx]);
            stepCount++;
            if (stepCount >= 15) {
                clearInterval(interval);
                const finalIdx = Math.floor(Math.random() * pool.length);
                setRaffleWinner(pool[finalIdx]);
                setIsRaffling(false);
            }
        }, 120);
    };

    // Salvar edição do atleta
    const handleSaveAthleteEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAthlete) return;

        setAthletes((prev) => prev.map((a) => (a.id === editingAthlete.id ? editingAthlete : a)));
        if (selectedAthlete?.id === editingAthlete.id) {
            setSelectedAthlete(editingAthlete);
        }
        setShowEditAthleteModal(false);
        setEditingAthlete(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <Sidebar />

            {/* Cabeçalho */}
            <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur lg:ml-64">
                <div className="flex flex-col gap-3 p-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Evento Atual</p>
                        <button
                            onClick={() => setShowEventModal(true)}
                            className="group flex items-center gap-1.5 text-lg font-bold text-slate-900 hover:text-blue-600 transition"
                        >
                            {eventName}
                            <Edit className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                        </button>
                        <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <MapPin className="h-3.5 w-3.5" /> São Paulo, SP · 15 de agosto
                        </p>
                    </div>

                    {/* Botões de Ação do Topo */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowRaffleModal(true)}
                            className="bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 font-semibold"
                        >
                            <Trophy className="h-4 w-4 text-amber-600 mr-1" /> Realizar SORTEIO
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowResetModal(true)}
                            className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-semibold"
                        >
                            <Trash2 className="h-4 w-4 text-rose-600 mr-1" /> Zerar Entregas
                        </Button>

                        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

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

            {/* Conteúdo Principal */}
            <main className="p-4 sm:p-6 lg:ml-64 lg:p-8 space-y-6">
                {/* Linha/Bloco de Status e Métricas do Evento */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-4 border-slate-200 shadow-none flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase">Total Atletas</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <Users className="h-5 w-5" />
                        </div>
                    </Card>

                    <Card className="p-4 border-emerald-200 bg-emerald-50/40 shadow-none flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-emerald-700 uppercase">Kits Entregues</p>
                            <p className="text-2xl font-bold text-emerald-700">{stats.entregues}</p>
                            <p className="text-xs text-emerald-600 font-medium">{stats.pct}% do total</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <PackageCheck className="h-5 w-5" />
                        </div>
                    </Card>

                    <Card className="p-4 border-amber-200 bg-amber-50/40 shadow-none flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-amber-800 uppercase">Estornados</p>
                            <p className="text-2xl font-bold text-amber-800">{stats.estornados}</p>
                            <p className="text-xs text-amber-700 font-medium">Reversões efetuadas</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                            <RotateCcw className="h-5 w-5" />
                        </div>
                    </Card>

                    <Card className="p-4 border-blue-200 bg-blue-50/40 shadow-none flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-blue-600 uppercase">Pendentes de Entrega</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.pendentes}</p>
                            <p className="text-xs text-blue-600 font-medium">Aguardando na fila</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <Clock3 className="h-5 w-5" />
                        </div>
                    </Card>
                </div>

                {/* BLOCO DE BUSCA JUNTO COM A TABELA (LAYOUT COMPACTO E DIRETO) */}
                <Card className="border-slate-200 p-5 shadow-none space-y-4">
                    {/* Barra de Pesquisa Integrada à Tabela */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && filteredAthletes[0]) {
                                        selectAthleteForDelivery(filteredAthletes[0]);
                                    }
                                }}
                                placeholder="Buscar atleta por Nome, Número, CPF ou Cidade..."
                                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-sm outline-none ring-blue-5000 focus:ring-2"
                                autoFocus
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                onClick={() => {
                                    if (filteredAthletes[0]) selectAthleteForDelivery(filteredAthletes[0]);
                                }}
                                className="h-12 rounded-xl px-6 flex-1 sm:flex-none"
                            >
                                <Search className="h-4 w-4 mr-1.5" /> Buscar
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (athletes[0]) selectAthleteForDelivery(athletes[0]);
                                }}
                                className="h-12 rounded-xl px-4 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                                <QrCode className="h-5 w-5 mr-1.5" /> QR Code
                            </Button>
                        </div>
                    </div>

                    {/* Cabeçalho da Tabela e Legendas */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Lista de Atletas do Evento</h3>
                            <p className="text-xs text-slate-500">
                                Exibindo {filteredAthletes.length} de {athletes.length} atletas. Selecione um atleta e abra a conferência na segunda tela.
                            </p>
                            <Button variant="outline" size="sm" disabled={!selectedAthlete} onClick={showAthleteOnSecondScreen} className="mt-3 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40">
                                <Monitor className="mr-1.5 h-4 w-4" /> Exibir na Segunda Tela
                            </Button>
                        </div>

                        {/* Filtros de status */}
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                            {(["ENTREGUE", "ESTORNADO", "PENDENTE"] as DeliveryStatus[]).map((status) => <button key={status} type="button" aria-pressed={statusFilter === status} onClick={() => toggleStatusFilter(status)} className={"inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 " + (statusFilter === status ? "bg-slate-700 text-white border-slate-700" : "bg-slate-100 text-slate-700 border-slate-200")}><span className={"h-2 w-2 rounded-full " + (status === "ENTREGUE" ? "bg-emerald-500" : status === "ESTORNADO" ? "bg-amber-500" : "bg-slate-400")} /> {status === "ENTREGUE" ? "Entregues" : status === "ESTORNADO" ? "Estornados" : "Pendentes"} ({status === "ENTREGUE" ? stats.entregues : status === "ESTORNADO" ? stats.estornados : stats.pendentes})</button>)}
                            {statusFilter !== "TODOS" && <button type="button" onClick={() => setStatusFilter("TODOS")} className="px-2 py-1 text-slate-500 underline">Limpar filtro</button>}
                        </div>
                    </div>

                    {/* Tabela de Atletas */}
                    <div className="max-h-[550px] overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
                            <thead className="sticky top-0 z-10 bg-slate-100 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="p-3">NUM</th>
                                    <th className="p-3">Nome Atleta</th>
                                    {/* <th className="p-3">CPF</th> */}
                                    <th className="p-3">Sexo</th>
                                    <th className="p-3">Nascimento</th>
                                    <th className="p-3">Cidade/UF</th>
                                    <th className="p-3">Equipe</th>
                                    <th className="p-3">Distância</th>
                                    <th className="p-3">KIT</th>
                                    {/* <th className="p-3">Fx. Etária</th> */}
                                    {/* <th className="p-3">Cat. Especial</th> */}
                                    <th className="p-3">Camiseta</th>
                                    {/* <th className="p-3">Celular</th> */}
                                    {/* <th className="p-3">Email</th> */}
                                    <th className="p-3">Alerta</th>
                                    <th className="p-3 text-center">Retirar KIT</th>
                               
                                    {/* ir para informações adicionais em ações */}

                                    {/* <th className="p-3">Data Estorno</th>
                                    <th className="p-3">Usuário Estorno</th>
                                    <th className="p-3">Data Entrega</th>
                                    <th className="p-3">Usuário Entrega</th>
                                    <th className="p-3">Nome Entrega</th>
                                    <th className="p-3">CPF Entrega</th> 
                                    <th className="p-3">Fone Entrega</th>
                                    <th className="p-3">Email Entrega</th> */}
                                    <th className="p-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAthletes.map((athlete) => {
                                    let rowBgClass = "hover:bg-slate-50 transition cursor-pointer";
                                    let statusBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";

                                    if (athlete.status === "ENTREGUE") {
                                        rowBgClass = "bg-emerald-50/60 hover:bg-emerald-100/50 text-emerald-950 transition cursor-pointer";
                                        statusBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
                                    } else if (athlete.status === "ESTORNADO") {
                                        rowBgClass = "bg-amber-50/70 hover:bg-amber-100/60 text-amber-950 transition cursor-pointer";
                                        statusBadgeClass = "bg-amber-100 text-amber-900 border-amber-300 font-bold";
                                    }

                                    return (
                                        <tr key={athlete.id} onClick={() => selectAthleteForDelivery(athlete)} className={rowBgClass}>
                                            <td className="p-3 font-bold text-slate-900">#{athlete.num}</td>
                                            <td className="p-3 font-semibold text-slate-900">{athlete.nome}</td>
                                            {/* <td className="p-3">{athlete.cpf}</td> */}
                                            <td className="p-3">{athlete.sexo}</td>
                                            <td className="p-3">{athlete.nascimento}</td>
                                            <td className="p-3">{athlete.cidadeUf}</td>
                                            <td className="p-3 font-medium text-slate-800">{athlete.equipe}</td>
                                            <td className="p-3 font-semibold">{athlete.distancia}</td>
                                            <td className="p-3">{athlete.kit}</td>
                                            {/* <td className="p-3">{athlete.faixaEtaria}</td> */}
                                            {/* <td className="p-3">{athlete.categoriaEspecial}</td> */}
                                            <td className="p-3 font-bold text-blue-600">{athlete.camiseta}</td>
                                            {/* <td className="p-3">{athlete.celular}</td> */}
                                            {/* <td className="p-3">{athlete.email}</td> */}
                                            <td className="p-3">
                                                {athlete.alerta ? (
                                                    <span className="text-amber-700 font-semibold flex items-center gap-1">
                                                        <ShieldAlert className="h-3.5 w-3.5" /> {athlete.alerta}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>

                                            <td className="p-3 text-center">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs border ${statusBadgeClass}`}>
                                                    {athlete.status === "ENTREGUE" && <Check className="h-3 w-3" />}
                                                    {athlete.status === "ESTORNADO" && <RotateCcw className="h-3 w-3" />}
                                                    {athlete.status}
                                                </span>
                                            </td>

                                            {/* <td className="p-3 text-amber-900 font-mono text-[11px]">{athlete.dataEstorno || "-"}</td>
                                            <td className="p-3 text-amber-900">{athlete.usuarioEstorno || "-"}</td>
                                            <td className="p-3 text-emerald-900 font-mono text-[11px]">{athlete.dataEntrega || "-"}</td>
                                            <td className="p-3 text-emerald-900">{athlete.usuarioEntrega || "-"}</td>
                                            <td className="p-3">{athlete.nomeEntrega || "-"}</td>
                                            <td className="p-3">{athlete.cpfEntrega || "-"}</td>
                                            <td className="p-3">{athlete.foneEntrega || "-"}</td>
                                            <td className="p-3">{athlete.emailEntrega || "-"}</td> */}

                                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingAthlete(athlete);
                                                            setShowEditAthleteModal(true);
                                                        }}
                                                        className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                                                        title="Editar Atleta"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>

                                                    {athlete.status === "ENTREGUE" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleReverseDelivery(athlete.id)}
                                                            className="h-7 w-7 p-0 text-amber-700 hover:bg-amber-100"
                                                            title="Estornar Kit"
                                                        >
                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </main>

            {/* MODAL PRINCIPAL DE ENTREGA DE KIT / FICHA DO ATLETA */}
            {showDeliveryModal && selectedAthlete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
                        {/* Topo do Modal */}
                        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-xl shadow-md">
                                    #{selectedAthlete.num}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{selectedAthlete.nome}</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        CPF: {selectedAthlete.cpf} · {selectedAthlete.distancia} ({selectedAthlete.cidadeUf})
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDeliveryModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Status Atual do Atleta */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                            <span className="text-slate-500 font-medium">STATUS:</span>
                            {selectedAthlete.status === "ENTREGUE" && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> KIT JÁ ENTREGUE
                                </span>
                            )}
                            {selectedAthlete.status === "ESTORNADO" && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                                    <RotateCcw className="h-3.5 w-3.5" /> ENTREGA ESTORNADA
                                </span>
                            )}
                            {selectedAthlete.status === "PENDENTE" && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                                    ● AGUARDANDO RETIRADA
                                </span>
                            )}
                        </div>

                        {/* Ficha Resumida */}
                        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                            <div>
                                <span className="text-slate-400 block">Camiseta:</span>
                                <span className="font-black text-blue-600 text-base">{selectedAthlete.camiseta}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Equipe:</span>
                                <span className="font-bold text-slate-800">{selectedAthlete.equipe}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Tipo do Kit:</span>
                                <span className="font-semibold text-slate-800">{selectedAthlete.kit}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block">Faixa Etária:</span>
                                <span className="font-semibold text-slate-800">{selectedAthlete.faixaEtaria}</span>
                            </div>
                        </div>

                        {selectedAthlete.alerta && (
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
                                <span>Alerta: {selectedAthlete.alerta}</span>
                            </div>
                        )}

                        {/* Formulário de Quem está retirando (se pendente ou alteração) */}
                        {selectedAthlete.status === "PENDENTE" && (
                            <div className="space-y-4 pt-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Identificação do Recebedor</p>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsThirdParty(false)}
                                        className={`flex-1 rounded-xl border p-3 text-left transition ${
                                            !isThirdParty ? "border-blue-2000 bg-blue-50/80 ring-2 ring-blue-5000/20" : "border-slate-200 bg-white"
                                        }`}
                                    >
                                        <span className="text-sm font-semibold text-slate-900 block">O próprio atleta</span>
                                        <span className="text-xs text-slate-500">Retirada pessoalmente</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsThirdParty(true)}
                                        className={`flex-1 rounded-xl border p-3 text-left transition ${
                                            isThirdParty ? "border-blue-2000 bg-blue-50/80 ring-2 ring-blue-5000/20" : "border-slate-200 bg-white"
                                        }`}
                                    >
                                        <span className="text-sm font-semibold text-slate-900 block">Terceiro / Responsável</span>
                                        <span className="text-xs text-slate-500">Retirada por representante</span>
                                    </button>
                                </div>

                                {isThirdParty && (
                                    <div className="grid gap-3 sm:grid-cols-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Nome de quem está retirando</label>
                                            <input
                                                value={thirdPartyForm.nome}
                                                onChange={(e) => setThirdPartyForm((p) => ({ ...p, nome: e.target.value }))}
                                                placeholder="Nome completo do terceiro"
                                                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">CPF do Responsável</label>
                                            <input
                                                value={thirdPartyForm.cpf}
                                                onChange={(e) => setThirdPartyForm((p) => ({ ...p, cpf: e.target.value }))}
                                                placeholder="000.000.000-00"
                                                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs bg-white"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Botões de Ação Principais no Modal */}
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                            {selectedAthlete.status === "PENDENTE" && (
                                <Button
                                    onClick={handleDeliverKit}
                                    size="lg"
                                    className="h-14 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm"
                                >
                                    <PackageCheck className="h-5 w-5 mr-2" /> CONFIRMAR ENTREGA DO KIT
                                </Button>
                            )}

                            {selectedAthlete.status === "ENTREGUE" && (
                                <Button
                                    onClick={() => handleReverseDelivery(selectedAthlete.id)}
                                    size="lg"
                                    className="h-12 w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-sm"
                                >
                                    <RotateCcw className="h-5 w-5 mr-2" /> ESTORNAR ENTREGA DO KIT
                                </Button>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={showAthleteOnSecondScreen}
                                    className="flex-1 rounded-xl text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold"
                                >
                                    <Monitor className="h-4 w-4 mr-1.5" /> Exibir na Segunda Tela
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowDeliveryModal(false);
                                        setEditingAthlete(selectedAthlete);
                                        setShowEditAthleteModal(true);
                                    }}
                                    className="flex-1 rounded-xl text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-semibold"
                                >
                                    <Edit className="h-4 w-4 mr-1.5" /> Editar Cadastro
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: SORTEIO DE ATLETAS */}
            {showRaffleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2 text-amber-600">
                                <Trophy className="h-6 w-6" />
                                <h3 className="text-lg font-bold text-slate-900">Realizar Sorteio do Evento</h3>
                            </div>
                            <button onClick={() => setShowRaffleModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <p className="text-slate-500">Defina os filtros desejados para o sorteio ou escolha "TODOS" para sorteio geral.</p>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Distância/Cat.</label>
                                    <select
                                        value={raffleFilterCategory}
                                        onChange={(e) => setRaffleFilterCategory(e.target.value)}
                                        className="w-full h-9 rounded-lg border border-slate-300 px-2 bg-white text-xs"
                                    >
                                        <option value="TODOS">Todas</option>
                                        <option value="5 KM">5 KM</option>
                                        <option value="10 KM">10 KM</option>
                                        <option value="21 KM">21 KM</option>
                                        <option value="42 KM">42 KM</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Faixa Etária</label>
                                    <select
                                        value={raffleFilterAge}
                                        onChange={(e) => setRaffleFilterAge(e.target.value)}
                                        className="w-full h-9 rounded-lg border border-slate-300 px-2 bg-white text-xs"
                                    >
                                        <option value="TODOS">Todas</option>
                                        <option value="25–29">25–29</option>
                                        <option value="30–34">30–34</option>
                                        <option value="35–39">35–39</option>
                                        <option value="40–44">40–44</option>
                                        <option value="50–54">50–54</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Cidade</label>
                                    <select
                                        value={raffleFilterCity}
                                        onChange={(e) => setRaffleFilterCity(e.target.value)}
                                        className="w-full h-9 rounded-lg border border-slate-300 px-2 bg-white text-xs"
                                    >
                                        <option value="TODOS">Todas</option>
                                        <option value="Bauru/SP">Bauru/SP</option>
                                        <option value="São Paulo/SP">São Paulo/SP</option>
                                        <option value="Campinas/SP">Campinas/SP</option>
                                        <option value="Sorocaba/SP">Sorocaba/SP</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {raffleWinner && (
                            <div className="rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-5 text-center text-white shadow-lg space-y-2 animate-bounce">
                                <Sparkles className="h-8 w-8 mx-auto text-white" />
                                <p className="text-xs uppercase tracking-wider font-bold text-amber-100">Ganhador do Sorteio!</p>
                                <h4 className="text-2xl font-black text-slate-900">{raffleWinner.nome}</h4>
                                <p className="text-sm font-semibold text-slate-800">
                                    Nº #{raffleWinner.num} · Equipe: {raffleWinner.equipe} ({raffleWinner.cidadeUf})
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2 border-t border-slate-100">
                            <Button
                                onClick={handleRunRaffle}
                                disabled={isRaffling}
                                className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md"
                            >
                                <Sparkles className="h-5 w-5 mr-2" /> {isRaffling ? "SORTEANDO..." : "SORTEAR AGORA"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: EDIÇÃO DE ATLETA */}
            {showEditAthleteModal && editingAthlete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <form
                        onSubmit={handleSaveAthleteEdit}
                        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2 text-blue-600">
                                <Edit className="h-5 w-5" />
                                <h3 className="text-lg font-bold text-slate-900">Editar Cadastro do Atleta</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowEditAthleteModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Nome Completo</label>
                                <input
                                    value={editingAthlete.nome}
                                    onChange={(e) => setEditingAthlete({ ...editingAthlete, nome: e.target.value })}
                                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs"
                                    required
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">CPF</label>
                                <input
                                    value={editingAthlete.cpf}
                                    onChange={(e) => setEditingAthlete({ ...editingAthlete, cpf: e.target.value })}
                                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs"
                                    required
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Número de Peito (NUM)</label>
                                <input
                                    value={editingAthlete.num}
                                    onChange={(e) => setEditingAthlete({ ...editingAthlete, num: e.target.value })}
                                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs font-bold"
                                    required
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Distância/Modalidade</label>
                                <input
                                    value={editingAthlete.distancia}
                                    onChange={(e) => setEditingAthlete({ ...editingAthlete, distancia: e.target.value })}
                                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs"
                                />
                            </div>

                            <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                <label className="font-semibold text-slate-700 block">Equipe / Assessoria</label>
                                <div className="flex gap-2">
                                    <select
                                        value={existingTeams.includes(editingAthlete.equipe) ? editingAthlete.equipe : "NOVA"}
                                        onChange={(e) => {
                                            if (e.target.value !== "NOVA") {
                                                setEditingAthlete({ ...editingAthlete, equipe: e.target.value });
                                            }
                                        }}
                                        className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-xs bg-white"
                                    >
                                        <option value="NOVA">-- Criar Nova Equipe / Manter Customizada --</option>
                                        {existingTeams.map((team) => (
                                            <option key={team} value={team}>
                                                {team}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <input
                                    value={editingAthlete.equipe}
                                    onChange={(e) => setEditingAthlete({ ...editingAthlete, equipe: e.target.value })}
                                    placeholder="Digite o nome da equipe..."
                                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs bg-white"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Camiseta</label>
                                <select
                                    value={editingAthlete.camiseta}
                                    onChange={(e) => setEditingAthlete({ ...editingAthlete, camiseta: e.target.value })}
                                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs bg-white"
                                >
                                    <option value="P">P</option>
                                    <option value="M">M</option>
                                    <option value="G">G</option>
                                    <option value="GG">GG</option>
                                    <option value="XGG">XGG</option>
                                    <option value="Baby Look P">Baby Look P</option>
                                    <option value="Baby Look M">Baby Look M</option>
                                    <option value="Baby Look G">Baby Look G</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Cidade/UF</label>
                                <input
                                    value={editingAthlete.cidadeUf}
                                    onChange={(e) => setEditingAthlete({ ...editingAthlete, cidadeUf: e.target.value })}
                                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-3 border-t border-slate-100 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowEditAthleteModal(false)}
                                className="h-10 rounded-xl"
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" className="h-10 rounded-xl bg-blue-600 hover:bg-blue-600 text-white font-bold">
                                Salvar Alterações
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL: ALTERAR NOME DO EVENTO */}
            {showEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Alterar Nome do Evento</h3>
                        <input
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm font-semibold"
                            placeholder="Digite o novo nome do evento..."
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setShowEventModal(false)} className="rounded-xl">
                                Cancelar
                            </Button>
                            <Button onClick={() => setShowEventModal(false)} className="rounded-xl bg-blue-600 text-white">
                                Salvar Nome
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CONFIRMAÇÃO DE RESET GERAL */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-rose-600">
                            <AlertTriangle className="h-6 w-6" />
                            <h3 className="text-lg font-bold text-slate-900">Zerar Alterações e Entregas?</h3>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Esta ação irá resetar o status de todas as entregas de kits para <strong>PENDENTE</strong> e limpar os históricos de estorno e horários.
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setShowResetModal(false)} className="rounded-xl">
                                Cancelar
                            </Button>
                            <Button onClick={handleResetAllDeliveries} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold">
                                Sim, Zerar Tudo
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
