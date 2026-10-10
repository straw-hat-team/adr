import { readdir } from 'node:fs/promises';
import path from 'node:path';

const ADRS_DIR = 'src/adrs';
const ALLOWED_FILES = new Set(['README.md']);
const ALLOWED_DIRS = new Set(['scripts', 'references', 'assets']);

const violations = [];

for (const adr of await readdir(ADRS_DIR, { withFileTypes: true })) {
  const adrPath = path.join(ADRS_DIR, adr.name);

  if (!adr.isDirectory()) {
    violations.push(`${adrPath}: only ADR directories are allowed in ${ADRS_DIR}`);
    continue;
  }

  const entries = await readdir(adrPath, { withFileTypes: true });

  if (!entries.some((entry) => entry.isFile() && entry.name === 'README.md')) {
    violations.push(`${adrPath}: missing README.md`);
  }

  for (const entry of entries) {
    const allowed = entry.isDirectory() ? ALLOWED_DIRS.has(entry.name) : ALLOWED_FILES.has(entry.name);

    if (!allowed) {
      violations.push(`${path.join(adrPath, entry.name)}: not allowed`);
    }
  }
}

if (violations.length > 0) {
  console.error(
    [
      'ADR directories may contain only README.md and the optional',
      `directories ${[...ALLOWED_DIRS].join(', ')}.`,
      '',
      ...violations,
    ].join('\n'),
  );
  process.exit(1);
}
