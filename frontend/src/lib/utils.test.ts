import { describe, expect, it } from 'vitest';
import {
  cn,
  maskIdentifier,
  onlyDigits,
  toCpfString,
  formatDateBR,
  excelSerialToDate,
} from './utils';
describe('form identifiers', () => {
  it.each([
    ['12345678901', '123.456.789-01'],
    ['12345678000199', '12.345.678/0001-99'],
    ['org@example.com', 'org@example.com'],
    ['race-code', 'race-code'],
    ['', ''],
  ])('formats %s without changing its identity', (input, expected) => {
    expect(maskIdentifier(input)).toBe(expected);
  });
  it('strips document punctuation and handles blank spreadsheet CPF', () => {
    expect(onlyDigits('123.456.789-01')).toBe('12345678901');
    expect(toCpfString(null)).toBe('');
    expect(toCpfString('12345678901')).toBe('123.456.789-01');
  });
  it('merges conflicting Tailwind styles', () => {
    expect(cn('p-2', false, 'p-4')).toBe('p-4');
  });
});
describe('spreadsheet dates', () => {
  it('handles invalid serials and converts Excel epoch', () => {
    expect(excelSerialToDate(Number.NaN)).toBeNull();
    expect(excelSerialToDate(25569)?.toISOString()).toBe(
      '1970-01-01T00:00:00.000Z',
    );
  });
  it('formats local dates and rejects invalid dates', () => {
    expect(formatDateBR(new Date(1990, 1, 1))).toBe('01/02/1990');
    expect(formatDateBR('invalid')).toBe('');
    expect(formatDateBR(null)).toBe('');
  });
});
