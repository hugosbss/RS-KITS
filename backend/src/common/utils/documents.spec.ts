import {
  findDocumentCollisions,
  isValidCnpj,
  isValidCpf,
  isValidEmail,
  normalizeAccessCode,
  normalizeCnpj,
  normalizeCpf,
  normalizeEmail,
  onlyDigits,
} from './documents';

describe('normalização de documentos', () => {
  it('remove máscara de CPF e CNPJ, mantendo o mesmo valor canônico', () => {
    expect(normalizeCpf('123.456.789-00')).toBe('12345678900');
    expect(normalizeCpf('12345678900')).toBe('12345678900');
    expect(normalizeCnpj('12.345.678/0001-90')).toBe('12345678000190');
    expect(normalizeCnpj('12345678000190')).toBe('12345678000190');
  });

  it('trata vazio, espaços e null como ausente', () => {
    expect(normalizeCpf('')).toBeNull();
    expect(normalizeCpf('   ')).toBeNull();
    expect(normalizeCpf(null)).toBeNull();
    expect(normalizeCpf(undefined)).toBeNull();
    expect(normalizeEmail('')).toBeNull();
  });

  it('normaliza e-mail para minúsculas sem espaços nas pontas', () => {
    expect(normalizeEmail('  Maria.Souza@RSKits.com.BR ')).toBe(
      'maria.souza@rskits.com.br',
    );
  });

  it('normaliza código de acesso para maiúsculas', () => {
    expect(normalizeAccessCode('  kit-2026  ')).toBe('KIT-2026');
  });

  it('onlyDigits descarta qualquer caractere não numérico', () => {
    expect(onlyDigits('abc123def45')).toBe('12345');
  });
});

describe('validação de documentos', () => {
  it('aceita CPF válido e rejeita dígito verificador errado', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('529.982.247-26')).toBe(false);
  });

  it('rejeita CPF com dígitos repetidos ou tamanho errado', () => {
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('00000000000')).toBe(false);
    expect(isValidCpf('1234567890')).toBe(false);
  });

  it('aceita CNPJ válido e rejeita dígito verificador errado', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('11222333000182')).toBe(false);
    expect(isValidCnpj('11111111111111')).toBe(false);
  });

  it('valida formato de e-mail', () => {
    expect(isValidEmail('maria@rskits.com.br')).toBe(true);
    expect(isValidEmail('maria@rskits')).toBe(false);
    expect(isValidEmail('sem-arroba.com')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
  });
});

describe('detecção de colisões', () => {
  it('não acusa colisão para usuários distintos', () => {
    const collisions = findDocumentCollisions([
      { id: 'u1', email: 'a@rskits.com', cpf: '52998224725' },
      { id: 'u2', email: 'b@rskits.com', cpf: '11144477735' },
    ]);
    expect(collisions).toEqual([]);
  });

  it('ignora campos ausentes', () => {
    const collisions = findDocumentCollisions([
      { id: 'u1', email: null, cpf: null },
      { id: 'u2', email: undefined, cpf: null },
    ]);
    expect(collisions).toEqual([]);
  });

  it('detecta colisão real de CPF preservando os ids envolvidos', () => {
    const collisions = findDocumentCollisions([
      { id: 'u1', cpf: '529.982.247-25' },
      { id: 'u2', cpf: '52998224725' },
    ]);
    expect(collisions).toHaveLength(1);
    expect(collisions[0]).toEqual({
      field: 'cpf',
      value: '52998224725',
      userIds: ['u1', 'u2'],
    });
  });

  it('detecta colisão de e-mail ignorando caixa', () => {
    const collisions = findDocumentCollisions([
      { id: 'u1', email: 'Maria@RSKits.com' },
      { id: 'u2', email: 'maria@rskits.com' },
    ]);
    expect(collisions.map((c) => c.field)).toEqual(['email']);
  });

  it('detecta colisão de código de acesso ignorando caixa', () => {
    const collisions = findDocumentCollisions([
      { id: 'u1', accessCode: 'kit-2026' },
      { id: 'u2', accessCode: 'KIT-2026' },
    ]);
    expect(collisions.map((c) => c.field)).toEqual(['accessCode']);
  });

  it('reporta colisões de campos diferentes separadamente', () => {
    const collisions = findDocumentCollisions([
      { id: 'u1', email: 'dup@rskits.com', cpf: '52998224725' },
      { id: 'u2', email: 'DUP@rskits.com', cpf: '529.982.247-25' },
    ]);
    expect(collisions.map((c) => c.field).sort()).toEqual(['cpf', 'email']);
  });
});
