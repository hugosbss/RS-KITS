import { BadRequestException } from '@nestjs/common';

type Identity = {
  num?: string | null;
  cpfAtleta?: string | null;
  nomeAtleta?: string | null;
};
export const importNum = (value?: string | null) => {
  const text = (value ?? '').trim().toUpperCase();
  return /^\d+$/.test(text) ? text.replace(/^0+(?=\d)/, '') : text;
};
export const importCpf = (value?: string | null) =>
  (value ?? '').replace(/\D/g, '');

export function assertImportIdentities(
  rows: Identity[],
  existing: Identity[] = [],
) {
  const nums = new Set<string>(),
    cpfs = new Set<string>();
  const existingNums = new Map(
    existing.map((row) => [importNum(row.num), row]),
  );
  const existingCpfs = new Map(
    existing.map((row) => [importCpf(row.cpfAtleta), row]),
  );
  const countNums = new Map<string, number>(),
    countCpfs = new Map<string, number>();
  for (const row of existing) {
    const num = importNum(row.num),
      cpf = importCpf(row.cpfAtleta);
    if (num) countNums.set(num, (countNums.get(num) ?? 0) + 1);
    if (cpf) countCpfs.set(cpf, (countCpfs.get(cpf) ?? 0) + 1);
  }
  for (const [index, row] of rows.entries()) {
    const num = importNum(row.num),
      cpf = importCpf(row.cpfAtleta);
    let reason = '';
    if (!row.nomeAtleta?.trim()) reason = 'Nome obrigatório';
    else if (!num && !cpf) reason = 'Informe NUM ou CPF';
    else if ((num && nums.has(num)) || (cpf && cpfs.has(cpf)))
      reason = 'NUM ou CPF duplicado na planilha';
    else if (
      num &&
      cpf &&
      existingNums.get(num)?.cpfAtleta &&
      importCpf(existingNums.get(num)!.cpfAtleta) !== cpf
    )
      reason = 'NUM pertence a outro CPF';
    else if (
      num &&
      cpf &&
      existingCpfs.get(cpf)?.num &&
      importNum(existingCpfs.get(cpf)!.num) !== num
    )
      reason = 'CPF pertence a outro NUM';
    if (
      !reason &&
      ((num && (countNums.get(num) ?? 0) > 1) ||
        (cpf && (countCpfs.get(cpf) ?? 0) > 1))
    )
      reason = 'Cadastros existentes duplicados';
    if (reason)
      throw new BadRequestException(
        `Linha ${index + 2}: ${reason}. Nenhum atleta foi importado.`,
      );
    if (num) nums.add(num);
    if (cpf) cpfs.add(cpf);
  }
}
