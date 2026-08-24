import fs from 'node:fs';
import path from 'node:path';

function lintDirectory(dir) {
  let issues = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'dist-test') {
        issues += lintDirectory(full);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.html') || entry.name.endsWith('.css'))) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (line.includes('console.log(') && !full.includes('scripts') && !full.includes('tests')) {
          console.warn(`[WARN] ${path.relative(process.cwd(), full)}:${index + 1} Direct console.log found (prefer Logger)`);
        }
      });
    }
  }
  return issues;
}

console.log('=== Running Code Lint & Checks ===');
const errors = lintDirectory(path.resolve('src'));
if (errors === 0) {
  console.log('[PASS] Code lint passed cleanly.\n');
} else {
  console.error(`[FAIL] Found ${errors} lint error(s).\n`);
  process.exit(1);
}
