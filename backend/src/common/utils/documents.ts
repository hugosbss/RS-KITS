/**
 * Normalização e validação de documentos (CPF/CNPJ) e identificadores.
 *
 * Objetivo: a mesma informação nunca deve existir em dois formatos dentro do
 * banco. Tudo é gravado apenas com dígitos; a máscara é reconstruída na
 * interface. Isso evita que "123.456.789-00" e "12345678900" sejam tratados
 * como usuários diferentes (login ambíguo).
 */

/** Remove tudo que não for dígito. */
export function onlyDigits(value: string): string {
  return value.replace(/\D+/g, '');
}

/** Converte string vazia / somente espaços em null. */
export function blankToNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

/** Normaliza CPF para apenas dígitos (11). Retorna null quando ausente. */
export function normalizeCpf(value?: string | null): string | null {
  const text = blankToNull(value);
  return text === null ? null : onlyDigits(text);
}

/** Normaliza CNPJ para apenas dígitos (14). Retorna null quando ausente. */
export function normalizeCnpj(value?: string | null): string | null {
  const text = blankToNull(value);
  return text === null ? null : onlyDigits(text);
}

/** Normaliza código de acesso: sem espaços nas pontas, maiúsculo. */
export function normalizeAccessCode(value?: string | null): string | null {
  const text = blankToNull(value);
  if (text === null) return null;
  return text.toUpperCase();
}

/** E-mail em minúsculas, sem espaços nas pontas. */
export function normalizeEmail(value?: string | null): string | null {
  const text = blankToNull(value);
  return text === null ? null : text.toLowerCase();
}

/** E-mail simples mas suficiente para cadastro. */
export function isValidEmail(value: string): boolean {
  const text = value.trim();
  if (text.length < 5 || text.length > 254) return false;
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(text);
}

function isRepeatedDigit(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

/** Validação de CPF pelos dois dígitos verificadores. */
export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || isRepeatedDigit(digits)) return false;

  for (const [position, weightStart] of [
    [9, 10],
    [10, 11],
  ] as const) {
    let sum = 0;
    for (let index = 0; index < position; index += 1) {
      sum += Number(digits[index]) * (weightStart - index);
    }
    const remainder = (sum * 10) % 11;
    const checkDigit = remainder === 10 ? 0 : remainder;
    if (checkDigit !== Number(digits[position])) return false;
  }
  return true;
}

/** Validação de CNPJ pelos dois dígitos verificadores. */
export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || isRepeatedDigit(digits)) return false;

  const weightsByPosition: Record<number, number[]> = {
    12: [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    13: [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  };

  for (const position of [12, 13] as const) {
    const weights = weightsByPosition[position];
    let sum = 0;
    for (let index = 0; index < position; index += 1) {
      sum += Number(digits[index]) * weights[index];
    }
    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? 0 : 11 - remainder;
    if (checkDigit !== Number(digits[position])) return false;
  }
  return true;
}

/**
 * Detecta colisões de documentos já normalizados existentes no banco.
 * Usado antes de migrar dados legados: colisão é reportada, nunca resolvida
 * apagando registro.
 */
export type DocumentCollision = {
  field: 'cpf' | 'cnpj' | 'accessCode' | 'email';
  value: string;
  userIds: string[];
};

export function findDocumentCollisions(
  rows: Array<{
    id: string;
    email?: string | null;
    cpf?: string | null;
    cnpj?: string | null;
    accessCode?: string | null;
  }>,
): DocumentCollision[] {
  const collisions: DocumentCollision[] = [];
  const fields: Array<'email' | 'cpf' | 'cnpj' | 'accessCode'> = [
    'email',
    'cpf',
    'cnpj',
    'accessCode',
  ];

  for (const field of fields) {
    const byValue = new Map<string, string[]>();
    for (const row of rows) {
      const value = normalizeField(field, row[field]);
      if (!value) continue;
      const bucket = byValue.get(value) ?? [];
      bucket.push(row.id);
      byValue.set(value, bucket);
    }
    for (const [value, userIds] of byValue) {
      if (userIds.length > 1) {
        collisions.push({ field, value, userIds });
      }
    }
  }
  return collisions;
}

function normalizeField(
  field: 'email' | 'cpf' | 'cnpj' | 'accessCode',
  value?: string | null,
): string | null {
  switch (field) {
    case 'email':
      return normalizeEmail(value);
    case 'cpf':
      return normalizeCpf(value);
    case 'cnpj':
      return normalizeCnpj(value);
    case 'accessCode':
      return normalizeAccessCode(value);
    default:
      return blankToNull(value);
  }
}
