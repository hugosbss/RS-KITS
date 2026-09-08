import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import {
  existsSync,
  mkdirSync,
  appendFileSync,
  readFileSync,
  renameSync,
  statSync,
} from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

export type AuditFieldChange = {
  campo: string;
  de: unknown;
  para: unknown;
};

export interface AuditEntry {
  id: string;
  timestamp: string;
  usuario: {
    id: string;
    nome: string | null;
    papel: string;
  } | null;
  acao: string;
  entidade: string;
  entidadeId?: string;
  evento?: string;
  campo?: string;
  de?: unknown;
  para?: unknown;
  detalhe?: string;
  origem?: string;
}

const MAX_LOG_BYTES = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class AuditService implements OnModuleInit {
  private readonly logger = new Logger(AuditService.name);
  private readonly logsDir = join(process.cwd(), 'logs');
  private readonly logFile = join(this.logsDir, 'audit.log');

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    if (!existsSync(this.logsDir)) {
      mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private pad(value: number) {
    return String(value).padStart(2, '0');
  }

  private now() {
    const d = new Date();
    return `${this.pad(d.getDate())}/${this.pad(d.getMonth() + 1)}/${d.getFullYear()} ${this.pad(d.getHours())}:${this.pad(d.getMinutes())}:${this.pad(d.getSeconds())}`;
  }

  private rotateIfNeeded() {
    if (!existsSync(this.logFile)) return;
    try {
      const size = statSync(this.logFile).size;
      if (size >= MAX_LOG_BYTES) {
        const rotating = join(this.logsDir, `audit-${Date.now()}.log`);
        renameSync(this.logFile, rotating);
      }
    } catch (err) {
      this.logger.warn(`Falha ao rotacionar o log: ${String(err)}`);
    }
  }

  /**
   * Grava uma linha JSON no arquivo de log.
   * Se o usuário informado não tiver nome, resolve o nome no banco pelo id.
   */
  async register(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry> {
    this.rotateIfNeeded();

    let usuario = entry.usuario ?? null;
    if (usuario && !usuario.nome) {
      const user = await this.prisma.user
        .findUnique({ where: { id: usuario.id } })
        .catch(() => null);
      if (user) {
        usuario = {
          id: user.id,
          nome: user.name,
          papel: user.role,
        };
      }
    }

    const line: AuditEntry = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: this.now(),
      ...entry,
      usuario,
    };

    try {
      appendFileSync(this.logFile, `${JSON.stringify(line)}\n`, 'utf8');
    } catch (err) {
      this.logger.error(`Falha ao escrever no log de auditoria: ${String(err)}`);
    }
    return line;
  }

  /**
   * Grava uma linha para cada campo alterado (antes/depois).
   */
  async logFieldChanges(
    fields: AuditFieldChange[],
    context: {
      usuario: { id: string; nome: string; papel: string };
      entidade: string;
      entidadeId?: string;
      evento?: string;
      acao?: string;
      origem?: string;
    },
  ) {
    for (const change of fields) {
      await this.register({
        usuario: context.usuario,
        acao: context.acao ?? 'ALTERACAO',
        entidade: context.entidade,
        entidadeId: context.entidadeId,
        evento: context.evento,
        campo: change.campo,
        de: change.de,
        para: change.para,
        origem: context.origem,
      });
    }
  }

  readLog(): AuditEntry[] {
    if (!existsSync(this.logFile)) return [];
    const raw = readFileSync(this.logFile, 'utf8');
    const entries: AuditEntry[] = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        entries.push(JSON.parse(line) as AuditEntry);
      } catch {
        // ignora linhas corrompidas
      }
    }
    return entries;
  }
}