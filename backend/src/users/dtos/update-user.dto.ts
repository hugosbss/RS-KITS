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
import { PASSWORD_MIN_LENGTH } from '../../auth/dtos/register.dto';

@ValidatorConstraint({ name: 'updateDocument', async: false })
class UpdateDocumentConstraint implements ValidatorConstraintInterface {
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

const DocumentValidator = () => Validate(UpdateDocumentConstraint);

const optional = (normalize: (value: string | null) => string | null) =>
  Transform(({ value }: { value: unknown }) => {
    const normalized = normalize(value as string | null);
    return normalized ?? undefined;
  });

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nome não pode ser vazio' })
  @MaxLength(160)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string;

  @IsOptional()
  @optional(normalizeCpf)
  @DocumentValidator()
  cpf?: string;

  @IsOptional()
  @optional(normalizeCnpj)
  @DocumentValidator()
  cnpj?: string;

  @IsOptional()
  @optional(normalizeEmail)
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @IsOptional()
  @optional(normalizeAccessCode)
  @IsString()
  @Length(4, 64, { message: 'Código de acesso deve ter entre 4 e 64 caracteres' })
  accessCode?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    const text = String(value).trim();
    return text === '' ? undefined : text;
  })
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
  })
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Perfil inválido' })
  role?: UserRole;

  /**
   * Vínculo com o organizador. Só o ADMIN pode alterá-lo — usado para
   * regularizar operadores antigos criados sem organizador. String vazia solta
   * o vínculo.
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null) return '';
    if (value === undefined) return undefined;
    const text = String(value).trim();
    return text === '' ? '' : text;
  })
  @IsString()
  organizerId?: string;
}
