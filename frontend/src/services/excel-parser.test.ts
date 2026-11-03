import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseAthletesFromExcel } from './excel-parser';
const file = (data: ArrayBuffer | string, name: string) =>
  ({
    name,
    arrayBuffer: async () =>
      typeof data === 'string' ? new TextEncoder().encode(data).buffer : data,
  }) as File;
describe('spreadsheet parser', () => {
  it('reads quoted CSV fields and retains missing names for validation', async () => {
    const { rows } = await parseAthletesFromExcel(
      file(
        'NUM;NOME ATLETA;CPF ATLETA;EQUIPE\n1;"Atleta; Um";12345678901;"Equipe, A"\n2;;98765432100;B',
        'athletes.csv',
      ),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      num: '1',
      nomeAtleta: 'Atleta; Um',
      equipe: 'Equipe, A',
    });
    expect(rows[1].nomeAtleta).toBe('');
  });
  it('reads an Excel workbook and preserves untruncated CPF', async () => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet([
        {
          Num: 1,
          'Nome atleta': 'Ana',
          'CPF Atleta': '123456789012',
          'Nascto.': '01/02/1990',
        },
      ]),
      'Athletes',
    );
    const { rows } = await parseAthletesFromExcel(
      file(
        XLSX.write(book, { type: 'array', bookType: 'xlsx' }),
        'athletes.xlsx',
      ),
    );
    expect(rows[0].cpfAtleta).toBe('123456789012');
    expect(rows[0].nascimento).toBe('1990-02-01T00:00:00.000Z');
  });
  it('rejects an empty spreadsheet', async () => {
    await expect(
      parseAthletesFromExcel(file('Num;Nome atleta', 'empty.csv')),
    ).rejects.toThrow();
  });
});
