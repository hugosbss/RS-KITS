import { expect, it, vi } from 'vitest';
import { downloadCSV } from './export-utils';

it('downloads a UTF-8 CSV that preserves quotes, delimiters and missing values', () => {
  const blobs: BlobPart[][] = [];
  const NativeBlob = Blob;
  vi.stubGlobal(
    'Blob',
    class extends NativeBlob {
      constructor(parts: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        blobs.push(parts);
      }
    },
  );
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn().mockReturnValue('blob:report');
    },
  );
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('relatorio.csv');
      expect(this.href).toBe('blob:report');
    });
  downloadCSV(
    'relatorio.csv',
    ['Nome', 'Notas'],
    [
      ['Ana "Silva"', 'Equipe; A'],
      ['Bruno', undefined],
    ],
  );
  expect(blobs[0][0]).toBe(
    '\uFEFFNome;Notas\n"Ana ""Silva""";"Equipe; A"\n"Bruno";""',
  );
  expect(click).toHaveBeenCalledOnce();
  expect(document.querySelector('a')).toBeNull();
});
