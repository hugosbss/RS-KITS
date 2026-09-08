"use client";

import { CheckCircle2, XCircle } from "lucide-react";

type ToastProps = {
  message: string;
  error?: boolean;
};

export function Toast({ message, error }: ToastProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative flex flex-col items-center gap-3 rounded-2xl bg-white px-10 py-8 text-center shadow-2xl">
        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${error ? "bg-rose-100" : "bg-emerald-100"}`}>
          {error ? <XCircle className="h-10 w-10 text-rose-600" /> : <CheckCircle2 className="h-10 w-10 text-emerald-600" />}
        </div>
        <p className="max-w-xs text-base font-semibold text-slate-800">{message}</p>
      </div>
    </div>
  );
}
