import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateWhitelistRules, generatePauseRules } from '../src/blocking/whitelist-rules.js';
import { CONSTANTS } from '../src/utils/constants.js';

describe('Whitelist & Pause DNR Rule Generation Tests', () => {
  test('generateWhitelistRules creates deterministic allowAllRequests DNR rules', () => {
    const domains = ['https://example.com/test', 'news.ycombinator.com', '  Example.com  '];
    const rules = generateWhitelistRules(domains);

    // Should be deduplicated into 2 domains: 'example.com', 'news.ycombinator.com'
    assert.equal(rules.length, 2);

    const rule1 = rules[0]!;
    assert.equal(rule1.id, CONSTANTS.DYNAMIC_RULE_ID_START);
    assert.equal(rule1.priority, CONSTANTS.PRIORITY_DYNAMIC_WHITELIST);
    assert.equal(rule1.action.type, 'allowAllRequests');
    assert.deepEqual(rule1.condition.initiatorDomains, ['example.com']);

    const rule2 = rules[1]!;
    assert.equal(rule2.id, CONSTANTS.DYNAMIC_RULE_ID_START + 1);
    assert.deepEqual(rule2.condition.initiatorDomains, ['news.ycombinator.com']);
  });

  test('generatePauseRules assigns highest priority for session pause', () => {
    const domains = ['sub.mysite.com'];
    const rules = generatePauseRules(domains);

    assert.equal(rules.length, 1);
    const rule = rules[0]!;
    assert.equal(rule.id, CONSTANTS.SESSION_RULE_ID_START);
    assert.equal(rule.priority, CONSTANTS.PRIORITY_SESSION_PAUSE);
    assert.equal(rule.action.type, 'allowAllRequests');
    assert.deepEqual(rule.condition.initiatorDomains, ['sub.mysite.com']);
  });

  test('generateWhitelistRules filters out invalid domain strings safely', () => {
    const raw = ['', '   ', 'invalid_domain_string', 'good.com'];
    const rules = generateWhitelistRules(raw);

    assert.equal(rules.length, 1);
    assert.deepEqual(rules[0]!.condition.initiatorDomains, ['good.com']);
  });
});
