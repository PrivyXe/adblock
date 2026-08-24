import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Ruleset Schema & Limit Tests', () => {
  test('All static rule files contain unique IDs and valid DNR properties', () => {
    const rulesDir = path.resolve('rules');
    const seenIds = new Set<number>();
    let totalRules = 0;

    function readJson(rel: string) {
      const content = fs.readFileSync(path.join(rulesDir, rel), 'utf8');
      return JSON.parse(content);
    }

    const files = [
      'ads/base.json',
      'ads/networks.json',
      'trackers/analytics.json',
      'trackers/tracking.json',
      'trackers/telemetry.json',
      'sites/site-specific.json'
    ];

    for (const file of files) {
      const rules = readJson(file);
      assert.ok(Array.isArray(rules), `${file} root must be array`);

      for (const rule of rules) {
        totalRules++;
        assert.ok(typeof rule.id === 'number' && rule.id > 0, `Invalid rule id in ${file}`);
        assert.ok(!seenIds.has(rule.id), `Duplicate rule id ${rule.id} found in ${file}`);
        seenIds.add(rule.id);

        assert.ok(rule.priority > 0, `Invalid priority for rule ${rule.id}`);
        assert.ok(rule.action && rule.action.type === 'block', `Action must be block in static ruleset`);
        assert.ok(rule.condition && (rule.condition.urlFilter || rule.condition.regexFilter), `Missing filter for rule ${rule.id}`);
      }
    }

    assert.ok(totalRules > 0, 'Must have at least one rule');
    assert.ok(totalRules <= 30000, 'Must not exceed Chrome DNR static limit (30,000)');
  });
});
