"use client";

import { Button } from "@/components/ui/button";

interface DeliveryEventModalProps {
    showEventModal: boolean;
    setShowEventModal: React.Dispatch<React.SetStateAction<boolean>>;
    eventName: string;
    setEventName: React.Dispatch<React.SetStateAction<string>>;
}

export function DeliveryEventModal({
    showEventModal,
    setShowEventModal,
    eventName,
    setEventName,
}: DeliveryEventModalProps) {
    if (!showEventModal) return null;

    return (
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
    );
}
