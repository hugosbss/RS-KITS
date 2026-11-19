import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';

/** Versão do protocolo desktop <-> web. Incrementar em Breaking changes. */
export const SYNC_PROTOCOL_VERSION = 1;

export const SYNC_ENTITY_TYPES = [
  'ATHLETE',
  'EVENT',
  'DELIVERY',
  'REVERSAL',
  'AUDIT',
  'USER',
] as const;

export const SYNC_OP_TYPES = [
  'UPSERT',
  'DELETE',
  'DELIVER',
  'REVERSE',
  'RESET_DELIVERIES',
  'EDIT_EVENT',
] as const;

@ValidatorConstraint({ name: 'baseVersion', async: false })
class BaseVersionConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    void args;
    if (value === undefined || value === null) return true;
    return typeof value === 'number' && Number.isInteger(value) && value >= 0;
  }

  defaultMessage(): string {
    return 'baseVersion deve ser um inteiro >= 0';
  }
}

const BaseVersionValidator = () => Validate(BaseVersionConstraint);

export class SyncOperationDto {
  /** Identificador único gerado no desktop. Reenvio não duplica nada. */
  @IsString()
  @IsNotEmpty({ message: 'operationId é obrigatório' })
  @MaxLength(120)
  operationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  eventId?: string;

  @IsIn(SYNC_ENTITY_TYPES, { message: 'entityType inválido' })
  entityType: (typeof SYNC_ENTITY_TYPES)[number];

  @IsString()
  @IsNotEmpty({ message: 'entityId é obrigatório' })
  @MaxLength(80)
  entityId: string;

  @IsIn(SYNC_OP_TYPES, { message: 'opType inválido' })
  opType: (typeof SYNC_OP_TYPES)[number];

  /**
   * Versão do registro no momento da alteração local. Null significa
   * "não havia versão conhecida" (criação).
   */
  @IsOptional()
  @BaseVersionValidator()
  @Type(() => Number)
  baseVersion?: number | null;

  @IsObject({ message: 'payload deve ser um objeto' })
  payload: Record<string, unknown>;

  /** Relógio local apenas como informação de diagnóstico. */
  @IsOptional()
  @IsISO8601()
  localUpdatedAt?: string;
}

export class SyncPushDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  protocol: number;

  @IsString()
  @IsNotEmpty({ message: 'deviceId é obrigatório' })
  @MaxLength(120)
  deviceId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Nenhuma operação para sincronizar' })
  @ArrayMaxSize(500, { message: 'Máximo de 500 operações por lote' })
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  operations: SyncOperationDto[];
}

export class SyncPullQueryDto {
  /** Cursor devolvido pela chamada anterior. Ausente = do início. */
  @IsOptional()
  @Type(() => Number)
  cursor?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  eventId?: string;
}

export class SyncConflictResolveDto {
  @IsString()
  @IsNotEmpty()
  conflictId: string;

  @IsIn(['KEEP_LOCAL', 'KEEP_CENTRAL'], { message: 'resolution inválida' })
  resolution: 'KEEP_LOCAL' | 'KEEP_CENTRAL';
}

export class SyncStatusQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  eventId?: string;
}
