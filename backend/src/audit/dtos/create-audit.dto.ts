import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAuditDto {
  @IsString()
  @IsNotEmpty({ message: 'ação é obrigatória' })
  acao: string;

  @IsOptional()
  @IsString()
  entidade?: string;

  @IsOptional()
  @IsString()
  entidadeId?: string;

  @IsOptional()
  @IsString()
  evento?: string;

  @IsOptional()
  campo?: string;

  @IsOptional()
  de?: unknown;

  @IsOptional()
  para?: unknown;

  @IsOptional()
  @IsString()
  detalhe?: string;

  @IsOptional()
  @IsString()
  origem?: string;
}