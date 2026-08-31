"use client";

import { useEffect, useState, useMemo } from "react";
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock3,
    ContactRound,
    Edit,
    Eye,
    FileText,
    Filter,
    Layers,
    KeyRound,
    MapPin,
    Monitor,
    MoreHorizontal,
    PackageCheck,
    Pencil,
    Plus,
    QrCode,
    Receipt,
    RefreshCw,
    RotateCcw,
    Search,
    Settings2,
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
import { useAppState } from "@/components/providers/app-context";
import {
    clearSecondScreenAthlete,
    publishSecondScreenAthlete,
    type SecondScreenDisplayMode,
} from "@/components/delivery/second-screen";

export type DeliveryStatus = "PENDENTE" | "ENTREGUE" | "ESTORNADO";
type AthleteStatusFilter = DeliveryStatus | "TODOS";

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

const INITIAL_ATHLETES: Athlete[] = [
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

export function DeliveryShell() {
    const { selectedEvent, athletesByEvent, currentUser } = useAppState();
    const [online, setOnline] = useState(true);
    const [query, setQuery] = useState("");
    const [eventName, setEventName] = useState(selectedEvent?.name ?? "Nenhum evento selecionado");

    // Estado da lista de atletas
    const importedAthletes = useMemo<Athlete[]>(() => (selectedEvent ? (athletesByEvent[selectedEvent.id] ?? []).map((row) => ({
        id: row.id, num: row.num, nome: row.nomeAtleta, cpf: row.cpfAtleta, sexo: row.sexo === "F" ? "F" : "M", nascimento: row.nascto,
        cidadeUf: row.cidadeUf, equipe: row.equipe, distancia: row.modalidade, kit: row.kit, faixaEtaria: row.fxEtaria,
        categoriaEspecial: row.categEspecial, camiseta: row.camiseta, celular: row.cel, email: row.email, alerta: row.alerta, status: "PENDENTE" as DeliveryStatus,
    })) : []), [selectedEvent, athletesByEvent]);
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
    const [statusFilter, setStatusFilter] = useState<AthleteStatusFilter>("TODOS");
    const [secondScreenMode, setSecondScreenMode] = useState<SecondScreenDisplayMode>("MANUAL");

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
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showDropDownUtilities, setShowDropDownUtilities] = useState(false);
    const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
    const [receiptAthlete, setReceiptAthlete] = useState<Athlete | null>(null);
    const [resetConfirmation, setResetConfirmation] = useState("");

    // Filtros de sorteio
    const [raffleFilterCategory, setRaffleFilterCategory] = useState("TODOS");
    const [raffleFilterAge, setRaffleFilterAge] = useState("TODOS");
    const [raffleFilterCity, setRaffleFilterCity] = useState("TODOS");
    const [raffleWinner, setRaffleWinner] = useState<Athlete | null>(null);
    const [isRaffling, setIsRaffling] = useState(false);

    // Modal de PIN = Localizar atleta
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState("");
    const [pinError, setPinError] = useState("");

    const handlePinSearch = () => {
        const normalizedPin = pin.trim();

        setPinError("");

        if (!normalizedPin) {
            setPinError("Informe o código PIN");
            return;
        }

        const athlete = athletes.find(
            (item) => item.pin === normalizedPin
        );

        if (!athlete) {
            setPinError("Inválido");
            return;
        }

        setShowPinModal(false);
        setPin("");
        setPinError("");

        selectAthleteForDelivery(athlete);
    };

    // Lista de equipes cadastradas
    const existingTeams = useMemo(() => {
        const set = new Set(athletes.map((a) => a.equipe).filter(Boolean));
        return Array.from(set);
    }, [athletes]);

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

    useEffect(() => {
        setEventName(selectedEvent?.name ?? "Nenhum evento selecionado");
        setAthletes(importedAthletes);
        setSelectedAthlete(null);
    }, [selectedEvent?.id, importedAthletes]);

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

    const openSecondScreen = () => {
        window.open("/delivery/second-screen", "_blank", "noopener,noreferrer");
    };

    const showAthleteOnSecondScreen = (athlete?: Athlete) => {
        const athleteToShow = athlete ?? selectedAthlete;

        if (!athleteToShow) return;

        setSelectedAthlete(athleteToShow);
        publishSecondScreenAthlete(athleteToShow, "MANUAL");
    };

    const closeDeliveryModal = () => {
        if (secondScreenMode === "MANUAL") {
            clearSecondScreenAthlete();
        }
        setShowDeliveryModal(false);
    };

    const selectAthleteForDelivery = (athlete: Athlete) => {
        setSelectedAthlete(athlete);
        if (secondScreenMode === "AUTOMATICO") {
            publishSecondScreenAthlete(athlete, "AUTOMATICO");
        }
        setIsThirdParty(!!athlete.terceiro);
        setThirdPartyForm({
            nome: athlete.nomeEntrega || "",
            cpf: athlete.cpfEntrega || "",
            fone: athlete.foneEntrega || "",
            email: athlete.emailEntrega || "",
        });
        setShowDeliveryModal(true);
    };

    const handleViewAthlete = (athlete: Athlete) => {
        selectAthleteForDelivery(athlete);
    };

    const handleEditAthlete = (athleteId: string) => {
        const athlete = athletes.find((item) => item.id === athleteId);
        if (!athlete) return;

        setEditingAthlete(athlete);
        setShowEditAthleteModal(true);
    };

    const handleReceipt = (athleteId: string) => {
        const athlete = athletes.find((item) => item.id === athleteId);
        if (!athlete) return;

        setReceiptAthlete(athlete);
        setShowReceiptModal(true);
    };

    // Confirmar entrega do kit
    const handleDeliverKit = (athleteId?: string) => {
        const athleteToDeliver = athleteId ? athletes.find((item) => item.id === athleteId) : selectedAthlete;
        if (!athleteToDeliver) return;

        const now = new Date().toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        const isUsingModalContext = !athleteId && !!selectedAthlete;
        const updated: Athlete = {
            ...athleteToDeliver,
            status: "ENTREGUE",
            dataEntrega: now,
            usuarioEntrega: currentUser.name,
            terceiro: isUsingModalContext ? isThirdParty : false,
            nomeEntrega: isUsingModalContext ? (thirdPartyForm.nome || "Terceiro") : athleteToDeliver.nome,
            cpfEntrega: isUsingModalContext ? (thirdPartyForm.cpf || athleteToDeliver.cpf) : athleteToDeliver.cpf,
            foneEntrega: isUsingModalContext ? (thirdPartyForm.fone || athleteToDeliver.celular) : athleteToDeliver.celular,
            emailEntrega: isUsingModalContext ? (thirdPartyForm.email || athleteToDeliver.email) : athleteToDeliver.email,
        };

        setAthletes((prev) => prev.map((a) => (a.id === athleteToDeliver.id ? updated : a)));
        setSelectedAthlete(updated);
        closeDeliveryModal();
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
                        status: "PENDENTE",
                        dataEstorno: now,
                        usuarioEstorno: currentUser.name,
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
                          usuarioEstorno: currentUser.name,
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
        closeDeliveryModal();
    };

    // Zerar todas as alterações e entregas
    const handleResetAllDeliveries = () => {
        setAthletes(
            importedAthletes.map((a) => ({
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

    const confirmationPhrase = "ZERAR ENTREGAS";

    const canResetDeliveries =
        resetConfirmation.trim().toUpperCase() === confirmationPhrase;

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
                <div
                    className="
                        grid
                        grid-cols-[minmax(0,1fr)_auto]
                        items-center
                        gap-3
                        p-3
                        sm:px-6
                        lg:grid-cols-[minmax(180px,auto)_minmax(0,1fr)_auto]
                        lg:gap-5
                        lg:px-8
                    "
                >
                    {/* Coluna 1: informações do evento */}
                    <div className="min-w-0 justify-self-start">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                            Evento Atual
                        </p>
                            <span className="min-w-0 truncate group
                                flex
                                max-w-full
                                items-center
                                gap-1
                                text-base
                                font-bold
                                text-slate-900
                                transition
                                hover:text-blue-600
                                sm:text-lg">
                                {eventName}
                            </span>

                        <p className="mt-0.5 flex max-w-full items-center gap-1 truncate text-[10px] text-slate-500 sm:text-xs">
                            <MapPin className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                            <span className="truncate">
                                São Paulo, SP · 15 de agosto
                            </span>
                        </p>
                    </div>

                    {/* Mini dashboard */}
                    <div
                        className="
                            hidden
                            min-w-0
                            grid-cols-3
                            gap-2
                            min-[1200px]:col-start-2
                            min-[1200px]:grid
                            min-[1200px]:w-full
                            min-[1200px]:max-w-none
                            min-[1200px]:justify-self-stretch
                            lg:gap-3
                        "
                    >
                        <Card className="flex min-w-0 items-center justify-between border-slate-200 px-3 py-2 shadow-none">
                            <div className="min-w-0">
                                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Total
                                </p>

                                <p className="text-xl font-bold leading-tight text-slate-900">
                                    {stats.total}
                                </p>
                            </div>

                            <div className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                <Users className="h-4 w-4" />
                            </div>
                        </Card>

                        <Card className="flex min-w-0 items-center justify-between border-emerald-200 bg-emerald-50/40 px-3 py-2 shadow-none">
                            <div className="min-w-0">
                                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                    Entregues
                                </p>

                                <p className="text-xl font-bold leading-tight text-emerald-700">
                                    {stats.entregues}
                                </p>

                                <p className="truncate text-[10px] font-medium text-emerald-600">
                                    {stats.pct}% do total
                                </p>
                            </div>

                            <div className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                <PackageCheck className="h-4 w-4" />
                            </div>
                        </Card>

                        <Card className="flex min-w-0 items-center justify-between border-blue-200 bg-blue-50/40 px-3 py-2 shadow-none">
                            <div className="min-w-0">
                                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                                    Pendentes
                                </p>

                                <p className="text-xl font-bold leading-tight text-blue-600">
                                    {stats.pendentes}
                                </p>

                                <p className="truncate text-[10px] font-medium text-blue-600">
                                    Aguardando na fila
                                </p>
                            </div>

                            <div className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <Clock3 className="h-4 w-4" />
                            </div>
                        </Card>
                    </div>

                    {/* Coluna 3: utilitários */}
                    <div
                        className="
                            relative
                            justify-self-end
                            lg:col-start-3
                        "
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDropDownUtilities((prev) => !prev)}
                            className="
                                flex
                                items-center
                                gap-1
                                whitespace-nowrap
                                border-accent-200
                                bg-accent
                                px-2
                                text-xs
                                font-semibold
                                text-accent-foreground
                                hover:bg-accent/90
                                sm:px-3
                                sm:text-sm
                            "
                        >
                            <Settings2 className="h-3.5 w-3.5 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />

                            <span className="hidden sm:inline">
                                Utilitários
                            </span>
                        </Button>

                        {showDropDownUtilities && (
                            <div className="absolute right-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowDropDownUtilities(false);
                                        setShowResetModal(true);
                                    }}
                                    className="w-full justify-start rounded-lg text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                >
                                    <Trash2 className="mr-2 h-4 w-4 shrink-0" />
                                    Zerar Entregas
                                </Button>
                                
                                <div className="mt-1 rounded-lg border border-indigo-100 bg-indigo-50/60 p-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDropDownUtilities(false);
                                            openSecondScreen();
                                        }}
                                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                                    >
                                        <Monitor className="h-4 w-4 shrink-0" />
                                        Abrir Segunda Tela
                                    </button>
                                    <div className="mt-2 px-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">Transmissão</p>
                                        <div className="mt-1 grid grid-cols-2 rounded-lg bg-white p-0.5 text-xs font-semibold">
                                            {(["MANUAL", "AUTOMATICO"] as SecondScreenDisplayMode[]).map((mode) => (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    aria-pressed={secondScreenMode === mode}
                                                    onClick={() => setSecondScreenMode(mode)}
                                                    className={`rounded-md px-2 py-1.5 transition ${secondScreenMode === mode ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                                                >
                                                    {mode === "MANUAL" ? "Manual" : "Automático"}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="mt-1.5 text-[10px] leading-tight text-slate-500">
                                            {secondScreenMode === "AUTOMATICO" ? "Exibe o atleta selecionado por 90 segundos." : "Use “Espelhar” para enviar o atleta à segunda tela."}
                                        </p>
                                    </div>
                                </div>
                                
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowDropDownUtilities(false);
                                        setShowRaffleModal(true);
                                    }}
                                    className="mt-1 w-full justify-start rounded-lg text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                                >
                                    <Trophy className="mr-2 h-4 w-4 shrink-0" />
                                    Realizar Sorteio
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="p-4 sm:p-6 lg:ml-64 lg:p-8 space-y-6">
                {/* Linha/Bloco de Status e Métricas do Evento */}
                {/* <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3 justify-center">
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
                </div> */}

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

                        <div className="flex w-full items-center gap-2 sm:w-auto">
                            <Button
                                onClick={() => {
                                    if (filteredAthletes[0]) {
                                        selectAthleteForDelivery(filteredAthletes[0]);
                                    }
                                }}
                                className="h-12 flex-1 rounded-xl px-4 sm:flex-none sm:px-6"
                            >
                                <Search className="mr-1.5 h-4 w-4 shrink-0" />
                                Buscar
                            </Button>
                            
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (athletes[0]) {
                                        selectAthleteForDelivery(athletes[0]);
                                    }
                                }}
                                className="h-12 rounded-xl border-blue-200 px-3 text-blue-600 hover:bg-blue-50 sm:px-4"
                            >
                                <QrCode className="mr-1.5 h-5 w-5 shrink-0" />
                                <span className="hidden sm:inline">QR Code</span>
                            </Button>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setPin("");
                                    setPinError("");
                                    setShowPinModal(true);
                                }}
                                className="h-12 shrink-0 rounded-xl border-amber-200 bg-amber-50 px-3 text-amber-900 hover:bg-amber-100 sm:px-4">
                                <span className="sm:hidden">PIN</span>
                                <span className="hidden sm:inline">CÓDIGO PIN</span>
                            </Button>
                        </div>
                    </div>

                    {/* Cabeçalho da Tabela e Legendas */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Lista de Atletas do Evento</h3>
                            <p className="text-xs text-slate-500">
                                Exibindo {athletes.length} atletas.
                            </p>
                            {/* <Button variant="outline" size="sm" disabled={!selectedAthlete} onClick={showAthleteOnSecondScreen} className="mt-3 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40">
                                <Monitor className="mr-1.5 h-4 w-4" /> Exibir na Segunda Tela
                            </Button> */}

                            {/* <Button variant="outline" size="sm" onClick={() => { setPin(""); setPinError(""); setShowPinModal(true); }} className="mt-3 ml-2 border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100">
                                <p>CÓDIGO PIN</p>
                            </Button> */}
                        </div>

                        {/* Filtros de status */}
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                            {(["ENTREGUE", "PENDENTE"] as DeliveryStatus[]).map((status) => <button key={status} type="button" aria-pressed={statusFilter === status} onClick={() => toggleStatusFilter(status)} className={"inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 " + (statusFilter === status ? "bg-slate-700 text-white border-slate-700" : "bg-slate-100 text-slate-700 border-slate-200")}><span className={"h-2 w-2 rounded-full " + (status === "ENTREGUE" ? "bg-emerald-500" : status === "ESTORNADO" ? "bg-amber-500" : "bg-slate-400")} /> {status === "ENTREGUE" ? "Entregues" : status === "ESTORNADO" ? "Estornados" : "Pendentes"} ({status === "ENTREGUE" ? stats.entregues : stats.pendentes})</button>)}
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
                                    <th className="p-3">Sexo</th>
                                    <th className="p-3">Nascimento</th>
                                    <th className="p-3">Cidade/UF</th>
                                    <th className="p-3">Equipe</th>
                                    <th className="p-3">Modalidade</th>
                                    <th className="p-3">KIT</th>
                                    <th className="p-3">Camiseta</th>
                                    {/* <th className="p-3">Alerta</th> */}
                                    <th className="p-3 text-center">STATUS</th>
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
                                            <td className="p-3 text-slate-900">{athlete.num}</td>
                                            <td className="p-3 text-slate-900">{athlete.nome}</td>
                                            <td className="p-3">{athlete.sexo}</td>
                                            <td className="p-3">{athlete.nascimento}</td>
                                            <td className="p-3">{athlete.cidadeUf}</td>
                                            <td className="p-3 font-medium text-slate-800">{athlete.equipe}</td>
                                            <td className="p-3 font-semibold">{athlete.distancia}</td>
                                            <td className="p-3">{athlete.kit}</td>
                                            <td className="p-3 text-slate-900">{athlete.camiseta}</td>
                                            {/* <td className="p-3">
                                                {athlete.alerta ? (
                                                    <span className="text-amber-700 inline-flex items-center justify-center p-1.5 gap-1">
                                                        <ShieldAlert className="h-3.5 w-3.5" />
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400"></span>
                                                )}
                                            </td> */}

                                            <td className="p-3 text-center">
                                                <span className={`inline-flex items-center justify-center rounded-full p-1.5 border ${statusBadgeClass}`}>
                                                    {athlete.status === "ENTREGUE" && <Check className="h-3.5 w-3.5" />}
                                                    {athlete.status === "ESTORNADO" && <RotateCcw className="h-3.5 w-3.5" />}
                                                    {/* {athlete.status === "PENDENTE" && <Clock3 className="h-3.5 w-3.5" />} */}
                                                </span>
                                            </td>

                                            <td className="p-3">
                                              <div className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleViewAthlete(athlete);
                                                  }}
                                                  className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100"
                                                  title="Ver detalhes"
                                                >
                                                  <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                                                        
                                                {/* Editar */}
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleEditAthlete(athlete.id);
                                                  }}
                                                  className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100"
                                                  title="Editar atleta"
                                                >
                                                  <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                                                        
                                                {/* Entregar kit */}
                                                {athlete.status !== "ENTREGUE" && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(event) => {
                                                      event.stopPropagation();
                                                      handleDeliverKit(athlete.id);
                                                    }}
                                                    className="h-7 w-7 p-0 text-green-700 hover:bg-green-100"
                                                    title="Entregar Kit"
                                                  >
                                                    <Check className="h-3.5 w-3.5" />
                                                  </Button>
                                                )}
                                            
                                                {/* Estornar */}
                                                {athlete.status === "ENTREGUE" && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(event) => {
                                                      event.stopPropagation();
                                                      handleReverseDelivery(athlete.id);
                                                    }}
                                                    className="h-7 w-7 p-0 text-amber-700 hover:bg-amber-100"
                                                    title="Estornar Kit"
                                                  >
                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                  </Button>
                                                )}

                                                {/* Exibir na 2º tela */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        showAthleteOnSecondScreen(athlete);
                                                    }}
                                                    className="h-7 w-7 p-0 text-indigo-700 hover:bg-indigo-100"
                                                    title="Espelhar"
                                                  >
                                                    <Monitor className="h-3.5 w-3.5" />
                                                </Button>
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
                                    {selectedAthlete.num}
                                </div>
                                <div>
                                    <h2 className="text-xl semi-bold text-slate-900">{selectedAthlete.nome}</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        CPF: <span className="semi-bold text-slate-900">{selectedAthlete.cpf}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeDeliveryModal}
                                className="text-slate-400 hover:text-slate-600 p-1"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Status Atual do Atleta */}
                        {/* <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
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
                                    ● DISPONÍVEL
                                </span>
                            )}
                        </div> */}

                        {/* Ficha Resumida */}
                        {/* <div className="flex flex-nowrap md:flex-wrap justify-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs"> */}
                        <div className="grid grid-cols-2 gap-3 rounded-2xl justify-items-center border border-slate-200 bg-slate-50 p-4 text-xs md:grid-cols-3 lg:grid-cols-5">
                            <div className="w-25 text-center">
                                <span className="text-slate-400 block center">Modalidade:</span>
                                <span className="text-slate-800">{selectedAthlete.distancia}</span>
                            </div>
                            <div className="w-25 text-center">
                                <span className="text-slate-400 block center">Camiseta:</span>
                                <span className="text-slate-800">{selectedAthlete.camiseta}</span>
                            </div>
                            <div className="w-25 text-center">
                                <span className="text-slate-400 block center">Equipe:</span>
                                <span className="text-slate-800">{selectedAthlete.equipe}</span>
                            </div>
                            <div className="w-25 text-center">
                                <span className="text-slate-400 block center">Tipo do Kit:</span>
                                <span className="text-slate-800">{selectedAthlete.kit}</span>
                            </div>
                            <div className="w-25 text-center">
                                <span className="text-slate-400 block center">Faixa etária:</span>
                                <span className="text-slate-800">{selectedAthlete.faixaEtaria}</span>
                            </div>
                        </div>

                        {selectedAthlete.alerta && (
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
                                <span>{selectedAthlete.alerta}</span>
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
                                        {/* <span className="text-xs text-slate-500">Retirada pessoalmente</span> */}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsThirdParty(true)}
                                        className={`flex-1 rounded-xl border p-3 text-left transition ${
                                            isThirdParty ? "border-blue-2000 bg-blue-50/80 ring-2 ring-blue-5000/20" : "border-slate-200 bg-white"
                                        }`}
                                    >
                                        <span className="text-sm font-semibold text-slate-900 block">Terceiro / Responsável</span>
                                        {/* <span className="text-xs text-slate-500">Retirada por representante</span> */}
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
                                    onClick={(event) => {
                                        event.preventDefault();
                                        handleDeliverKit();
                                    }}
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
                                    onClick={() => showAthleteOnSecondScreen()}
                                    className="flex-1 rounded-xl text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold"
                                >
                                    <Monitor className="h-4 w-4 mr-1.5" />Espelhar
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        closeDeliveryModal();
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
                            {/* <p className="text-slate-500">Defina os filtros desejados para o sorteio ou escolha "TODOS" para sorteio geral.</p> */}

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Modalidade/Cat.</label>
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
                                    Nº {raffleWinner.num} · Equipe: {raffleWinner.equipe} ({raffleWinner.cidadeUf})
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
                                <label className="font-semibold text-slate-700 block mb-1">Modalidade</label>
                                <input
                                    value={editingAthlete.distancia}
                                    onChange={(e) => setEditingAthlete({ ...editingAthlete, distancia: e.target.value })}
                                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Faixa Etária</label>
                                <input
                                    value={editingAthlete.faixaEtaria}
                                    onChange={(e) => setEditingAthlete({ ...editingAthlete, faixaEtaria: e.target.value })}
                                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Equipe</label>
                                <input
                                    value={editingAthlete.equipe}
                                    onChange={(e) => setEditingAthlete({ ...editingAthlete, equipe: e.target.value })}
                                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs"
                                />
                            </div>

                            {/* <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                <label className="font-semibold text-slate-700 block">Equipe</label>
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
                            </div> */}

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

            {showResetModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reset-deliveries-title"
                >
                    <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
                        {/* Cabeçalho do modal */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                                <AlertTriangle className="h-5 w-5" />
                            </div>

                            <div>
                                <h3 id="reset-deliveries-title" className="text-lg font-bold text-slate-900">
                                    Zerar alterações e entregas?
                                </h3>



                                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                                    <label htmlFor="reset-confirmation" className="text-sm font-medium text-slate-500">
                                        Digite{" "}
                                        <span className="font-bold text-slate-900">
                                            {confirmationPhrase}
                                        </span>{" "}
                                        para confirmar
                                    </label>
                                </p>
                            </div>
                        </div>

                        {/* Campo de confirmação */}
                        <div className="space-y-2">
                            <input
                                id="reset-confirmation"
                                name="reset-deliveries-confirmation"
                                type="text"
                                value={resetConfirmation}
                                onChange={(event) => {
                                    setResetConfirmation(event.target.value);
                                }}
                                placeholder={confirmationPhrase}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="characters"
                                spellCheck={false}
                                aria-describedby="reset-confirmation-help"
                                className="
                                    h-11
                                    w-full
                                    rounded-xl
                                    border
                                    border-slate-300
                                    px-4
                                    text-sm
                                    font-semibold
                                    uppercase
                                    outline-none
                                    transition
                                    placeholder:text-slate-400
                                    focus:border-rose-500
                                    focus:ring-2
                                    focus:ring-rose-500/20
                                "
                            />
                        </div>
                            
                        {/* Ações */}
                        <div className="flex flex-col-reverse justify-center gap-2 pt-2 sm:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setResetConfirmation("");
                                    setShowResetModal(false);
                                }}
                                className="w-full rounded-xl sm:w-auto"
                            >
                                Cancelar
                            </Button>
                            
                            <Button
                                type="button"
                                disabled={!canResetDeliveries}
                                onClick={() => {
                                    if (!canResetDeliveries) return;
                                
                                    handleResetAllDeliveries();
                                    setResetConfirmation("");
                                    setShowResetModal(false);
                                }}
                                className="
                                    w-full
                                    rounded-xl
                                    bg-rose-600
                                    font-bold
                                    text-white
                                    hover:bg-rose-700
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                    sm:w-auto
                                "
                            >
                                Sim, zerar tudo
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showPinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <KeyRound className="h-6 w-6" />
                            </div>
                        
                            {/* <h3 className="mt-4 text-lg font-bold text-slate-900">
                                Identificar atleta
                            </h3> */}
                        
                            <p className="mt-4 text-sm text-slate-500">
                                Informe o código PIN
                            </p>
                        </div>
                        
                        <div className="mt-5 space-y-2">
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={pin}
                                onChange={(e) => {
                                    setPin(e.target.value.replace(/\D/g, ""));
                                    if (pinError) setPinError("");
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handlePinSearch();
                                    }
                                }}
                                placeholder="0000"
                                autoFocus
                                aria-invalid={!!pinError}
                                className={`h-12 w-full rounded-xl border px-4 text-center text-lg font-bold tracking-[0.35em] outline-none transition focus:ring-2 ${
                                    pinError
                                        ? "border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-500 focus:ring-rose-100"
                                        : "border-slate-300 bg-white focus:border-amber-500 focus:ring-amber-100"
                                }`}
                            />

                            {pinError && (
                                <p className="text-center text-sm font-medium text-rose-600">
                                    {pinError}
                                </p>
                            )}
                        </div>
            
                        <div className="mt-5 flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowPinModal(false);
                                    setPin("");
                                    setPinError("");
                                }}
                                className="rounded-xl"
                            >
                                Cancelar
                            </Button>
                            
                            <Button
                                onClick={handlePinSearch}
                                disabled={!pin.trim()}
                                className="rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                            >
                                Continuar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div> 
    );
}
