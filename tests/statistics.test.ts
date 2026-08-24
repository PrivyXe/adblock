import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { StatsManager } from '../src/background/statistics-manager.js';
import { Storage } from '../src/storage/storage.js';

describe('Statistics Aggregation & Persistence Tests', () => {
  test('StatsManager aggregates deltas in memory and flushes to storage', async () => {
    await Storage.resetAllStatistics();
    StatsManager.resetMemory();

    // Record ad and tracker events
    StatsManager.recordBlockedEvent('ad', 'https://news.com/article');
    StatsManager.recordBlockedEvent('ad', 'news.com');
    StatsManager.recordBlockedEvent('tracker', 'news.com');
    StatsManager.recordBlockedEvent('tracker', 'blog.org');

    // Flush to storage
    await StatsManager.flushToStorage();

    const stats = await Storage.getStatistics();
    assert.equal(stats.totalAdsBlocked, 2);
    assert.equal(stats.totalTrackersBlocked, 2);

    const siteStats = await Storage.getSiteStatistics();
    assert.ok(siteStats['news.com']);
    assert.equal(siteStats['news.com']?.ads, 2);
    assert.equal(siteStats['news.com']?.trackers, 1);

    assert.ok(siteStats['blog.org']);
    assert.equal(siteStats['blog.org']?.trackers, 1);
  });

  test('resetAllStatistics completely resets stored metrics', async () => {
    await Storage.resetAllStatistics();

    const global = await Storage.getStatistics();
    assert.equal(global.totalAdsBlocked, 0);
    assert.equal(global.totalTrackersBlocked, 0);

    const sites = await Storage.getSiteStatistics();
    assert.deepEqual(sites, {});

    const daily = await Storage.getDailyStatistics();
    assert.deepEqual(daily, {});
  });
});
