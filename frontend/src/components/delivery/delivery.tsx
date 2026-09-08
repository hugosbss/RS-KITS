"use client";

import { useEffect, useState, useMemo } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAppState } from "@/components/providers/app-context";
import { postAudit } from "@/services/api";
import {
    clearSecondScreenAthlete,
    publishSecondScreenAthlete,
    type SecondScreenDisplayMode,
} from "@/components/delivery/second-screen";
import { DeliveryHeader } from "./delivery-header";
import { DeliveryTable } from "./delivery-table";
import { DeliveryModal } from "./delivery-modal";
import { DeliveryRaffleModal } from "./delivery-raffle-modal";
import { DeliveryEditModal } from "./delivery-edit-modal";
import { DeliveryEventModal } from "./delivery-event-modal";
import { DeliveryResetModal } from "./delivery-reset-modal";
import { DeliveryPinModal } from "./delivery-pin-modal";

export type { Athlete, DeliveryStatus } from "./types";
import type { Athlete, DeliveryStatus, AthleteStatusFilter } from "./types";
import { INITIAL_ATHLETES } from "./types";

export function DeliveryShell() {
    const { selectedEvent, athletesByEvent, currentUser, updateAthlete, token } = useAppState();
    const [online, setOnline] = useState(true);
    const [query, setQuery] = useState("");
    const [eventName, setEventName] = useState(selectedEvent?.name ?? "Nenhum evento selecionado");

    // Estado da lista de atletas
    const importedAthletes = useMemo<Athlete[]>(() => (selectedEvent ? (athletesByEvent[selectedEvent.id] ?? []).map((row) => ({
        id: row.id,
        pin: row.pin,
        num: row.num,
        nome: row.nomeAtleta,
        cpf: row.cpfAtleta,
        sexo: row.sexo === "F" ? "F" : "M",
        nascimento: row.nascto,
        cidadeUf: row.cidadeUf,
        equipe: row.equipe,
        distancia: row.modalidade,
        kit: row.kit,
        faixaEtaria: row.fxEtaria,
        categoriaEspecial: row.categEspecial,
        camiseta: row.camiseta,
        celular: row.cel,
        email: row.email,
        alerta: row.alerta,
        status: (row.statusEntrega ?? "PENDENTE") as DeliveryStatus,
        dataEntrega: row.dataEntrega,
        usuarioEntrega: row.usuarioEntrega,
        obsEntrega: row.obsEntrega,
        nomeEntrega: row.nomeEntrega,
        cpfEntrega: row.cpfEntrega,
        foneEntrega: row.foneEntrega,
        emailEntrega: row.emailEntrega,
        terceiro: row.terceiro ?? false,
        dataEstorno: row.dataEstorno,
        usuarioEstorno: row.usuarioEstorno,
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
        updateAthlete(athleteToDeliver.id, {
            statusEntrega: "ENTREGUE",
            dataEntrega: now,
            usuarioEntrega: currentUser.name,
            nomeEntrega: updated.nomeEntrega,
            cpfEntrega: updated.cpfEntrega,
            foneEntrega: updated.foneEntrega,
            emailEntrega: updated.emailEntrega,
            terceiro: updated.terceiro ?? false,
        });
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

        updateAthlete(athleteId, {
            statusEntrega: "PENDENTE",
            dataEstorno: now,
            usuarioEstorno: currentUser.name,
            dataEntrega: null,
            usuarioEntrega: null,
            obsEntrega: null,
            nomeEntrega: null,
            cpfEntrega: null,
            foneEntrega: null,
            emailEntrega: null,
            terceiro: false,
        });

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

        importedAthletes.forEach((a) => {
            updateAthlete(a.id, {
                statusEntrega: "PENDENTE",
                dataEntrega: null,
                usuarioEntrega: null,
                obsEntrega: null,
                dataEstorno: null,
                usuarioEstorno: null,
                nomeEntrega: null,
                cpfEntrega: null,
                foneEntrega: null,
                emailEntrega: null,
                terceiro: false,
            });
        });

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
                const winner = pool[finalIdx];
                setRaffleWinner(winner);
                setIsRaffling(false);

                if (token) {
                    postAudit(token, {
                        acao: "SORTEIO",
                        entidade: "ATLETA",
                        entidadeId: winner.id,
                        evento: selectedEvent?.name,
                        detalhe: `Vencedor: ${winner.nome} (nº ${winner.num}) | Filtros: modalidade=${raffleFilterCategory}, faixa=${raffleFilterAge}, cidade=${raffleFilterCity}`,
                        origem: "SISTEMA",
                    }).catch(() => {
                        // falha silenciosa: sorteio continua funcionando sem o log
                    });
                }
            }
        }, 120);
    };

    // Salvar edição do atleta
    const handleSaveAthleteEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAthlete) return;

        updateAthlete(editingAthlete.id, {
            nomeAtleta: editingAthlete.nome,
            cpfAtleta: editingAthlete.cpf,
            modalidade: editingAthlete.distancia,
            fxEtaria: editingAthlete.faixaEtaria,
            equipe: editingAthlete.equipe,
            camiseta: editingAthlete.camiseta,
            cidadeUf: editingAthlete.cidadeUf,
        });

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

            <DeliveryHeader
                eventName={eventName}
                eventPlace={selectedEvent?.place ?? "Local a definir"}
                stats={stats}
                showDropDownUtilities={showDropDownUtilities}
                setShowDropDownUtilities={setShowDropDownUtilities}
                setShowResetModal={setShowResetModal}
                openSecondScreen={openSecondScreen}
                secondScreenMode={secondScreenMode}
                setSecondScreenMode={setSecondScreenMode}
                setShowRaffleModal={setShowRaffleModal}
            />

            {/* Conteúdo Principal */}
            <main className="p-4 sm:p-6 lg:ml-64 lg:p-8 space-y-6">
                <DeliveryTable
                    query={query}
                    setQuery={setQuery}
                    filteredAthletes={filteredAthletes}
                    athletes={athletes}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    toggleStatusFilter={toggleStatusFilter}
                    selectAthleteForDelivery={selectAthleteForDelivery}
                    handleViewAthlete={handleViewAthlete}
                    handleEditAthlete={handleEditAthlete}
                    handleDeliverKit={handleDeliverKit}
                    handleReverseDelivery={handleReverseDelivery}
                    showAthleteOnSecondScreen={showAthleteOnSecondScreen}
                    setShowPinModal={setShowPinModal}
                    setPin={setPin}
                    setPinError={setPinError}
                    stats={stats}
                />
            </main>

            {/* MODAL PRINCIPAL DE ENTREGA DE KIT / FICHA DO ATLETA */}
            {showDeliveryModal && selectedAthlete && (
                <DeliveryModal
                    selectedAthlete={selectedAthlete}
                    closeDeliveryModal={closeDeliveryModal}
                    isThirdParty={isThirdParty}
                    setIsThirdParty={setIsThirdParty}
                    thirdPartyForm={thirdPartyForm}
                    setThirdPartyForm={setThirdPartyForm}
                    handleDeliverKit={handleDeliverKit}
                    handleReverseDelivery={handleReverseDelivery}
                    showAthleteOnSecondScreen={showAthleteOnSecondScreen}
                    setShowEditAthleteModal={setShowEditAthleteModal}
                    setEditingAthlete={setEditingAthlete}
                />
            )}

            <DeliveryRaffleModal
                showRaffleModal={showRaffleModal}
                setShowRaffleModal={setShowRaffleModal}
                raffleFilterCategory={raffleFilterCategory}
                setRaffleFilterCategory={setRaffleFilterCategory}
                raffleFilterAge={raffleFilterAge}
                setRaffleFilterAge={setRaffleFilterAge}
                raffleFilterCity={raffleFilterCity}
                setRaffleFilterCity={setRaffleFilterCity}
                raffleWinner={raffleWinner}
                isRaffling={isRaffling}
                handleRunRaffle={handleRunRaffle}
            />

            <DeliveryEditModal
                editingAthlete={editingAthlete!}
                setEditingAthlete={setEditingAthlete}
                showEditAthleteModal={showEditAthleteModal}
                setShowEditAthleteModal={setShowEditAthleteModal}
                handleSaveAthleteEdit={handleSaveAthleteEdit}
            />

            <DeliveryEventModal
                showEventModal={showEventModal}
                setShowEventModal={setShowEventModal}
                eventName={eventName}
                setEventName={setEventName}
            />

            <DeliveryResetModal
                showResetModal={showResetModal}
                setShowResetModal={setShowResetModal}
                resetConfirmation={resetConfirmation}
                setResetConfirmation={setResetConfirmation}
                canResetDeliveries={canResetDeliveries}
                handleResetAllDeliveries={handleResetAllDeliveries}
            />

            <DeliveryPinModal
                showPinModal={showPinModal}
                setShowPinModal={setShowPinModal}
                pin={pin}
                setPin={setPin}
                pinError={pinError}
                setPinError={setPinError}
                handlePinSearch={handlePinSearch}
            />
        </div> 
    );
}
