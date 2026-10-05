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
import { RegisterDto, PASSWORD_MIN_LENGTH } from './dtos/register.dto';
import { canonicalizeIdentifier } from './dtos/login.dto';
import { AuditService } from '../audit/audit.service';
import {
  normalizeAccessCode,
  normalizeCnpj,
  normalizeCpf,
  normalizeEmail,
} from '../common/utils/documents';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private audit: AuditService,
  ) {}

  /**
   * Registro de novos usuários. Regras de negócio:
   * - ADMIN: criado apenas por um ADMIN.
   * - ORGANIZADOR / OPERATOR: criados por ADMIN ou ORGANIZADOR.
   * - OPERATOR criado por ORGANIZADOR fica vinculado a esse organizador.
   * - OPERATOR criado por ADMIN precisa de um organizador válido e existente.
   */
  async register(
    dto: RegisterDto,
    creator: { id: string; role: UserRole },
  ) {
    const creatorRole = creator.role;

    if (dto.role === UserRole.ADMIN && creatorRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas um ADMIN pode criar outro usuário ADMIN',
      );
    }

    if (creatorRole === UserRole.OPERATOR) {
      throw new ForbiddenException(
        'OPERADOR não possui permissão para criar usuários',
      );
    }

    if (
      creatorRole === UserRole.ORGANIZADOR &&
      dto.role !== UserRole.OPERATOR
    ) {
      throw new ForbiddenException(
        'ORGANIZADOR só pode criar usuários do tipo OPERATOR',
      );
    }

    if (dto.password.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `Senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
      );
    }

    const email = normalizeEmail(dto.email);
    const cpf = normalizeCpf(dto.cpf);
    const cnpj = normalizeCnpj(dto.cnpj);
    const phone = dto.phone?.trim() || null;
    const accessCode = normalizeAccessCode(dto.accessCode);

    if (dto.role === UserRole.ADMIN && !email) {
      throw new BadRequestException('E-mail é obrigatório para ADMIN');
    }

    await this.assertDocumentsFree({ email, cpf, cnpj });
    await this.assertAccessCodeFree(accessCode);

    // Resolve o vínculo com o organizador respeitando quem está criando.
    const organizerId = await this.resolveOrganizerId(dto, creator);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        cpf,
        cnpj,
        accessCode,
        passwordHash,
        role: dto.role,
        phone,
        organizerId,
      },
    });

    const { passwordHash: _ph, accessCode: _ac, ...result } = user;
    await this.audit.register({
      usuario: { id: creator.id, nome: '', papel: creator.role },
      acao: 'REGISTRO_USUARIO',
      entidade: 'USUARIO',
      entidadeId: user.id,
      detalhe: `Usuário criado: ${user.name} (${user.role})${
        organizerId ? ` vinculado a ${organizerId}` : ''
      }`,
      origem: 'SISTEMA',
    });
    return { user: result };
  }

  /**
   * Organizador responsável de um OPERATOR.
   * - ORGANIZADOR criando: sempre ele mesmo; nunca aceita outro vínculo.
   * - ADMIN criando OPERATOR: precisa informar um organizador existente com
   *   perfil ORGANIZADOR. Sem isso o operador não enxergaria nenhum evento.
   */
  private async resolveOrganizerId(
    dto: RegisterDto,
    creator: { id: string; role: UserRole },
  ): Promise<string | null> {
    if (dto.role !== UserRole.OPERATOR) {
      if (dto.organizerId) {
        throw new BadRequestException(
          'organizerId só se aplica a usuários do tipo OPERATOR',
        );
      }
      return null;
    }

    if (creator.role === UserRole.ORGANIZADOR) {
      if (dto.organizerId && dto.organizerId !== creator.id) {
        throw new ForbiddenException(
          'ORGANIZADOR só pode criar operadores vinculados a si mesmo',
        );
      }
      return creator.id;
    }

    // ADMIN: o vínculo é obrigatório para o operador enxergar eventos.
    if (!dto.organizerId) {
      throw new BadRequestException(
        'Selecione o organizador responsável pelo operador',
      );
    }

    const organizer = await this.prisma.user.findUnique({
      where: { id: dto.organizerId },
      select: { id: true, role: true, name: true },
    });
    if (!organizer) {
      throw new BadRequestException('Organizador informado não existe');
    }
    if (organizer.role !== UserRole.ORGANIZADOR) {
      throw new BadRequestException(
        'O usuário informado não possui o perfil ORGANIZADOR',
      );
    }
    return organizer.id;
  }

  /** Erros claros para documento duplicado — nunca 500 genérico. */
  private async assertDocumentsFree(documents: {
    email?: string | null;
    cpf?: string | null;
    cnpj?: string | null;
  }) {
    if (documents.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: documents.email },
        select: { id: true },
      });
      if (existing) throw new ConflictException('E-mail já cadastrado');
    }
    if (documents.cpf) {
      const existing = await this.prisma.user.findUnique({
        where: { cpf: documents.cpf },
        select: { id: true },
      });
      if (existing) throw new ConflictException('CPF já cadastrado');
    }
    if (documents.cnpj) {
      const existing = await this.prisma.user.findUnique({
        where: { cnpj: documents.cnpj },
        select: { id: true },
      });
      if (existing) throw new ConflictException('CNPJ já cadastrado');
    }
  }

  /**
   * Código de acesso precisa ser único: login ambíguo é proibido.
   * A busca é feita também sobre a forma legada (com/sem máscara) para não
   * criar dois códigos equivalentes apontando para pessoas diferentes.
   */
  private async assertAccessCodeFree(accessCode: string | null) {
    if (!accessCode) return;
    const existing = await this.prisma.user.findUnique({
      where: { accessCode },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Código de acesso já cadastrado');
    }
  }

  async login(identifier: string, password: string, deviceId?: string) {
    const canonical = canonicalizeIdentifier(identifier);

    // `findMany` (e não `findFirst`) de propósito: o mesmo texto pode existir
    // em campos diferentes de usuários diferentes (ex.: o e-mail de alguém
    // igual ao CPF de outro). Logar no primeiro "achado" seria arbitrário e
    // poderia abrir a conta errada — nesses casos o login é recusado.
    const matches = await this.prisma.user.findMany({
      where: {
        OR: [
          { email: canonical },
          { cpf: canonical },
          { cnpj: canonical },
          { accessCode: canonical },
        ],
      },
      select: { id: true, name: true },
      take: 2,
    });

    if (matches.length > 1) {
      await this.audit.register({
        usuario: null,
        acao: 'LOGIN_BLOQUEADO',
        entidade: 'AUTH',
        detalhe: `Identificador ambíguo entre ${matches.length} contas`,
        origem: 'SISTEMA',
      });
      throw new UnauthorizedException(
        'Identificador ambíguo. Use o e-mail ou procure o administrador.',
      );
    }

    const user = matches.length
      ? await this.prisma.user.findUnique({ where: { id: matches[0].id } })
      : null;

    if (!user) {
      await this.audit.register({
        usuario: null,
        acao: 'LOGIN_FALHOU',
        entidade: 'AUTH',
        detalhe: 'Tentativa de login com identificador inválido',
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

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizerId: user.organizerId,
    };
    // O hash e o código de acesso nunca saem da API.
    const { passwordHash: _ph, accessCode: _ac, ...result } = user;

    await this.audit.register({
      usuario: { id: user.id, nome: user.name, papel: user.role },
      acao: 'LOGIN',
      entidade: 'AUTH',
      entidadeId: user.id,
      detalhe: deviceId
        ? `Login realizado com sucesso (dispositivo ${deviceId})`
        : 'Login realizado com sucesso',
      origem: 'SISTEMA',
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }
}
