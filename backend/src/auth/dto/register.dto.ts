import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'Operador Silva' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'operador@sportdelivery.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'operador123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.OPERATOR })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
