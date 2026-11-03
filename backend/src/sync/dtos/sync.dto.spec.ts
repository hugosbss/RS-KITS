import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import {
  SYNC_PROTOCOL_VERSION,
  SyncConflictResolveDto,
  SyncPushDto,
  type SyncOperationDto,
} from './sync.dto';

function collectMessages(errors: readonly ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...collectMessages(error.children ?? []),
  ]);
}

function errorsFor<T extends object>(
  cls: new () => T,
  payload: unknown,
): string[] {
  const instance = plainToInstance(cls, payload);
  const errors = validateSync(instance as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return collectMessages(errors);
}

const validOperation = (overrides: Partial<SyncOperationDto> = {}) => ({
  operationId: 'op-1',
  eventId: 'event-1',
  entityType: 'ATHLETE',
  entityId: 'athlete-1',
  opType: 'UPSERT',
  baseVersion: 1,
  payload: { nomeAtleta: 'Maria Souza' },
  ...overrides,
});

const validPush = (operations: unknown[] = [validOperation()]) => ({
  protocol: SYNC_PROTOCOL_VERSION,
  deviceId: 'device-abc',
  operations,
});

describe('SyncPushDto', () => {
  it('aceita um lote válido', () => {
    expect(errorsFor(SyncPushDto, validPush())).toEqual([]);
  });

  it('exige deviceId para rastreabilidade da origem', () => {
    const payload = validPush();
    delete (payload as { deviceId?: string }).deviceId;
    expect(errorsFor(SyncPushDto, payload).join(' ')).toContain(
      'deviceId é obrigatório',
    );
  });

  it('recusa lote vazio em vez de aceitar no-op silencioso', () => {
    expect(errorsFor(SyncPushDto, validPush([])).join(' ')).toContain(
      'Nenhuma operação para sincronizar',
    );
  });

  it('limita o tamanho do lote', () => {
    const many = Array.from({ length: 501 }, (_, index) =>
      validOperation({ operationId: `op-${index}` }),
    );
    expect(errorsFor(SyncPushDto, validPush(many)).join(' ')).toContain(
      'Máximo de 500 operações',
    );
  });

  it('rejeita entityType desconhecido', () => {
    expect(
      errorsFor(
        SyncPushDto,
        validPush([validOperation({ entityType: 'BANANA' as never })]),
      ).join(' '),
    ).toContain('entityType inválido');
  });

  it('rejeita opType desconhecido', () => {
    expect(
      errorsFor(
        SyncPushDto,
        validPush([validOperation({ opType: 'DROP' as never })]),
      ).join(' '),
    ).toContain('opType inválido');
  });

  it('exige operationId para garantir idempotência', () => {
    expect(
      errorsFor(
        SyncPushDto,
        validPush([validOperation({ operationId: '' })]),
      ).join(' '),
    ).toContain('operationId é obrigatório');
  });

  it('exige payload como objeto', () => {
    expect(
      errorsFor(
        SyncPushDto,
        validPush([validOperation({ payload: 'texto' as never })]),
      ).join(' '),
    ).toContain('payload deve ser um objeto');
  });

  it('rejeita baseVersion negativa ou fracionária', () => {
    expect(
      errorsFor(SyncPushDto, validPush([validOperation({ baseVersion: -1 })]))
        .length,
    ).toBeGreaterThan(0);
    expect(
      errorsFor(SyncPushDto, validPush([validOperation({ baseVersion: 1.5 })]))
        .length,
    ).toBeGreaterThan(0);
  });

  it('aceita baseVersion nulo para criação de registro novo', () => {
    expect(
      errorsFor(
        SyncPushDto,
        validPush([validOperation({ baseVersion: null })]),
      ),
    ).toEqual([]);
  });

  it('valida cada operação do lote, não apenas a primeira', () => {
    const batch = validPush([
      validOperation({ operationId: 'op-ok' }),
      validOperation({ operationId: 'op-ruim', entityType: 'X' as never }),
    ]);
    expect(errorsFor(SyncPushDto, batch).join(' ')).toContain(
      'entityType inválido',
    );
  });

  it('rejeita campo desconhecido dentro da operação', () => {
    expect(
      errorsFor(
        SyncPushDto,
        validPush([validOperation({ escalation: true } as never)]),
      ).length,
    ).toBeGreaterThan(0);
  });
});

describe('SyncConflictResolveDto', () => {
  it('aceita KEEP_LOCAL e KEEP_CENTRAL', () => {
    expect(
      errorsFor(SyncConflictResolveDto, {
        conflictId: 'c1',
        resolution: 'KEEP_LOCAL',
      }),
    ).toEqual([]);
    expect(
      errorsFor(SyncConflictResolveDto, {
        conflictId: 'c1',
        resolution: 'KEEP_CENTRAL',
      }),
    ).toEqual([]);
  });

  it('rejeita resolução arbitrária', () => {
    expect(
      errorsFor(SyncConflictResolveDto, {
        conflictId: 'c1',
        resolution: 'OVERWRITE_EVERYTHING' as never,
      }).join(' '),
    ).toContain('resolution inválida');
  });
});
