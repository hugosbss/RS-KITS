"use client";

import { fetchAthletes } from "@/services/api";
import { mapBackendAthletes } from "@/components/providers/app-context";
import { buildZip, downloadBlob, sanitizePart } from "@/services/distribution";
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
    cpf?: string;
    cnpj?: string;
  } | null;
  config: {
    cloudUrl: string;
    eventOwner: string;
  };
  athletes: ImportedRow[];
};

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
          cpf: params.organizer.cpf,
          cnpj: params.organizer.cnpj,
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

function packageBaseName(pkg: RSKITSPackage): string {
  return `RS-KITS-${sanitizePart(pkg.event.name).toLowerCase()}`;
}

export function distributionFileName(pkg: RSKITSPackage, installerName: string | null): string {
  // Com instalador: um único arquivo ZIP (instalador + .rksits do evento).
  // Sem instalador disponível: apenas o pacote de dados .rksits.
  return installerName ? `${packageBaseName(pkg)}.zip` : `${packageBaseName(pkg)}.rksits`;
}

// Empacota instalador + dados do evento num único arquivo de distribuição.
// A ordenação da lista coloca o instalador primeiro e o .rksits em seguida,
// dentro do mesmo ZIP. Nunca baixa/gera nada aqui — apenas monta o artefato.
export async function buildDistributionBlob(
  pkg: RSKITSPackage,
  installer: { file: string; url: string } | null,
): Promise<Blob> {
  const pkgBytes = new TextEncoder().encode(JSON.stringify(pkg, null, 2));
  if (!installer) {
    // Sem instalador (desktop sem artefato publicado): só o .rksits mesmo.
    return new Blob([pkgBytes], { type: "application/json" });
  }
  const response = await fetch(installer.url);
  if (!response.ok) {
    throw new Error("Não foi possível carregar o instalador do aplicativo.");
  }
  const exeBytes = new Uint8Array(await response.arrayBuffer());
  return buildZip([
    { name: installer.file, data: exeBytes },
    { name: `${packageBaseName(pkg)}.rksits`, data: pkgBytes },
  ]);
}

export function downloadPackage(pkg: RSKITSPackage): void {
  const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${packageBaseName(pkg)}.rksits`);
}