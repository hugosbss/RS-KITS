import * as XLSX from 'xlsx';
import { excelSerialToDate, formatDateBR } from '@/lib/utils';

// Campos esperados na planilha modelo (linha de cabeçalho da aba).
export const SPREADSHEET_HEADERS = [
  'Num',
  'Nome atleta',
  'KIT',
  'Distância',
  'Fx Etaria',
  'Categ Especial',
  'Nascto.',
  'Sexo',
  'Equipe',
  'Cidade/UF',
  'Camiseta',
  'CPF Atleta',
  'Cel',
  'E-mail',
  'Quem Vai retirar o KIT',
  'Notas',
  'Obs1',
  'Obs2',
  'Alerta',
  'Nome Evento',
  'Contato',
  'Grau Parentesco',
  'NºCelular',
  'PIN',
  'itens adicionais',
];

// Estrutura mapeada a partir da planilha, pronta para envio ao backend.
export interface AthleteImportRow {
  num: string;
  nomeAtleta: string;
  kit: string;
  distancia: string;
  fxEtaria: string;
  categEspecial: string;
  nascto: string;
  nascimento?: string;
  sexo: string;
  equipe: string;
  cidadeUf: string;
  camiseta: string;
  cpfAtleta: string;
  cel: string;
  email: string;
  quemVaiRetirar: string;
  notas: string;
  obs1: string;
  obs2: string;
  alerta: string;
  nomeEvento: string;
  contato: string;
  grauParentesco: string;
  celularContato: string;
  pin: string;
  itensAdicionais: string;
}

type RawRow = Record<string, unknown>;

const toStr = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value);
  return String(value).trim();
};

const toNascto = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateBR(value);
  }
  const serial = typeof value === 'number' ? value : null;
  if (serial === null) return toStr(value);
  const date = excelSerialToDate(serial);
  return date ? formatDateBR(date) : '';
};

// Converte uma linha crua do SheetJS (`sheet_to_json`) no formato de atleta.
const mapRow = (row: RawRow): AthleteImportRow => {
  const normalized = new Map(
    Object.entries(row).map(([key, value]) => [
      key
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ''),
      value,
    ]),
  );
  row = Object.fromEntries(
    SPREADSHEET_HEADERS.map((key) => [
      key,
      normalized.get(
        key
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ''),
      ) ?? '',
    ]),
  );
  const nascto = toNascto(row['Nascto.']);
  const birth = nascto ? new Date(nascto.split('/').reverse().join('-')) : null;
  return {
    num: toStr(row.Num),
    nomeAtleta: toStr(row['Nome atleta']),
    kit: toStr(row.KIT),
    distancia: toStr(row['Distância']),
    fxEtaria: toStr(row['Fx Etaria']),
    categEspecial: toStr(row['Categ Especial']),
    nascto,
    nascimento:
      birth && !Number.isNaN(birth.getTime()) ? birth.toISOString() : undefined,
    sexo: toStr(row.Sexo),
    equipe: toStr(row.Equipe),
    cidadeUf: toStr(row['Cidade/UF']),
    camiseta: toStr(row.Camiseta),
    cpfAtleta: toStr(row['CPF Atleta']).replace(/\D/g, ''),
    cel: toStr(row.Cel),
    email: toStr(row['E-mail']),
    quemVaiRetirar: toStr(row['Quem Vai retirar o KIT']),
    notas: toStr(row.Notas),
    obs1: toStr(row.Obs1),
    obs2: toStr(row.Obs2),
    alerta: toStr(row.Alerta),
    nomeEvento: toStr(row['Nome Evento']),
    contato: toStr(row.Contato),
    grauParentesco: toStr(row['Grau Parentesco']),
    celularContato: toStr(row['NºCelular']),
    pin: toStr(row.PIN),
    itensAdicionais: toStr(row['itens adicionais']),
  };
};

// Lê arquivos .xlsx/.xls e devolve os atletas mapeados.
export async function parseAthletesFromExcel(
  file: File,
): Promise<{ rows: AthleteImportRow[]; headers: string[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error('A planilha não possui abas com dados.');
  }

  const raw: RawRow[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (raw.length === 0) {
    throw new Error('A planilha está vazia.');
  }

  return {
    headers: Object.keys(raw[0]),
    rows: raw
      .filter((row) => Object.values(row).some((value) => toStr(value) !== ''))
      .map(mapRow),
  };
}
