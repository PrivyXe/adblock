import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== Packaging Extension for Release ===');

// Step 1: Run full production build
execSync('node scripts/build.js', { stdio: 'inherit' });

const distDir = path.resolve('dist');
const zipOutput = path.resolve('adblock-v1.0.0.zip');

if (fs.existsSync(zipOutput)) {
  fs.unlinkSync(zipOutput);
}

// Use PowerShell Compress-Archive on Windows
try {
  execSync(`powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipOutput}' -Force"`, { stdio: 'inherit' });
  console.log(`\n[SUCCESS] Release package created: ${zipOutput}`);
} catch (err) {
  console.error('[FAIL] Packaging failed:', err);
  process.exit(1);
}
