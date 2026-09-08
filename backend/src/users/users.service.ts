import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../prisma/enums/user-role.enum';
import { UpdateUserDto } from './dtos/update-user.dto';
import { AuditService, type AuditFieldChange } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ADMIN: vê todos os usuários.
  // ORGANIZADOR: vê a si mesmo e os OPERATOR vinculados a ele.
  // OPERATOR: vê apenas a si mesmo.
  async findAll(currentUser: { id: string; role: UserRole }) {
    if (currentUser.role === UserRole.ADMIN) {
      return this.prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
        select: this.userSelect(),
      });
    }

    if (currentUser.role === UserRole.ORGANIZADOR) {
      return this.prisma.user.findMany({
        where: {
          OR: [
            { id: currentUser.id },
            { role: UserRole.OPERATOR, organizerId: currentUser.id },
          ],
        },
        orderBy: { createdAt: 'asc' },
        select: this.userSelect(),
      });
    }

    return this.prisma.user.findMany({
      where: { id: currentUser.id },
      select: this.userSelect(),
    });
  }

  async findOne(id: string, currentUser: { id: string; role: UserRole }) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect(),
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const canAccess =
      currentUser.role === UserRole.ADMIN ||
      currentUser.id === id ||
      (currentUser.role === UserRole.ORGANIZADOR &&
        user.role === UserRole.OPERATOR &&
        user.organizerId === currentUser.id);

    if (!canAccess) {
      throw new ForbiddenException('Acesso negado');
    }

    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUser: { id: string; role: UserRole },
  ) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isSelf = currentUser.id === id;

    // Apenas ADMIN pode alterar outros usuários ou perfis não vinculados.
    if (!isSelf) {
      const canManage =
        currentUser.role === UserRole.ADMIN ||
        (currentUser.role === UserRole.ORGANIZADOR &&
          target.role === UserRole.OPERATOR &&
          target.organizerId === currentUser.id);
      if (!canManage) {
        throw new ForbiddenException(
          'Sem permissão para alterar esse usuário',
        );
      }
    }

    // Apenas ADMIN pode alterar a role (perfil).
    if (currentUser.role !== UserRole.ADMIN && dto.role) {
      throw new ForbiddenException('Apenas ADMIN pode alterar o perfil');
    }

    // Strings vazias viram null (evita colisão com campos únicos em branco).
    const email = dto.email === undefined ? undefined : normalize(dto.email);
    const cpf = dto.cpf === undefined ? undefined : normalize(dto.cpf);
    const cnpj = dto.cnpj === undefined ? undefined : normalize(dto.cnpj);
    const phone = dto.phone === undefined ? undefined : normalize(dto.phone);

    // Conflitos de e-mail/CPF/CNPJ devem retornar erro claro (não 500).
    if (email && email !== target.email) {
      const dup = await this.prisma.user.findUnique({ where: { email } });
      if (dup) throw new ConflictException('E-mail já cadastrado');
    }
    if (cpf && cpf !== target.cpf) {
      const dup = await this.prisma.user.findFirst({ where: { cpf } });
      if (dup) throw new ConflictException('CPF já cadastrado');
    }
    if (cnpj && cnpj !== target.cnpj) {
      const dup = await this.prisma.user.findFirst({ where: { cnpj } });
      if (dup) throw new ConflictException('CNPJ já cadastrado');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        cpf,
        cnpj,
        email,
        phone,
        role: dto.role,
        ...(dto.password
          ? { passwordHash: await bcrypt.hash(dto.password, 10) }
          : {}),
      },
      select: this.userSelect(),
    });

    // Auditoria: antes/depois das informações de usuário alteradas.
    const fields: AuditFieldChange[] = [];
    for (const key of ['name', 'cpf', 'cnpj', 'email', 'phone', 'role'] as const) {
      const beforeValue = (target as Record<string, unknown>)[key];
      const afterValue = (updated as Record<string, unknown>)[key];
      if (beforeValue !== afterValue) {
        fields.push({ campo: key, de: beforeValue, para: afterValue });
      }
    }
    if (fields.length || dto.password) {
      if (dto.password) {
        fields.push({ campo: 'password', de: '[oculto]', para: '[alterado]' });
      }
      await this.audit.logFieldChanges(fields, {
        usuario: { id: currentUser.id, nome: '', papel: currentUser.role },
        entidade: 'USUARIO',
        entidadeId: id,
        acao: 'EDICAO_USUARIO',
        origem: 'SISTEMA',
      });
    }

    return updated;
  }

  async remove(id: string, currentUser: { id: string; role: UserRole }) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('Usuário não encontrado');
    }
    if (currentUser.id === id) {
      throw new ForbiddenException('Não é possível remover a si mesmo');
    }
    const canRemove =
      currentUser.role === UserRole.ADMIN ||
      (currentUser.role === UserRole.ORGANIZADOR &&
        target.role === UserRole.OPERATOR &&
        target.organizerId === currentUser.id);
    if (!canRemove) {
      throw new ForbiddenException(
        'Sem permissão para remover esse usuário',
      );
    }
    await this.prisma.user.delete({ where: { id } });

    await this.audit.register({
      usuario: { id: currentUser.id, nome: '', papel: currentUser.role },
      acao: 'EXCLUSAO_USUARIO',
      entidade: 'USUARIO',
      entidadeId: id,
      detalhe: `Usuário removido: ${target.name} (${target.role})`,
      de: {
        name: target.name,
        email: target.email,
        cpf: target.cpf,
        role: target.role,
      },
      para: null,
      origem: 'SISTEMA',
    });

    return { deleted: true };
  }

  private userSelect() {
    return {
      id: true,
      name: true,
      email: true,
      cpf: true,
      cnpj: true,
      role: true,
      phone: true,
      organizerId: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}

function normalize(value?: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
