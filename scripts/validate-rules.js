import fs from 'node:fs';
import path from 'node:path';

const ALLOWED_ACTIONS = new Set(['block', 'allow', 'allowAllRequests', 'redirect', 'upgradeScheme', 'modifyHeaders']);
const ALLOWED_RESOURCE_TYPES = new Set([
  'main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font',
  'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket',
  'webtransport', 'webbundle', 'other'
]);

const CHROME_STATIC_RULE_LIMIT = 30000;
const CHROME_STATIC_RULESET_LIMIT = 50;

function validateRule(rule, filename) {
  const errors = [];

  if (typeof rule.id !== 'number' || !Number.isInteger(rule.id) || rule.id <= 0) {
    errors.push(`Invalid ID: ${rule.id} (must be a positive integer)`);
  }

  if (typeof rule.priority !== 'number' || !Number.isInteger(rule.priority) || rule.priority <= 0) {
    errors.push(`Invalid priority: ${rule.priority} for rule ${rule.id}`);
  }

  if (!rule.action || typeof rule.action !== 'object' || !ALLOWED_ACTIONS.has(rule.action.type)) {
    errors.push(`Invalid action type: ${rule.action?.type} for rule ${rule.id}`);
  }

  if (!rule.condition || typeof rule.condition !== 'object') {
    errors.push(`Missing condition object for rule ${rule.id}`);
  } else {
    const { condition } = rule;
    const hasFilter = condition.urlFilter || condition.regexFilter || condition.requestDomains || condition.initiatorDomains;
    if (!hasFilter) {
      errors.push(`Condition has no filter (urlFilter/regexFilter/domains) for rule ${rule.id}`);
    }

    if (condition.regexFilter) {
      try {
        new RegExp(condition.regexFilter);
      } catch (err) {
        errors.push(`Invalid regexFilter pattern: "${condition.regexFilter}" in rule ${rule.id}: ${err.message}`);
      }
    }

    if (condition.resourceTypes) {
      if (!Array.isArray(condition.resourceTypes) || condition.resourceTypes.length === 0) {
        errors.push(`resourceTypes must be a non-empty array for rule ${rule.id}`);
      } else {
        for (const rt of condition.resourceTypes) {
          if (!ALLOWED_RESOURCE_TYPES.has(rt)) {
            errors.push(`Invalid resourceType: "${rt}" in rule ${rule.id}`);
          }
        }
      }
    }
  }

  return errors;
}

export function validateAllRules() {
  console.log('=== DeclarativeNetRequest Ruleset Validation ===');

  const rulesDir = path.resolve('rules');
  if (!fs.existsSync(rulesDir)) {
    console.error(`Error: Rules directory not found at ${rulesDir}`);
    process.exit(1);
  }

  const allRules = [];
  const seenIds = new Map(); // id -> file
  let totalErrors = 0;
  let fileCount = 0;

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        fileCount++;
        const relPath = path.relative(process.cwd(), fullPath);
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const rules = JSON.parse(content);

          if (!Array.isArray(rules)) {
            console.error(`[FAIL] ${relPath}: Root must be an array of rules`);
            totalErrors++;
            continue;
          }

          let fileErrors = 0;
          for (const rule of rules) {
            allRules.push(rule);
            const errs = validateRule(rule, relPath);
            if (errs.length > 0) {
              fileErrors += errs.length;
              errs.forEach(e => console.error(`[FAIL] ${relPath}: ${e}`));
            }

            if (seenIds.has(rule.id)) {
              console.error(`[FAIL] Duplicate Rule ID ${rule.id} found in ${relPath} (already defined in ${seenIds.get(rule.id)})`);
              fileErrors++;
            } else {
              seenIds.set(rule.id, relPath);
            }
          }

          totalErrors += fileErrors;
          if (fileErrors === 0) {
            console.log(`[PASS] ${relPath} (${rules.length} valid rules)`);
          }
        } catch (err) {
          console.error(`[FAIL] ${relPath}: JSON parse error: ${err.message}`);
          totalErrors++;
        }
      }
    }
  }

  scanDir(rulesDir);

  console.log('------------------------------------------------');
  console.log(`Total rule files: ${fileCount}`);
  console.log(`Total rules checked: ${allRules.length}`);
  console.log(`Chrome static rules limit: ${CHROME_STATIC_RULE_LIMIT} (Used: ${((allRules.length / CHROME_STATIC_RULE_LIMIT) * 100).toFixed(2)}%)`);

  if (allRules.length > CHROME_STATIC_RULE_LIMIT) {
    console.error(`[FAIL] Total rules (${allRules.length}) exceed Chrome static limit (${CHROME_STATIC_RULE_LIMIT})`);
    totalErrors++;
  }

  if (totalErrors > 0) {
    console.error(`\n[FATAL] Rule validation failed with ${totalErrors} error(s).`);
    process.exit(1);
  }

  console.log('[SUCCESS] All rules are valid, unique, and DNR-compliant.\n');
}

// Run if called directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('scripts/validate-rules.js')) {
  validateAllRules();
}
