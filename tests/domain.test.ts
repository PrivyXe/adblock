import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeDomain,
  isValidDomain,
  extractDomainFromUrl,
  isSubdomainOrEqual,
  isBrowserInternalUrl
} from '../src/utils/domain.js';

describe('Domain Utility Tests', () => {
  test('normalizeDomain properly strips protocols, paths, ports, and queries', () => {
    assert.equal(normalizeDomain('https://example.com/path/to/page?query=1#hash'), 'example.com');
    assert.equal(normalizeDomain('http://www.sub.example.com:8080/'), 'www.sub.example.com');
    assert.equal(normalizeDomain('HTTP://EXAMPLE.COM/'), 'example.com');
    assert.equal(normalizeDomain('user:pass@news.site.org/index.html'), 'news.site.org');
    assert.equal(normalizeDomain('  google.com  '), 'google.com');
    assert.equal(normalizeDomain('example.com.'), 'example.com');
    assert.equal(normalizeDomain('localhost:3000'), 'localhost');
  });

  test('normalizeDomain rejects invalid or malicious strings', () => {
    assert.equal(normalizeDomain(''), null);
    assert.equal(normalizeDomain('   '), null);
    assert.equal(normalizeDomain('invalid_domain'), null);
    assert.equal(normalizeDomain('http://'), null);
    assert.equal(normalizeDomain('*.example.com'), null);
    assert.equal(normalizeDomain('<script>'), null);
    assert.equal(normalizeDomain('a'.repeat(260) + '.com'), null);
  });

  test('isValidDomain correctly validates RFC hostname syntax', () => {
    assert.equal(isValidDomain('example.com'), true);
    assert.equal(isValidDomain('sub.domain.co.uk'), true);
    assert.equal(isValidDomain('my-site-123.org'), true);
    assert.equal(isValidDomain('localhost'), true);

    assert.equal(isValidDomain('example'), false);
    assert.equal(isValidDomain('-example.com'), false);
    assert.equal(isValidDomain('example-.com'), false);
    assert.equal(isValidDomain('exam_ple.com'), false);
    assert.equal(isValidDomain(''), false);
  });

  test('extractDomainFromUrl extracts hostname from valid web URLs', () => {
    assert.equal(extractDomainFromUrl('https://dashboard.stripe.com/payments'), 'dashboard.stripe.com');
    assert.equal(extractDomainFromUrl('http://news.ycombinator.com/item?id=123'), 'news.ycombinator.com');
    assert.equal(extractDomainFromUrl('wss://realtime.ably.io/event'), 'realtime.ably.io');
    assert.equal(extractDomainFromUrl('not a url'), null);
  });

  test('isSubdomainOrEqual handles apex and subdomains properly', () => {
    assert.equal(isSubdomainOrEqual('example.com', 'example.com'), true);
    assert.equal(isSubdomainOrEqual('www.example.com', 'example.com'), true);
    assert.equal(isSubdomainOrEqual('a.b.example.com', 'example.com'), true);

    assert.equal(isSubdomainOrEqual('badexample.com', 'example.com'), false);
    assert.equal(isSubdomainOrEqual('example.com', 'sub.example.com'), false);
    assert.equal(isSubdomainOrEqual('example.co.uk', 'other.co.uk'), false);
  });

  test('isBrowserInternalUrl identifies internal and restricted schemes', () => {
    assert.equal(isBrowserInternalUrl('chrome://extensions'), true);
    assert.equal(isBrowserInternalUrl('chrome-extension://abcdef/popup.html'), true);
    assert.equal(isBrowserInternalUrl('edge://settings'), true);
    assert.equal(isBrowserInternalUrl('devtools://devtools/bundled/'), true);
    assert.equal(isBrowserInternalUrl('about:blank'), true);
    assert.equal(isBrowserInternalUrl('file:///C:/Users/file.html'), true);

    assert.equal(isBrowserInternalUrl('https://example.com'), false);
    assert.equal(isBrowserInternalUrl('http://localhost:8080'), false);
  });
});
