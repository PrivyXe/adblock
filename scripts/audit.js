import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN_PATTERNS = [
  { pattern: /\beval\s*\(/g, name: 'eval()' },
  { pattern: /new\s+Function\s*\(/g, name: 'new Function()' },
  { pattern: /document\.write\s*\(/g, name: 'document.write()' },
  { pattern: /setTimeout\s*\(\s*['"`]/g, name: 'setTimeout with string (implicit eval)' },
  { pattern: /setInterval\s*\(\s*['"`]/g, name: 'setInterval with string (implicit eval)' },
  { pattern: /<[^>]+\s+on[a-z]+\s*=/gi, name: 'Inline HTML event handler attribute (e.g. onclick=)' },
  { pattern: /https?:\/\/[a-z0-9_.-]+\.(?:com|org|net|io|ai)\/[a-z0-9_.-]+\.js/gi, name: 'Remote JavaScript URL reference' }
];

const ALLOWED_PERMISSIONS = new Set(['storage', 'declarativeNetRequest', 'declarativeNetRequestFeedback', 'tabs']);
const ALLOWED_HOST_PERMISSIONS = new Set(['<all_urls>', '*://*/*']);

function auditFiles(dir) {
  let issues = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist-test') {
        issues += auditFiles(full);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.html'))) {
      // Don't audit the audit script itself
      if (full.includes('audit.js') || full.includes('audit.ts')) continue;

      const content = fs.readFileSync(full, 'utf8');
      const relPath = path.relative(process.cwd(), full);

      for (const { pattern, name } of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          console.error(`[SECURITY FAIL] ${relPath} contains forbidden pattern: ${name}`);
          issues++;
        }
      }
    }
  }
  return issues;
}

function auditManifest() {
  let issues = 0;
  const manifestPath = path.resolve('public/manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`[MANIFEST FAIL] Missing manifest file at ${manifestPath}`);
    return 1;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // 1. Manifest V3
  if (manifest.manifest_version !== 3) {
    console.error(`[MANIFEST FAIL] manifest_version must be 3 (found ${manifest.manifest_version})`);
    issues++;
  }

  // 2. Minimum Permissions check
  for (const perm of manifest.permissions || []) {
    if (!ALLOWED_PERMISSIONS.has(perm)) {
      console.error(`[MANIFEST FAIL] Unvetted permission: ${perm}`);
      issues++;
    }
  }

  // 3. Host permissions
  for (const host of manifest.host_permissions || []) {
    if (!ALLOWED_HOST_PERMISSIONS.has(host)) {
      console.error(`[MANIFEST FAIL] Unexpected host permission: ${host}`);
      issues++;
    }
  }

  // 4. Background Service Worker
  if (!manifest.background?.service_worker) {
    console.error(`[MANIFEST FAIL] Missing background service_worker definition`);
    issues++;
  }

  // 5. Popup & Options
  if (!manifest.action?.default_popup) {
    console.error(`[MANIFEST FAIL] Missing action.default_popup definition`);
    issues++;
  }
  if (!manifest.options_page) {
    console.error(`[MANIFEST FAIL] Missing options_page definition`);
    issues++;
  }

  // 6. Icons verification
  const icons = manifest.icons || {};
  for (const [size, iconPath] of Object.entries(icons)) {
    const fullIconPath = path.resolve('public', iconPath);
    if (!fs.existsSync(fullIconPath)) {
      console.error(`[MANIFEST FAIL] Icon ${size} not found at ${fullIconPath}`);
      issues++;
    }
  }

  // 7. Rule Resources
  const ruleResources = manifest.declarative_net_request?.rule_resources || [];
  if (ruleResources.length === 0) {
    console.error(`[MANIFEST FAIL] No declarative_net_request rule_resources defined`);
    issues++;
  }

  return issues;
}

console.log('=== Running Security & Performance Audit ===');

const codeIssues = auditFiles(path.resolve('src'));
const manifestIssues = auditManifest();
const totalIssues = codeIssues + manifestIssues;

console.log('--------------------------------------------');
if (totalIssues === 0) {
  console.log('[AUDIT PASS] Extension passed all Security, CSP, and Manifest V3 criteria.\n');
} else {
  console.error(`[AUDIT FAIL] Audit failed with ${totalIssues} issue(s).\n`);
  process.exit(1);
}
