"use client";

import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeliveryPinModalProps {
    showPinModal: boolean;
    setShowPinModal: React.Dispatch<React.SetStateAction<boolean>>;
    pin: string;
    setPin: React.Dispatch<React.SetStateAction<string>>;
    pinError: string;
    setPinError: React.Dispatch<React.SetStateAction<string>>;
    handlePinSearch: () => void;
}

export function DeliveryPinModal({
    showPinModal,
    setShowPinModal,
    pin,
    setPin,
    pinError,
    setPinError,
    handlePinSearch,
}: DeliveryPinModalProps) {
    if (!showPinModal) return null;

    return (
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
    );
}
