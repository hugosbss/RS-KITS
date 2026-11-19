type AthleteIdentity = {
  num?: string | null;
  cpfAtleta?: string | null;
  nomeAtleta?: string | null;
  nascto?: string | null;
};
export type ImportIssue = { line: number; message: string };
const numKey = (value?: string | null) => {
  const text = (value ?? '').trim().toUpperCase();
  return /^\d+$/.test(text) ? text.replace(/^0+(?=\d)/, '') : text;
};
const cpfKey = (value?: string | null) => (value ?? '').replace(/\D/g, '');

export function splitExistingAthletes<T extends AthleteIdentity>(
  rows: T[],
  existing: AthleteIdentity[],
) {
  const nums = new Set(existing.map((row) => numKey(row.num)).filter(Boolean));
  const cpfs = new Set(
    existing.map((row) => cpfKey(row.cpfAtleta)).filter(Boolean),
  );
  const newRows: T[] = [],
    existingRows: T[] = [];
  for (const row of rows) {
    const num = numKey(row.num),
      cpf = cpfKey(row.cpfAtleta);
    ((num && nums.has(num)) || (cpf && cpfs.has(cpf))
      ? existingRows
      : newRows
    ).push(row);
  }
  return { newRows, existingRows };
}

export function validateImportRows(
  rows: AthleteIdentity[],
  existing: AthleteIdentity[] = [],
): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const seenNum = new Map<string, number>(),
    seenCpf = new Map<string, number>();
  const existingNums = new Map<string, AthleteIdentity[]>(),
    existingCpfs = new Map<string, AthleteIdentity[]>();
  for (const item of existing) {
    for (const [key, map] of [
      [numKey(item.num), existingNums],
      [cpfKey(item.cpfAtleta), existingCpfs],
    ] as const) {
      if (key) map.set(key, [...(map.get(key) ?? []), item]);
    }
  }
  rows.forEach((row, index) => {
    const line = index + 2,
      num = numKey(row.num),
      cpf = cpfKey(row.cpfAtleta);
    const add = (message: string) => issues.push({ line, message });
    if (!row.nomeAtleta?.trim()) add('Nome do atleta obrigatório.');
    if (!num && !cpf) add('Informe NUM ou CPF para identificar o atleta.');
    for (const [key, seen, label] of [
      [num, seenNum, 'NUM'],
      [cpf, seenCpf, 'CPF'],
    ] as const) {
      if (!key) continue;
      const previous = seen.get(key);
      if (previous !== undefined) {
        add(`${label} duplicado; também aparece na linha ${previous}.`);
        issues.push({
          line: previous,
          message: `${label} duplicado; também aparece na linha ${line}.`,
        });
      } else seen.set(key, line);
    }
    const byNum = num ? (existingNums.get(num) ?? []) : [];
    const byCpf = cpf ? (existingCpfs.get(cpf) ?? []) : [];
    if (byNum.length > 1 || byCpf.length > 1)
      add(
        'Identificação ambígua: já existem cadastros duplicados neste evento.',
      );
    if (
      byNum[0] &&
      cpf &&
      cpfKey(byNum[0].cpfAtleta) &&
      cpfKey(byNum[0].cpfAtleta) !== cpf
    )
      add('NUM já pertence a outro CPF neste evento.');
    if (byCpf[0] && num && numKey(byCpf[0].num) && numKey(byCpf[0].num) !== num)
      add('CPF já cadastrado com outro NUM neste evento.');
  });
  return issues;
}
