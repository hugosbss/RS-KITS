import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { readdir, stat } from 'fs/promises';
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
export class DownloadsController {
  // Lista os instaladores disponíveis para download (público).
  @Get()
  async list() {
    const entries = await readdir(DOWNLOADS_DIR);
    const files = [];
    for (const file of entries) {
      const full = join(DOWNLOADS_DIR, file);
      const info = await stat(full).catch(() => null);
      if (!info || !info.isFile()) continue;
      files.push({
        platform: platformOf(file),
        file,
        size: info.size,
        url: `/api/downloads/${encodeURIComponent(file)}`,
      });
    }
    return files;
  }

  // Transmite o instalador solicitado como download (público).
  @Get(':file')
  download(@Param('file') file: string, @Res() res: Response) {
    const safe = basename(file);
    if (safe !== file) {
      throw new NotFoundException('Arquivo inválido.');
    }
    const full = join(DOWNLOADS_DIR, safe);
    if (!existsSync(full)) {
      throw new NotFoundException('Arquivo não encontrado.');
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safe}"`);
    createReadStream(full).pipe(res);
  }
}