"use client";

import { BarChart3 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAppState } from "@/components/providers/app-context";

export function ReportsHeader() {
    const { selectedEvent } = useAppState();

    return (
        <>
            <Sidebar />

            {/* Cabeçalho */}
            <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur lg:ml-64">
                <div className="flex flex-col gap-3 p-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400"></p>
                        <h1 className="text-xl font-medium text-slate-900 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" /> Relatórios
                        </h1>
                        <p className="text-xs text-slate-500">{selectedEvent ? `${selectedEvent.name} · ${selectedEvent.place}` : "Nenhum evento selecionado"}</p>
                    </div>
                </div>
            </header>
        </>
    );
}
