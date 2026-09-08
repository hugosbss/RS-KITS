"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeliveryResetModalProps {
    showResetModal: boolean;
    setShowResetModal: React.Dispatch<React.SetStateAction<boolean>>;
    resetConfirmation: string;
    setResetConfirmation: React.Dispatch<React.SetStateAction<string>>;
    canResetDeliveries: boolean;
    handleResetAllDeliveries: () => void;
}

const CONFIRMATION_PHRASE = "ZERAR ENTREGAS";

export function DeliveryResetModal({
    showResetModal,
    setShowResetModal,
    resetConfirmation,
    setResetConfirmation,
    canResetDeliveries,
    handleResetAllDeliveries,
}: DeliveryResetModalProps) {
    if (!showResetModal) return null;

    return (
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
                                    {CONFIRMATION_PHRASE}
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
                        placeholder={CONFIRMATION_PHRASE}
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
    );
}
