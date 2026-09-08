import {
  ArrayMaxSize,
  ArrayMinSize,
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

export class CreateEventDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do evento é obrigatório' })
  name: string;

  @IsDateString({}, { message: 'Data inválida' })
  date: string;

  @IsOptional()
  @IsString()
  place?: string;

  @IsOptional()
  @IsEnum(EventStatus, { message: 'Status inválido' })
  status?: EventStatus;
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
  status?: EventStatus;
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