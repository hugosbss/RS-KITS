"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Search, X } from "lucide-react";
import type { AppEvent } from "@/components/providers/app-context";

export function EventLinkCombobox({
  events,
  selectedIds,
  onChange,
  placeholder,
}: {
  events: AppEvent[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const selectedEvents = useMemo(() => events.filter((event) => selectedIds.includes(event.id)), [events, selectedIds]);
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return events.filter(
      (event) =>
        !selectedIds.includes(event.id) &&
        (text
          ? event.name.toLowerCase().includes(text) || event.date.toLowerCase().includes(text)
          : true),
    );
  }, [events, selectedIds, query]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const remove = (eventId: string) => {
    onChange(selectedIds.filter((id) => id !== eventId));
  };

  if (selectedEvents.length > 0) {
    return (
      <div className="mt-2 space-y-1.5">
        {selectedEvents.map((event) => (
          <div
            key={event.id}
            className="flex h-11 items-center rounded-lg border border-blue-200 bg-blue-50 px-3"
          >
            <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-blue-600" />
            <span className="flex-1 truncate text-sm font-semibold text-blue-800">
              {event.name}
              <span className="ml-1.5 font-normal text-blue-500">{event.date}</span>
            </span>
            <button
              type="button"
              onClick={() => remove(event.id)}
              className="ml-2 shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-blue-100 hover:text-rose-600"
              aria-label={`Remover ${event.name}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
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
          placeholder={placeholder ?? "Buscar evento..."}
          className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {filtered.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => {
                onChange([...selectedIds, event.id]);
                setQuery("");
                setOpen(false);
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm transition text-slate-700 hover:bg-slate-50"
            >
              <span className="font-medium">{event.name}</span>
              <span className="ml-1 text-xs text-slate-400">{event.date}</span>
            </button>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && query && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-400 shadow-xl">
          Nenhum evento encontrado.
        </div>
      )}
    </div>
  );
}
