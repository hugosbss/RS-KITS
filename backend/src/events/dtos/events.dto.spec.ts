import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  CreateEventDto,
  UpdateEventDto,
  formatEventDate,
  parseEventDate,
} from './events.dto';

function validate<T extends object>(
  cls: new () => T,
  payload: unknown,
): string[] {
  const instance = plainToInstance(cls, payload);
  const errors = validateSync(instance as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
}

describe('datas de evento', () => {
  it('interpreta AAAA-MM-DD na meia-noite UTC, sem trocar de dia', () => {
    const parsed = parseEventDate('2026-03-15');
    expect(parsed.toISOString()).toBe('2026-03-15T00:00:00.000Z');
  });

  it('faz ida e volta sem mudar o dia', () => {
    expect(formatEventDate(parseEventDate('2026-12-31'))).toBe('2026-12-31');
    expect(formatEventDate(parseEventDate('2026-01-01'))).toBe('2026-01-01');
  });

  it('aceita também data completa com timezone', () => {
    expect(parseEventDate('2026-03-15T18:30:00.000Z').toISOString()).toBe(
      '2026-03-15T18:30:00.000Z',
    );
  });
});

describe('CreateEventDto', () => {
  const base = {
    name: 'Circuito Gaúcho',
    date: '2026-03-15',
    organizerIds: ['org-1'],
  };

  it('aceita evento completo com organizador', () => {
    expect(validate(CreateEventDto, base)).toEqual([]);
  });

  it('exige nome do evento', () => {
    expect(validate(CreateEventDto, { ...base, name: '' }).join(' ')).toContain(
      'Nome do evento é obrigatório',
    );
  });

  it('exige data válida', () => {
    expect(validate(CreateEventDto, { ...base, date: '' }).join(' ')).toContain(
      'Data inválida',
    );
  });

  it('exige ao menos um organizador', () => {
    expect(
      validate(CreateEventDto, { ...base, organizerIds: [] }).join(' '),
    ).toContain('Selecione o organizador responsável');
  });

  it('rejeita organizador duplicado na seleção', () => {
    expect(
      validate(CreateEventDto, { ...base, organizerIds: ['org-1', 'org-1'] }).join(
        ' ',
      ),
    ).toContain('Organizador duplicado na seleção');
  });

  it('rejeita campo desconhecido em vez de ignorá-lo em silêncio', () => {
    expect(validate(CreateEventDto, { ...base, hack: true }).length).toBeGreaterThan(0);
  });

  it('aceita vários organizadores distintos', () => {
    expect(
      validate(CreateEventDto, { ...base, organizerIds: ['org-1', 'org-2'] }),
    ).toEqual([]);
  });
});

describe('UpdateEventDto', () => {
  it('aceita atualização parcial sem organizerIds', () => {
    expect(validate(UpdateEventDto, { name: 'Novo nome' })).toEqual([]);
  });

  it('rejeita nome vazio em vez de apagar o nome', () => {
    expect(validate(UpdateEventDto, { name: '' }).join(' ')).toContain(
      'Nome do evento não pode ser vazio',
    );
  });

  it('aceita lista vazia de organizadores (desvincular todos)', () => {
    expect(validate(UpdateEventDto, { organizerIds: [] })).toEqual([]);
  });

  it('rejeita data inválida', () => {
    expect(validate(UpdateEventDto, { date: '15/03/2026' }).length).toBeGreaterThan(0);
  });
});
