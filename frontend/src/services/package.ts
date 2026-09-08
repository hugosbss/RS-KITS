"use client";

import { fetchAthletes } from "@/services/api";
import { mapBackendAthletes } from "@/components/providers/app-context";
import type { ImportedRow } from "@/components/import/types";
import type { AppEvent, AppUser } from "@/components/providers/app-context";

export type RSKITSPackage = {
  format: "RSKITS_PACKAGE";
  version: 1;
  createdBy: string;
  createdAt: string;
  event: {
    id: string;
    name: string;
    date: string;
    place: string;
    status: AppEvent["status"];
  };
  organizer: {
    id: string;
    name: string;
    email?: string;
    offlinePassword: string;
  } | null;
  config: {
    cloudUrl: string;
    eventOwner: string;
  };
  athletes: ImportedRow[];
};

export function generateOfflinePassword(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function buildEventPackage(params: {
  event: AppEvent;
  athletes: ImportedRow[];
  organizer: AppUser | null;
  createdBy: string;
  cloudUrl?: string;
}): RSKITSPackage {
  return {
    format: "RSKITS_PACKAGE",
    version: 1,
    createdBy: params.createdBy,
    createdAt: new Date().toISOString(),
    event: {
      id: params.event.id,
      name: params.event.name,
      date: params.event.date ?? "",
      place: params.event.place ?? "",
      status: params.event.status,
    },
    organizer: params.organizer
      ? {
          id: params.organizer.id,
          name: params.organizer.name,
          email: params.organizer.email,
          offlinePassword: generateOfflinePassword(),
        }
      : null,
    config: {
      cloudUrl: params.cloudUrl ?? "http://127.0.0.1:19100",
      eventOwner: params.event.organizer ?? "",
    },
    athletes: params.athletes,
  };
}

// Retorna os atletas do evento, buscando no backend quando ainda não carregados.
export async function loadPackageAthletes(
  token: string | null,
  eventId: string,
  cached: ImportedRow[] | undefined,
): Promise<ImportedRow[]> {
  if (cached && cached.length > 0) return cached;
  if (!token) return [];
  try {
    const result = await fetchAthletes(token, eventId, { limit: 200000 });
    return mapBackendAthletes(result.athletes);
  } catch {
    return [];
  }
}

export function downloadPackage(pkg: RSKITSPackage): void {
  const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const filename = `${(pkg.event.name || "evento").replace(/[^a-z0-9]+/gi, "_").toLowerCase()}.rskits`;
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}