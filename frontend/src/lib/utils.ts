import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function maskCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function maskCpfCnpj(value: string) {
  const digits = onlyDigits(value);
  return digits.length > 11 ? maskCnpj(value) : maskCpf(value);
}

export function maskIdentifier(value: string) {
  if (!value) return "";
  const isNumericLike = /^[\d.\-/]+$/.test(value.trim());
  return isNumericLike ? maskCpfCnpj(value) : value;
}

// Converte serial de data do Excel (ex.: 30368) para data.
export function excelSerialToDate(serial: number): Date | null {
  if (typeof serial !== "number" || !Number.isFinite(serial)) return null;
  // 1899-12-30 é a data base do sistema de datas do Excel (OJAN default).
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

// Formata data ISO/Date em dd/mm/aaaa.
export function formatDateBR(input: Date | string | null | undefined): string {
  if (!input) return "";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

// Converte um valor CSV/Excel em string de CPF com pontuação.
export function toCpfString(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return maskCpf(String(value));
}
