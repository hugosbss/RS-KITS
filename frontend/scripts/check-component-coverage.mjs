import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const summary = JSON.parse(
  await readFile(resolve(root, 'coverage/coverage-summary.json'), 'utf8'),
);
// Legacy modules have explicit floors; new components must meet the default.
// Raise these floors as additional behaviors receive regression tests.
const legacyFloors = {
  'src/components/events/event-management.tsx': 50,
  'src/components/users/users.tsx': 65,
  'src/components/delivery/delivery.tsx': 70,
  'src/components/delivery/delivery-modal.tsx': 65,
  'src/components/filters/filters.tsx': 75,
};
async function components(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory()
        ? components(path)
        : entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')
          ? [path]
          : [];
    }),
  );
  return files.flat();
}
const files = (
  await Promise.all(
    ['app', 'components'].map((dir) => components(resolve(root, 'src', dir))),
  )
).flat();
const entries = new Map(
  Object.entries(summary).map(([path, value]) => [resolve(path), value]),
);
const failures = [];
for (const file of files) {
  const name = relative(root, file).replaceAll('\\', '/');
  const coverage = entries.get(file);
  const minimum = legacyFloors[name] ?? 80;
  if (!coverage || coverage.lines.total === 0 || coverage.lines.pct < minimum) {
    failures.push(
      `${name}: ${coverage?.lines.pct ?? 0}% de linhas; mínimo ${minimum}%.`,
    );
  }
}
if (failures.length) {
  console.error(
    'Telas/componentes com cobertura insuficiente:\n' + failures.join('\n'),
  );
  process.exitCode = 1;
} else {
  console.log(
    `Cobertura verificada para ${files.length} telas e componentes; novos arquivos exigem pelo menos 80% de linhas.`,
  );
}
