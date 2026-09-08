import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe seu CPF ou e-mail' })
  identifier: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
