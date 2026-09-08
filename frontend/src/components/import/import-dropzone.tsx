"use client";

import { UploadCloud, X, CheckCircle2 } from "lucide-react";

interface ImportDropzoneProps {
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    isDragging: boolean;
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLDivElement>) => Promise<void>;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    fileName: string | null;
    previewDataLength: number;
    importSuccess: string | null;
    importError: string | null;
}

export function ImportDropzone({
    fileInputRef,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileUpload,
    fileName,
    previewDataLength,
    importSuccess,
    importError,
}: ImportDropzoneProps) {
    return (
        <>
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer space-y-2 group transition ${isDragging ? "border-emerald-500 bg-emerald-50/50" : "border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40"}`}
            >
                <UploadCloud className="h-10 w-10 mx-auto text-slate-400 group-hover:text-emerald-600 transition" />
                <p className="text-xs font-bold text-slate-800">
                    Clique aqui para selecionar ou arraste sua planilha (.csv, .xlsx)
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                />
            </div>

            {fileName && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 text-xs">
                    <span className="font-semibold text-slate-700 truncate">Arquivo: {fileName}</span>
                    <span className="font-bold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">
                        {previewDataLength} registros lidos
                    </span>
                </div>
            )}

            {importSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{importSuccess}</span>
                </div>
            )}

            {importError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{importError}</span>
                </div>
            )}
        </>
    );
}
