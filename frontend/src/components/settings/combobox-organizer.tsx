"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link2, Search, X } from "lucide-react";
import type { AppUser } from "@/components/providers/app-context";

export function OrganizerCombobox({
  organizers,
  value,
  onChange,
  placeholder,
}: {
  organizers: AppUser[];
  value: string | null;
  onChange: (organizerId: string | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const selected = organizers.find((organizer) => organizer.id === value) ?? null;
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return organizers.filter((organizer) =>
      text ? organizer.name.toLowerCase().includes(text) : true,
    );
  }, [organizers, query]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (selected) {
    return (
      <div className="mt-2 flex h-11 items-center rounded-lg border border-blue-200 bg-blue-50 px-3">
        <Link2 className="mr-2 h-4 w-4 shrink-0 text-blue-600" />
        <span className="flex-1 truncate text-sm font-semibold text-blue-800">{selected.name}</span>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery("");
          }}
          className="ml-2 shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-blue-100 hover:text-rose-600"
          aria-label="Remover organizador vinculado"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative mt-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? "Buscar organizador..."}
          className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-9 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      {open && (
        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-400">Nenhum organizador encontrado.</p>
          )}
          {filtered.map((organizer) => (
            <button
              key={organizer.id}
              type="button"
              onClick={() => {
                onChange(organizer.id);
                setOpen(false);
                setQuery("");
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm transition text-slate-700 hover:bg-slate-50"
            >
              {organizer.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
