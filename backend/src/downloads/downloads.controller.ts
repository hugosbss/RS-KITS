import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../prisma/enums/user-role.enum';
import { createHash } from 'crypto';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { readdir, stat, readFile } from 'fs/promises';
import { basename, join } from 'path';

// Pasta com os instaladores do app desktop (Linux/Windows), copiados por
// scripts/copy-desktop-releases.sh
const DOWNLOADS_DIR =
  process.env.DOWNLOADS_DIR ?? join(process.cwd(), 'downloads');

function platformOf(filename: string): string {
  if (/\.(exe)$/i.test(filename) || /-win\.zip$/i.test(filename)) {
    return 'windows';
  }
  if (/\.AppImage$/i.test(filename) || /\.deb$/i.test(filename)) {
    return 'linux';
  }
  if (/\.dmg$/i.test(filename)) {
    return 'mac';
  }
  return 'outro';
}

@Controller('downloads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DownloadsController {
  constructor(private readonly prisma: PrismaService) {}

  private async supportsEmbedding(file: string) {
    if (!/\.exe$/i.test(file) || /setup/i.test(file) || basename(file) !== file)
      return false;
    try {
      const manifest = JSON.parse(
        await readFile(join(DOWNLOADS_DIR, `${file}.json`), 'utf8'),
      );
      return (
        manifest.embeddedDataVersion === 1 &&
        manifest.eventIsolationVersion === 1 &&
        existsSync(join(DOWNLOADS_DIR, file))
      );
    } catch {
      return false;
    }
  }

  private async sendEmbedded(file: string, payload: object, res: Response) {
    if (!(await this.supportsEmbedding(file)))
      throw new BadRequestException(
        'Publique uma nova build Windows com isolamento de eventos e seu arquivo .exe.json correspondente.',
      );
    const data = Buffer.from(JSON.stringify(payload), 'utf8');
    if (data.length > 256 * 1024 * 1024)
      throw new BadRequestException(
        'Evento excede o limite de dados do executavel.',
      );
    const size = Buffer.alloc(8);
    size.writeBigUInt64LE(BigInt(data.length));
    const footer = Buffer.concat([
      createHash('sha256').update(data).digest(),
      size,
      Buffer.from('RSKITS_EMBED_V1'),
    ]);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.replace(/\.exe$/i, '')}-personalizado.exe"`,
    );
    const stream = createReadStream(join(DOWNLOADS_DIR, file));
    stream.on('error', () => res.destroy());
    stream.on('end', () => res.end(Buffer.concat([data, footer])));
    stream.pipe(res, { end: false });
  }

  @Get(':file/clean')
  async clean(@Param('file') file: string, @Res() res: Response) {
    return this.sendEmbedded(
      file,
      { format: 'RSKITS_EMBEDDED', version: 1, mode: 'clean' },
      res,
    );
  }

  @Get(':file/events/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async eventExecutable(
    @Param('file') file: string,
    @Param('eventId') eventId: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const snapshot = await this.prisma.$transaction(
      async (tx) => {
        const event = await tx.event.findUnique({
          where: { id: eventId },
          include: { organizers: true, athletes: true },
        });
        if (!event) throw new NotFoundException('Evento não encontrado.');
        const organizerIds = event.organizers.map((link) => link.userId);
        const users = await tx.user.findMany({
          where: {
            OR: [
              { id: { in: organizerIds } },
              { organizerId: { in: organizerIds }, role: 'OPERATOR' },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            cnpj: true,
            phone: true,
            role: true,
            organizerId: true,
            passwordHash: true,
            accessCode: true,
          },
        });
        const { organizers: _links, athletes, ...metadata } = event;
        return {
          format: 'RSKITS_EMBEDDED',
          version: 1,
          mode: 'event',
          createdBy: req.user.id,
          createdAt: new Date().toISOString(),
          event: metadata,
          organizerIds,
          users,
          athletes,
        };
      },
      { isolationLevel: 'RepeatableRead', timeout: 30000 },
    );
    return this.sendEmbedded(file, snapshot, res);
  }
  // Lista os instaladores disponíveis para download (público).
  @Get()
  async list() {
    const entries = await readdir(DOWNLOADS_DIR).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return [];
        throw error;
      },
    );
    const files = [];
    for (const file of entries) {
      if (!/\.(exe|AppImage|deb|dmg|zip)$/i.test(file)) continue;
      const full = join(DOWNLOADS_DIR, file);
      const info = await stat(full).catch(() => null);
      if (!info || !info.isFile()) continue;
      files.push({
        platform: platformOf(file),
        file,
        size: info.size,
        url: `/api/downloads/${encodeURIComponent(file)}`,
        supportsEmbeddedData: await this.supportsEmbedding(file),
      });
    }
    return files;
  }

  // Transmite o instalador solicitado após autorização do administrador.
  @Get(':file')
  download(@Param('file') file: string, @Res() res: Response) {
    const safe = basename(file);
    if (safe !== file) {
      throw new NotFoundException('Arquivo inválido.');
    }
    if (!/\.(exe|AppImage|deb|dmg|zip)$/i.test(safe))
      throw new NotFoundException('Arquivo invalido.');
    const full = join(DOWNLOADS_DIR, safe);
    if (!existsSync(full)) {
      throw new NotFoundException('Arquivo não encontrado.');
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safe}"`);
    createReadStream(full).pipe(res);
  }
}
