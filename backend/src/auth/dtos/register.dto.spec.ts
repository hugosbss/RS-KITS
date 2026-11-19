import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { PASSWORD_MIN_LENGTH, RegisterDto } from './register.dto';
import { UpdateUserDto } from '../../users/dtos/update-user.dto';
import { UserRole } from '../../prisma/enums/user-role.enum';

function collect(errors: readonly ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...collect(error.children ?? []),
  ]);
}

function errorsFor<T extends object>(
  cls: new () => T,
  payload: unknown,
): string[] {
  return collect(
    validateSync(plainToInstance(cls, payload) as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
}

const base = {
  name: 'Maria Souza',
  password: 'Senha123',
  role: UserRole.OPERATOR,
};

describe('RegisterDto', () => {
  it('aceita cadastro mínimo de operador sem e-mail, cpf ou cnpj', () => {
    expect(errorsFor(RegisterDto, base)).toEqual([]);
  });

  it('normaliza e-mail, cpf e cnpj antes de validar', () => {
    const instance = plainToInstance(RegisterDto, {
      ...base,
      email: '  MARIA@RSKits.com.BR ',
      cpf: '529.982.247-25',
      cnpj: '11.222.333/0001-81',
      accessCode: '  kit-2026 ',
    });
    validateSync(instance);
    expect(instance.email).toBe('maria@rskits.com.br');
    expect(instance.cpf).toBe('52998224725');
    expect(instance.cnpj).toBe('11222333000181');
    expect(instance.accessCode).toBe('KIT-2026');
  });

  it('trata e-mail em branco como ausente, em vez de rejeitar', () => {
    expect(errorsFor(RegisterDto, { ...base, email: '   ' })).toEqual([]);
  });

  it('rejeita CPF com dígito verificador inválido', () => {
    expect(
      errorsFor(RegisterDto, { ...base, cpf: '529.982.247-26' }).join(' '),
    ).toContain('CPF inválido');
  });

  it('rejeita CNPJ com dígito verificador inválido', () => {
    expect(
      errorsFor(RegisterDto, { ...base, cnpj: '11.222.333/0001-82' }).join(' '),
    ).toContain('CNPJ inválido');
  });

  it('rejeita e-mail malformado', () => {
    expect(
      errorsFor(RegisterDto, { ...base, email: 'maria@' }).length,
    ).toBeGreaterThan(0);
  });

  it('exige nome', () => {
    expect(errorsFor(RegisterDto, { ...base, name: '' }).join(' ')).toContain(
      'Nome é obrigatório',
    );
  });

  it('exige senha mínima com mensagem compreensível', () => {
    const curta = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);
    expect(
      errorsFor(RegisterDto, { ...base, password: curta }).join(' '),
    ).toContain(`Senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`);
  });

  it('exige código de acesso com tamanho mínimo', () => {
    expect(
      errorsFor(RegisterDto, { ...base, accessCode: 'AB' }).length,
    ).toBeGreaterThan(0);
    expect(errorsFor(RegisterDto, { ...base, accessCode: 'ABCD' })).toEqual([]);
  });

  it('rejeita perfil desconhecido', () => {
    expect(
      errorsFor(RegisterDto, { ...base, role: 'SUPERADMIN' }).join(' '),
    ).toContain('Perfil inválido');
  });

  it('rejeita campo inesperado em vez de ignorá-lo', () => {
    expect(
      errorsFor(RegisterDto, { ...base, isAdmin: true }).length,
    ).toBeGreaterThan(0);
  });
});

describe('UpdateUserDto', () => {
  it('aceita atualização parcial vazia sem erro de campo obrigatório', () => {
    expect(errorsFor(UpdateUserDto, {})).toEqual([]);
  });

  it('rejeita CPF inválido na atualização', () => {
    expect(
      errorsFor(UpdateUserDto, { cpf: '529.982.247-26' }).join(' '),
    ).toContain('CPF inválido');
  });

  it('rejeita CNPJ inválido na atualização', () => {
    expect(
      errorsFor(UpdateUserDto, { cnpj: '11222333000182' }).join(' '),
    ).toContain('CNPJ inválido');
  });

  it('normaliza documentos enviados com máscara', () => {
    const instance = plainToInstance(UpdateUserDto, { cpf: '529.982.247-25' });
    validateSync(instance);
    expect(instance.cpf).toBe('52998224725');
  });

  it('rejeita nome em branco para não apagar o nome do usuário', () => {
    expect(errorsFor(UpdateUserDto, { name: '' }).join(' ')).toContain(
      'Nome não pode ser vazio',
    );
  });

  it('rejeita senha abaixo do mínimo', () => {
    expect(
      errorsFor(UpdateUserDto, { password: '123' }).length,
    ).toBeGreaterThan(0);
  });
});
