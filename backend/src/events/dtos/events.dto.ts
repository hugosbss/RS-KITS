import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus } from '../enums/event-status.enum';

/** "2026-03-15" -> Date na meia-noite UTC. Evita troca de dia por fuso. */
export function parseEventDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match) {
    const [, year, month, day] = match;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }
  return new Date(value);
}

/** Data do evento no formato AAAA-MM-DD, sempre no fuso do evento (UTC). */
export function formatEventDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do evento é obrigatório' })
  @Type(() => String)
  name: string;

  @IsDateString({}, { message: 'Data inválida' })
  @Type(() => String)
  date: string;

  @IsOptional()
  @IsString()
  place?: string;

  @IsOptional()
  @IsEnum(EventStatus, { message: 'Status inválido' })
  status?: EventStatus;

  /**
   * Organizadores vinculados. Pelo menos um é obrigatório para que o evento
   * fique acessível a alguém. A criação do evento e dos vínculos acontece em
   * uma única transação.
   */
  @IsArray()
  @ArrayMinSize(1, { message: 'Selecione o organizador responsável' })
  @ArrayMaxSize(20)
  @ArrayUnique({ message: 'Organizador duplicado na seleção' })
  @IsString({ each: true })
  organizerIds: string[];
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nome do evento não pode ser vazio' })
  name?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data inválida' })
  date?: string;

  @IsOptional()
  @IsString()
  place?: string;

  @IsOptional()
  @IsEnum(EventStatus, { message: 'Status inválido' })
  status?: string;

  /**
   * Conjunto completo de organizadores desejado. Quando enviado, substitui o
   * conjunto atual em uma única transação (sem remoção silenciosa: o diff é
   * auditado). Ausente = manter como está.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique({ message: 'Organizador duplicado na seleção' })
  @IsString({ each: true })
  organizerIds?: string[];
}

export class AddOrganizerDto {
  @IsString()
  @IsNotEmpty({ message: 'userId é obrigatório' })
  userId: string;
}

export class ImportAthleteDto {
  @IsOptional()
  @IsString()
  num?: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome do atleta é obrigatório' })
  nomeAtleta: string;

  @IsOptional()
  @IsString()
  kit?: string;

  @IsOptional()
  @IsString()
  distancia?: string;

  @IsOptional()
  @IsString()
  fxEtaria?: string;

  @IsOptional()
  @IsString()
  categEspecial?: string;

  @IsOptional()
  @IsString()
  nascto?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Nascimento inválido' })
  @Type(() => String)
  nascimento?: string;

  @IsOptional()
  @IsString()
  sexo?: string;

  @IsOptional()
  @IsString()
  equipe?: string;

  @IsOptional()
  @IsString()
  cidadeUf?: string;

  @IsOptional()
  @IsString()
  camiseta?: string;

  @IsOptional()
  @IsString()
  cpfAtleta?: string;

  @IsOptional()
  @IsString()
  cel?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  quemVaiRetirar?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsString()
  obs1?: string;

  @IsOptional()
  @IsString()
  obs2?: string;

  @IsOptional()
  @IsString()
  alerta?: string;

  @IsOptional()
  @IsString()
  nomeEvento?: string;

  @IsOptional()
  @IsString()
  contato?: string;

  @IsOptional()
  @IsString()
  grauParentesco?: string;

  @IsOptional()
  @IsString()
  celularContato?: string;

  @IsOptional()
  @IsString()
  pin?: string;

  @IsOptional()
  @IsString()
  itensAdicionais?: string;

  @IsOptional()
  @IsString()
  convenioMedico?: string;

  @IsOptional()
  @IsString()
  tipoSanguineo?: string;

  @IsOptional()
  @IsString()
  contatoEmergencia?: string;

  @IsOptional()
  @IsString()
  relacaoAtleta?: string;

  @IsOptional()
  @IsString()
  telefoneEmergencia?: string;
}

export class ImportAthletesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20000, { message: 'Máximo de 20.000 atletas por importação' })
  @ValidateNested({ each: true })
  @Type(() => ImportAthleteDto)
  athletes: ImportAthleteDto[];
}

export class ListAthletesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  offset?: number;
}
