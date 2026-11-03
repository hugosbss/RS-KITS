import { describe, expect, it } from 'vitest';
import {
  parseCsvLine,
  normalizeColumnName,
  REPORT_FIELDS,
  UPDATE_MODEL_FIELD_KEYS,
} from './types';
describe('report CSV', () => {
  it('preserves delimiters and escaped quotes inside quoted fields', () => {
    expect(parseCsvLine('1;"Team; A";"Athlete ""Ana""";', ';')).toEqual([
      '1',
      'Team; A',
      'Athlete "Ana"',
      '',
    ]);
  });
  it('supports commas and blank cells', () => {
    expect(parseCsvLine('1,,  Ana  ', ',')).toEqual(['1', '', 'Ana']);
  });
  it('normalizes spreadsheet headings', () => {
    expect(normalizeColumnName('  Cidade / UF ')).toBe('cidadeuf');
  });
  it('only uses valid unique fields in the update export', () => {
    const keys = REPORT_FIELDS.map((field) => field.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(UPDATE_MODEL_FIELD_KEYS.every((key) => keys.includes(key))).toBe(
      true,
    );
  });
});
