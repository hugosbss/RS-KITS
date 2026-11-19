import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../prisma/enums/user-role.enum';
import { UpdateUserDto } from './dtos/update-user.dto';
import { AuditService, type AuditFieldChange } from '../audit/audit.service';
import {
  normalizeAccessCode,
  normalizeCnpj,
  normalizeCpf,
  normalizeEmail,
} from '../common/utils/documents';

const BCRYPT_ROUNDS = 10;

type CurrentUser = { id: string; role: UserRole; organizerId?: string | null };

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * ADMIN: todos.
   * ORGANIZADOR: si mesmo e os OPERATOR vinculados a ele.
   * OPERATOR: apenas si mesmo.
   */
  async findAll(currentUser: CurrentUser, eventId?: string) {
    if (eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        select: { organizers: { select: { userId: true } } },
      });
      if (!event) throw new NotFoundException('Evento não encontrado');
      const organizerIds = event.organizers.map((link) => link.userId);
      if (
        currentUser.role === UserRole.ORGANIZADOR &&
        !organizerIds.includes(currentUser.id)
      )
        throw new ForbiddenException('Acesso negado ao evento');
      if (currentUser.role === UserRole.OPERATOR) {
        if (
          !currentUser.organizerId ||
          !organizerIds.includes(currentUser.organizerId)
        )
          throw new ForbiddenException('Acesso negado ao evento');
        return this.prisma.user.findMany({
          where: { id: currentUser.id },
          select: this.userSelect(),
        });
      }
      const ids =
        currentUser.role === UserRole.ADMIN ? organizerIds : [currentUser.id];
      return this.prisma.user.findMany({
        where: {
          OR: [
            { id: { in: ids }, role: UserRole.ORGANIZADOR },
            { organizerId: { in: ids }, role: UserRole.OPERATOR },
          ],
        },
        orderBy: { createdAt: 'asc' },
        select: this.userSelect(),
      });
    }
    if (currentUser.role === UserRole.ADMIN) {
      return this.prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
        select: this.userSelect(),
      });
    }

    if (currentUser.role === UserRole.ORGANIZADOR) {
      return this.prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { eventLinks: { some: {} } },
                { organizer: { eventLinks: { some: {} } } },
              ],
            },
          ],
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

  async findOne(id: string, currentUser: CurrentUser) {
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

  async update(id: string, dto: UpdateUserDto, currentUser: CurrentUser) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isSelf = currentUser.id === id;

    if (!isSelf) {
      const canManage =
        currentUser.role === UserRole.ADMIN ||
        (currentUser.role === UserRole.ORGANIZADOR &&
          target.role === UserRole.OPERATOR &&
          target.organizerId === currentUser.id);
      if (!canManage) {
        throw new ForbiddenException('Sem permissão para alterar esse usuário');
      }
    }

    // Perfil e vínculo só o ADMIN altera.
    if (currentUser.role !== UserRole.ADMIN && dto.role) {
      throw new ForbiddenException('Apenas ADMIN pode alterar o perfil');
    }
    if (currentUser.role !== UserRole.ADMIN && dto.organizerId !== undefined) {
      throw new ForbiddenException(
        'Apenas ADMIN pode alterar o vínculo com o organizador',
      );
    }
    if (
      currentUser.role === UserRole.ORGANIZADOR &&
      !isSelf &&
      dto.accessCode !== undefined
    ) {
      throw new ForbiddenException(
        'ORGANIZADOR não pode alterar o código de acesso',
      );
    }

    const email =
      dto.email === undefined ? undefined : normalizeEmail(dto.email);
    const cpf = dto.cpf === undefined ? undefined : normalizeCpf(dto.cpf);
    const cnpj = dto.cnpj === undefined ? undefined : normalizeCnpj(dto.cnpj);
    const accessCode =
      dto.accessCode === undefined
        ? undefined
        : normalizeAccessCode(dto.accessCode);
    const phone =
      dto.phone === undefined ? undefined : dto.phone.trim() || null;

    // Conflitos devem retornar erro claro (nunca 500).
    if (email && email !== target.email) {
      const dup = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (dup) throw new ConflictException('E-mail já cadastrado');
    }
    if (cpf && cpf !== target.cpf) {
      const dup = await this.prisma.user.findUnique({
        where: { cpf },
        select: { id: true },
      });
      if (dup) throw new ConflictException('CPF já cadastrado');
    }
    if (cnpj && cnpj !== target.cnpj) {
      const dup = await this.prisma.user.findUnique({
        where: { cnpj },
        select: { id: true },
      });
      if (dup) throw new ConflictException('CNPJ já cadastrado');
    }
    if (accessCode && accessCode !== target.accessCode) {
      const dup = await this.prisma.user.findUnique({
        where: { accessCode },
        select: { id: true },
      });
      if (dup) throw new ConflictException('Código de acesso já cadastrado');
    }

    // Regularização de vínculo: só ADMIN, apenas para OPERATOR, e o
    // organizador precisa existir e ter o perfil correto.
    let organizerId: string | null | undefined;
    if (dto.organizerId !== undefined) {
      if (target.role !== UserRole.OPERATOR) {
        throw new BadRequestException(
          'Somente usuários do tipo OPERATOR possuem organizador vinculado',
        );
      }
      if (dto.organizerId === '') {
        organizerId = null;
      } else {
        const organizer = await this.prisma.user.findUnique({
          where: { id: dto.organizerId },
          select: { id: true, role: true },
        });
        if (!organizer) {
          throw new BadRequestException('Organizador informado não existe');
        }
        if (organizer.role !== UserRole.ORGANIZADOR) {
          throw new BadRequestException(
            'O usuário informado não possui o perfil ORGANIZADOR',
          );
        }
        organizerId = organizer.id;
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        cpf,
        cnpj,
        email,
        accessCode,
        phone,
        role: dto.role,
        organizerId,
        ...(dto.password
          ? { passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS) }
          : {}),
      },
      select: this.userSelect(),
    });

    const fields: AuditFieldChange[] = [];
    for (const key of [
      'name',
      'cpf',
      'cnpj',
      'email',
      'phone',
      'role',
      'organizerId',
    ] as const) {
      const beforeValue = (target as Record<string, unknown>)[key];
      const afterValue = (updated as Record<string, unknown>)[key];
      if (beforeValue !== afterValue) {
        fields.push({ campo: key, de: beforeValue, para: afterValue });
      }
    }
    if (dto.password) {
      fields.push({ campo: 'password', de: '[oculto]', para: '[alterado]' });
    }
    if (dto.accessCode !== undefined && accessCode !== target.accessCode) {
      // O código é identificador, não segredo: registra apenas que mudou.
      fields.push({ campo: 'accessCode', de: '[anterior]', para: accessCode });
    }
    if (fields.length) {
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

  async remove(id: string, currentUser: CurrentUser) {
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
      throw new ForbiddenException('Sem permissão para remover esse usuário');
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

  /**
   * Lista de organizadores para a interface. Usado no cadastro de operador
   * (ADMIN precisa escolher o responsável) e na regularização de vínculos.
   */
  async listOrganizers(currentUser: CurrentUser) {
    if (currentUser.role === UserRole.OPERATOR) {
      throw new ForbiddenException(
        'OPERADOR não possui permissão para listar organizadores',
      );
    }
    return this.prisma.user.findMany({
      where:
        currentUser.role === UserRole.ADMIN
          ? { role: UserRole.ORGANIZADOR }
          : { id: currentUser.id },
      orderBy: { name: 'asc' },
      select: this.userSelect(),
    });
  }

  private userSelect() {
    return {
      id: true,
      name: true,
      email: true,
      cpf: true,
      cnpj: true,
      accessCode: true,
      role: true,
      phone: true,
      organizerId: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}
