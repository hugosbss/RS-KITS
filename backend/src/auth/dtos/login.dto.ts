import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  normalizeAccessCode,
  normalizeCnpj,
  normalizeCpf,
  normalizeEmail,
} from '../../common/utils/documents';

/**
 * Reduz o identificador digitado à forma canônica gravada no banco:
 * documentos ficam só com dígitos, e-mail em minúsculas, código maiúsculo.
 */
export function canonicalizeIdentifier(raw: unknown): string {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (text === '') return text;

  const digits = text.replace(/\D+/g, '');
  if (
    digits.length > 0 &&
    digits.length === text.replace(/[\s.\-/]/g, '').length
  ) {
    return digits.length <= 11
      ? (normalizeCpf(digits) ?? digits)
      : (normalizeCnpj(digits) ?? digits);
  }
  if (text.includes('@')) return normalizeEmail(text) ?? text;
  return normalizeAccessCode(text) ?? text;
}

export class LoginDto {
  /**
   * Aceita e-mail, CPF, CNPJ ou código de acesso. A entrada com máscara
   * encontra o mesmo registro gravado sem máscara.
   */
  @IsString()
  @IsNotEmpty({
    message: 'Informe seu CPF, CNPJ, e-mail ou código de acesso',
  })
  @Transform(({ value }) => canonicalizeIdentifier(value))
  identifier: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;

  /** Identifica o computador no primeiro login online (rastreabilidade). */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceId?: string;
}
