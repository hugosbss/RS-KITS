import { describe, it, expect } from 'vitest';
import { validateImportRows, splitExistingAthletes } from './import-validation';
const row = { num: '001', cpfAtleta: '12345678901', nomeAtleta: 'Atleta' };
describe('athlete import validation', () => {
  it('separates existing athletes by normalized NUM or CPF', () => {
    const sameNum = { ...row, num: '1', cpfAtleta: '' },
      sameCpf = { ...row, num: '', cpfAtleta: '123.456.789-01' },
      fresh = { ...row, num: '2', cpfAtleta: '98765432100' };
    expect(splitExistingAthletes([sameNum, sameCpf, fresh], [row])).toEqual({
      newRows: [fresh],
      existingRows: [sameNum, sameCpf],
    });
    expect(splitExistingAthletes([row], [])).toEqual({
      newRows: [row],
      existingRows: [],
    });
  });
  it('allows reimport with normalized documents and numbers', () => {
    expect(
      validateImportRows(
        [{ ...row, num: '1', cpfAtleta: '123.456.789-01' }],
        [row],
      ),
    ).toEqual([]);
  });
  it('identifies both duplicate lines', () => {
    const issues = validateImportRows([row, { ...row, num: '1' }]);
    expect(new Set(issues.map((issue) => issue.line))).toEqual(new Set([2, 3]));
  });
  it('detects duplicate CPF independently of number', () => {
    expect(
      validateImportRows([
        row,
        { ...row, num: '2', cpfAtleta: '123.456.789-01' },
      ]),
    ).not.toEqual([]);
  });
  it('rejects number/CPF conflicts and ambiguous existing data', () => {
    expect(
      validateImportRows([{ ...row, cpfAtleta: '98765432100' }], [row]),
    ).not.toEqual([]);
    expect(validateImportRows([{ ...row, num: '2' }], [row])).not.toEqual([]);
    expect(validateImportRows([row], [row, row])).not.toEqual([]);
  });
  it.each([{ nomeAtleta: '' }, { nomeAtleta: 'Atleta' }])(
    'rejects incomplete or invalid identity',
    (item) => {
      expect(validateImportRows([item])).not.toEqual([]);
    },
  );
  it.each(['00000000000', '123', '123456789012'])(
    'accepts CPF %s without format restrictions',
    (cpfAtleta) => {
      expect(validateImportRows([{ ...row, cpfAtleta }])).toEqual([]);
    },
  );
  it('accepts a number without CPF and a CPF without number', () => {
    expect(
      validateImportRows([
        { ...row, cpfAtleta: '' },
        { ...row, num: '' },
      ]),
    ).toEqual([]);
  });
});
