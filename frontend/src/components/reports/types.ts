'use client';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  usuario: string;
  numAtleta: string;
  nomeAtleta: string;
  campoAlterado: string;
  valorAnterior: string;
  valorNovo: string;
  ipOuDispositivo: string;
}

export interface AthleteReportRecord {
  num: string;
  nomeAtleta: string;
  kit: string;
  distancia: string;
  faixaEtaria: string;
  categoriaEspecial: string;
  nascimento: string;
  sexo: 'M' | 'F';
  equipe: string;
  cidadeUf: string;
  camiseta: string;
  cpfAtleta: string;
  cel: string;
  email: string;
  retirarKit: string;
  notas: string;
  obs1: string;
  obs2: string;
  alerta: string;
  nomeEvento: string;
  statusEntrega: 'PENDENTE' | 'ENTREGUE' | 'ESTORNADO';
  dataEntrega?: string;
  usuarioEntrega?: string;
  obsEntrega?: string;
  dataEstorno?: string;
  usuarioEstorno?: string;
  foiAlterado: boolean;
  camposAlterados?: string[];
}

export type ReportFieldKey =
  | 'num'
  | 'nomeAtleta'
  | 'kit'
  | 'distancia'
  | 'faixaEtaria'
  | 'categoriaEspecial'
  | 'nascimento'
  | 'sexo'
  | 'equipe'
  | 'cidadeUf'
  | 'camiseta'
  | 'cpfAtleta'
  | 'cel'
  | 'email'
  | 'retirarKit'
  | 'notas'
  | 'obs1'
  | 'obs2'
  | 'alerta'
  | 'nomeEvento'
  | 'statusEntrega'
  | 'dataEntrega'
  | 'usuarioEntrega'
  | 'obsEntrega'
  | 'dataEstorno'
  | 'usuarioEstorno';

export type ReportField = { key: ReportFieldKey; label: string };
export type AthleteUpdate = {
  athleteNum: string;
  athleteCpf: string;
  fields: Array<{ field: ReportFieldKey; before: string; after: string }>;
};

export interface ReportShellProps {
  /** Substitua os dados demonstrativos pelos atletas carregados da API. */
  initialAthletes?: AthleteReportRecord[];
  /** Ponto de integração para persistir as alterações na API quando ela estiver disponível. */
  onApplyAthleteUpdates?: (updates: AthleteUpdate[]) => void | Promise<void>;
}

export const REPORT_FIELDS: ReportField[] = [
  { key: 'num', label: 'NUM' },
  { key: 'nomeAtleta', label: 'Nome Atleta' },
  { key: 'kit', label: 'KIT' },
  { key: 'distancia', label: 'Modalidade' },
  { key: 'faixaEtaria', label: 'Faixa Etária' },
  { key: 'categoriaEspecial', label: 'Categoria Especial' },
  { key: 'nascimento', label: 'Nascimento' },
  { key: 'sexo', label: 'Sexo' },
  { key: 'equipe', label: 'Equipe' },
  { key: 'cidadeUf', label: 'Cidade / UF' },
  { key: 'camiseta', label: 'Camiseta' },
  { key: 'cpfAtleta', label: 'CPF Atleta' },
  { key: 'cel', label: 'Celular' },
  { key: 'email', label: 'E-mail' },
  { key: 'retirarKit', label: 'Retirar KIT' },
  { key: 'notas', label: 'Notas' },
  { key: 'obs1', label: 'Obs1' },
  { key: 'obs2', label: 'Obs2' },
  { key: 'alerta', label: 'Alerta' },
  { key: 'nomeEvento', label: 'Nome Evento' },
  { key: 'statusEntrega', label: 'Status da Entrega' },
  { key: 'dataEntrega', label: 'Data Entrega' },
  { key: 'usuarioEntrega', label: 'Usuário Entrega' },
  { key: 'obsEntrega', label: 'Obs. Entrega' },
  { key: 'dataEstorno', label: 'Data Estorno' },
  { key: 'usuarioEstorno', label: 'Usuário Estorno' },
];

export const UPDATE_MODEL_FIELD_KEYS: ReportFieldKey[] = [
  'num',
  'nomeAtleta',
  'distancia',
  'nascimento',
  'sexo',
  'equipe',
  'cidadeUf',
  'camiseta',
  'cpfAtleta',
  'cel',
  'notas',
];

export const getReportFieldValue = (
  athlete: AthleteReportRecord,
  key: ReportFieldKey,
) => String(athlete[key] ?? '');

export const normalizeColumnName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const parseCsvLine = (line: string, delimiter: string) => {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }
  values.push(value.trim());
  return values;
};
