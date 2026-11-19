import { DownloadsController } from './downloads.controller';
import type { PrismaService } from '../prisma/prisma.service';
import type { Response } from 'express';
import { readFile, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
}));
jest.mock('fs', () => ({ ...jest.requireActual('fs'), existsSync: jest.fn() }));

describe('desktop distribution compatibility', () => {
  const controller = new DownloadsController({} as PrismaService);
  beforeEach(() => {
    jest.mocked(readdir).mockResolvedValue(['RS-KITS.exe'] as never);
    jest
      .mocked(stat)
      .mockResolvedValue({ isFile: () => true, size: 10 } as never);
    jest.mocked(existsSync).mockReturnValue(true);
  });
  it.each([
    [{ embeddedDataVersion: 1 }, false],
    [{ embeddedDataVersion: 1, eventIsolationVersion: 1 }, true],
    [{ embeddedDataVersion: 1, eventIsolationVersion: 2 }, false],
  ])(
    'advertises embedding only for builds with supported event isolation (%j)',
    async (manifest, supported) => {
      jest.mocked(readFile).mockResolvedValue(JSON.stringify(manifest));
      expect((await controller.list())[0].supportsEmbeddedData).toBe(supported);
    },
  );
  it('refuses old executables rather than producing an unsafe distribution', async () => {
    jest
      .mocked(readFile)
      .mockResolvedValue(JSON.stringify({ embeddedDataVersion: 1 }));
    await expect(
      controller.clean('RS-KITS.exe', {} as Response),
    ).rejects.toThrow('isolamento de eventos');
  });
});
