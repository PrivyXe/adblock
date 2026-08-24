import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeStorageData, DEFAULT_STORAGE_STATE } from '../src/storage/schema.js';
import { migrateStorageData } from '../src/storage/migrations.js';
import { Storage } from '../src/storage/storage.js';

describe('Storage & Schema Tests', () => {
  test('sanitizeStorageData returns default state on invalid input', () => {
    const resultNull = sanitizeStorageData(null);
    assert.deepEqual(resultNull, DEFAULT_STORAGE_STATE);

    const resultUndefined = sanitizeStorageData(undefined);
    assert.deepEqual(resultUndefined, DEFAULT_STORAGE_STATE);

    const resultPrimitive = sanitizeStorageData('corrupted string');
    assert.deepEqual(resultPrimitive, DEFAULT_STORAGE_STATE);
  });

  test('sanitizeStorageData repairs missing or malformed fields safely', () => {
    const malformed = {
      settings: {
        enabled: 'not-a-bool', // corrupted
        blockAds: false
      },
      whitelist: ['example.com', 123, null], // mixed types
      statistics: {
        totalAdsBlocked: -10 // negative number
      }
    };

    const sanitized = sanitizeStorageData(malformed);
    assert.equal(sanitized.settings.enabled, true); // fallback to default
    assert.equal(sanitized.settings.blockAds, false); // preserved
    assert.equal(sanitized.settings.blockTrackers, true); // default applied
    assert.deepEqual(sanitized.whitelist, ['example.com']);
    assert.equal(sanitized.statistics.totalAdsBlocked, 0); // fallback
  });

  test('migrateStorageData retains valid schema and applies versioning', () => {
    const state = {
      schemaVersion: 1,
      settings: { enabled: true, blockAds: true, blockTrackers: true, theme: 'dark' },
      whitelist: ['github.com'],
      pauseState: [],
      statistics: { totalAdsBlocked: 50, totalTrackersBlocked: 20 },
      siteStatistics: {},
      dailyStatistics: {}
    };

    const migrated = migrateStorageData(state);
    assert.equal(migrated.schemaVersion, 1);
    assert.equal(migrated.settings.theme, 'dark');
    assert.deepEqual(migrated.whitelist, ['github.com']);
  });

  test('Storage in-memory operations work seamlessly', async () => {
    await Storage.resetAllStatistics();
    const initialStats = await Storage.getStatistics();
    assert.equal(initialStats.totalAdsBlocked, 0);
    assert.equal(initialStats.totalTrackersBlocked, 0);

    await Storage.setWhitelist(['trusted.org']);
    const list = await Storage.getWhitelist();
    assert.deepEqual(list, ['trusted.org']);
  });
});
