export type AdminOption = "organizador" | "operador" | "evento";

export const TOAST_DURATION_MS = 3000;

export const EMPTY_EVENT_FORM = { name: "", date: "", city: "", uf: "", organizerId: null as string | null };

export const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export function toPlace(city: string, uf: string) {
  const c = city.trim();
  const u = uf.trim().toUpperCase();
  if (!c && !u) return "";
  if (c && u) return `${c}/${u}`;
  return c || u;
}

export function splitPlace(place: string) {
  const idx = place.lastIndexOf("/");
  if (idx === -1) return { city: place, uf: "" };
  return { city: place.slice(0, idx), uf: place.slice(idx + 1) };
}
