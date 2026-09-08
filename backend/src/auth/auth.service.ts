import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../prisma/enums/user-role.enum';
import { RegisterDto } from './dtos/register.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private audit: AuditService,
  ) {}

  // Registro de novos usuários. Regras de negócio:
  // - ADMIN: criado apenas por um ADMIN.
  // - ORGANIZADOR / OPERATOR: criados por ADMIN ou ORGANIZADOR.
  // - OPERATOR criado por ORGANIZADOR fica vinculado a esse organizador (organizerId).
  async register(
    dto: RegisterDto,
    creator: { id: string; role: UserRole },
  ) {
    const creatorRole = creator.role;

    // Apenas ADMIN pode criar outro usuário ADMIN.
    if (dto.role === UserRole.ADMIN && creatorRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas um ADMIN pode criar outro usuário ADMIN',
      );
    }

    // OPERADOR não pode criar usuários.
    if (creatorRole === UserRole.OPERATOR) {
      throw new ForbiddenException(
        'OPERADOR não possui permissão para criar usuários',
      );
    }

    // ORGANIZADOR só pode criar OPERATOR.
    if (
      creatorRole === UserRole.ORGANIZADOR &&
      dto.role !== UserRole.OPERATOR
    ) {
      throw new ForbiddenException(
        'ORGANIZADOR só pode criar usuários do tipo OPERATOR',
      );
    }

    // Campos opcionais: strings vazias viram null para não colidir com
    // constraints únicas (cnpj, cpf, email) quando deixados em branco.
    const email = normalize(dto.email);
    const cpf = normalize(dto.cpf);
    const cnpj = normalize(dto.cnpj);
    const phone = normalize(dto.phone);

    // ADMIN exige e-mail obrigatório (CPF opcional).
    if (dto.role === UserRole.ADMIN && !email) {
      throw new BadRequestException('E-mail é obrigatório para ADMIN');
    }

    if (email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new ConflictException('E-mail já cadastrado');
      }
    }
    if (cpf) {
      const existingCpf = await this.prisma.user.findFirst({
        where: { cpf },
      });
      if (existingCpf) {
        throw new ConflictException('CPF já cadastrado');
      }
    }
    if (cnpj) {
      const existingCnpj = await this.prisma.user.findFirst({
        where: { cnpj },
      });
      if (existingCnpj) {
        throw new ConflictException('CNPJ já cadastrado');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const organizerId =
      creatorRole === UserRole.ORGANIZADOR &&
      dto.role === UserRole.OPERATOR
        ? creator.id
        : null;

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email,
        cpf,
        cnpj,
        passwordHash,
        role: dto.role,
        phone,
        organizerId,
      },
    });

    const { passwordHash: _ph, ...result } = user;
    await this.audit.register({
      usuario: {
        id: creator.id,
        nome: '',
        papel: creator.role,
      },
      acao: 'REGISTRO_USUARIO',
      entidade: 'USUARIO',
      entidadeId: user.id,
      detalhe: `Usuário criado: ${user.name} (${user.role})${organizerId ? ` vinculado a ${organizerId}` : ''}`,
      origem: 'SISTEMA',
    });
    return { user: result };
  }

  async login(identifier: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { cpf: identifier }, { cnpj: identifier }],
      },
    });
    if (!user) {
      await this.audit.register({
        usuario: null,
        acao: 'LOGIN_FALHOU',
        entidade: 'AUTH',
        detalhe: `Tentativa de login com identificador inválido`,
        origem: 'SISTEMA',
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      await this.audit.register({
        usuario: { id: user.id, nome: user.name, papel: user.role },
        acao: 'LOGIN_FALHOU',
        entidade: 'AUTH',
        detalhe: 'Senha incorreta',
        origem: 'SISTEMA',
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const { passwordHash: _ph, ...result } = user;

    await this.audit.register({
      usuario: { id: user.id, nome: user.name, papel: user.role },
      acao: 'LOGIN',
      entidade: 'AUTH',
      entidadeId: user.id,
      detalhe: 'Login realizado com sucesso',
      origem: 'SISTEMA',
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }
}

function normalize(value?: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
