"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { BR_STATES } from "./types";

export function UfCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (uf: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return BR_STATES.filter((state) =>
      text ? state.toLowerCase().includes(text) : true,
    );
  }, [query]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={boxRef} className="relative mt-1.5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={value || query}
          onChange={(e) => {
            onChange("");
            setQuery(e.target.value.toUpperCase().slice(0, 2));
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="UF"
          className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      {open && (
        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-400">Nenhum estado encontrado.</p>
          )}
          {filtered.map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => {
                onChange(state);
                setQuery("");
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                state === value
                  ? "bg-blue-50 font-semibold text-blue-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
