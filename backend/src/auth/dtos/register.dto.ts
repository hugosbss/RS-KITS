import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  Validate,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { UserRole } from '../../prisma/enums/user-role.enum';
import {
  isValidCnpj,
  isValidCpf,
  normalizeAccessCode,
  normalizeCnpj,
  normalizeCpf,
  normalizeEmail,
} from '../../common/utils/documents';

export const PASSWORD_MIN_LENGTH = 6;

/** String em branco vira `undefined` para não falhar em campos opcionais. */
const blankToUndefined = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text === '' ? undefined : text;
};

@ValidatorConstraint({ name: 'document', async: false })
class DocumentConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (value === undefined || value === null) return true;
    const text = String(value).trim();
    if (text === '') return true;
    if (args.property === 'cpf') return isValidCpf(text);
    if (args.property === 'cnpj') return isValidCnpj(text);
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    if (args.property === 'cpf') return 'CPF inválido';
    if (args.property === 'cnpj') return 'CNPJ inválido';
    return `${args.property} inválido`;
  }
}

const DocumentValidator = () => Validate(DocumentConstraint);

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(160)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  /** Opcional. Em branco, é normalizado para ausente antes da validação. */
  @IsOptional()
  @Transform(({ value }) => {
    const email = normalizeEmail(value as string | null);
    return email ?? undefined;
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @IsOptional()
  @Transform(({ value }) => {
    const cpf = normalizeCpf(value as string | null);
    return cpf ?? undefined;
  })
  @DocumentValidator()
  cpf?: string;

  @IsOptional()
  @Transform(({ value }) => {
    const cnpj = normalizeCnpj(value as string | null);
    return cnpj ?? undefined;
  })
  @DocumentValidator()
  cnpj?: string;

  /**
   * Código de acesso: identificador ALTERNATIVO de login do organizador.
   * Identificador, nunca substitui a senha; não volta em log nem em pacote.
   */
  @IsOptional()
  @Transform(({ value }) => {
    const code = normalizeAccessCode(value as string | null);
    return code ?? undefined;
  })
  @IsString()
  @Length(4, 64, {
    message: 'Código de acesso deve ter entre 4 e 64 caracteres',
  })
  accessCode?: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
  })
  @MaxLength(128)
  password: string;

  @IsEnum(UserRole, { message: 'Perfil inválido' })
  role: UserRole;

  @IsOptional()
  @Transform(blankToUndefined)
  @IsString()
  @MaxLength(40)
  phone?: string;

  /**
   * Organizador responsável. Obrigatório quando um ADMIN cria um OPERATOR;
   * o serviço valida existência e perfil, e um ORGANIZADOR não pode informar
   * o vínculo de outro organizador.
   */
  @IsOptional()
  @Transform(blankToUndefined)
  @IsString()
  organizerId?: string;
}
