import { assertImportIdentities } from './import-validation';
const athlete = { num: '001', cpfAtleta: '12345678901', nomeAtleta: 'Atleta' };
describe('Import identity validation', () => {
  it.each(['00000000000', '123', '123456789012'])(
    'accepts CPF %s without format restrictions',
    (cpfAtleta) => {
      expect(() =>
        assertImportIdentities([{ ...athlete, cpfAtleta }]),
      ).not.toThrow();
    },
  );
  it('rejects normalized numbers and masked duplicate CPF', () => {
    expect(() =>
      assertImportIdentities([athlete, { ...athlete, num: '1' }]),
    ).toThrow('duplicado');
    expect(() =>
      assertImportIdentities([
        athlete,
        { ...athlete, num: '2', cpfAtleta: '123.456.789-01' },
      ]),
    ).toThrow('duplicado');
  });
  it('permits reimport but rejects another identity or ambiguous existing records', () => {
    expect(() =>
      assertImportIdentities([{ ...athlete, num: '1' }], [athlete]),
    ).not.toThrow();
    expect(() =>
      assertImportIdentities(
        [{ ...athlete, cpfAtleta: '98765432100' }],
        [athlete],
      ),
    ).toThrow('outro CPF');
    expect(() => assertImportIdentities([athlete], [athlete, athlete])).toThrow(
      'duplicados',
    );
  });
  it('requires a name and an identifier', () => {
    expect(() => assertImportIdentities([{ nomeAtleta: '' }])).toThrow('Nome');
    expect(() => assertImportIdentities([{ nomeAtleta: 'A' }])).toThrow(
      'NUM ou CPF',
    );
  });
});
