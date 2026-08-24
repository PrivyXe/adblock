import { CONSTANTS } from '../utils/constants.js';
import { Storage } from '../storage/storage.js';
import { getTodayDateString } from '../utils/validation.js';
import { normalizeDomain } from '../utils/domain.js';
import { Logger } from '../utils/logger.js';
import type { DailyStatistics, SiteStatistics } from '../types/storage.js';

class StatisticsManager {
  private pendingAds = 0;
  private pendingTrackers = 0;
  private pendingSiteDeltas = new Map<string, { ads: number; trackers: number }>();
  private pendingDailyDeltas = new Map<string, { ads: number; trackers: number }>();
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Records a blocked request event in memory (zero storage I/O).
   */
  recordBlockedEvent(type: 'ad' | 'tracker', rawDomain?: string): void {
    const today = getTodayDateString();

    if (type === 'ad') {
      this.pendingAds++;
    } else {
      this.pendingTrackers++;
    }

    // Daily delta
    const daily = this.pendingDailyDeltas.get(today) || { ads: 0, trackers: 0 };
    if (type === 'ad') daily.ads++;
    else daily.trackers++;
    this.pendingDailyDeltas.set(today, daily);

    // Site delta
    if (rawDomain) {
      const domain = normalizeDomain(rawDomain);
      if (domain) {
        const site = this.pendingSiteDeltas.get(domain) || { ads: 0, trackers: 0 };
        if (type === 'ad') site.ads++;
        else site.trackers++;
        this.pendingSiteDeltas.set(domain, site);
      }
    }

    // Schedule debounced batch flush
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushTimeout) return;
    this.flushTimeout = setTimeout(() => {
      this.flushTimeout = null;
      this.flushToStorage().catch(err => Logger.error('Auto flush error:', err));
    }, CONSTANTS.BATCH_FLUSH_INTERVAL_MS);
  }

  /**
   * Flushes all pending in-memory statistics to chrome.storage.local atomically.
   */
  async flushToStorage(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.pendingAds === 0 && this.pendingTrackers === 0 && this.pendingSiteDeltas.size === 0) {
      return;
    }

    const adsDelta = this.pendingAds;
    const trackersDelta = this.pendingTrackers;
    const siteDeltas = new Map(this.pendingSiteDeltas);
    const dailyDeltas = new Map(this.pendingDailyDeltas);

    // Reset in-memory pending counters
    this.pendingAds = 0;
    this.pendingTrackers = 0;
    this.pendingSiteDeltas.clear();
    this.pendingDailyDeltas.clear();

    try {
      const state = await Storage.getFullState();

      // Update global stats
      state.statistics.totalAdsBlocked += adsDelta;
      state.statistics.totalTrackersBlocked += trackersDelta;

      // Update daily stats
      for (const [dateKey, delta] of dailyDeltas.entries()) {
        const existing: DailyStatistics = state.dailyStatistics[dateKey] || { ads: 0, trackers: 0 };
        existing.ads += delta.ads;
        existing.trackers += delta.trackers;
        state.dailyStatistics[dateKey] = existing;
      }

      // Update site stats
      const now = Date.now();
      for (const [domain, delta] of siteDeltas.entries()) {
        const existing: SiteStatistics = state.siteStatistics[domain] || { ads: 0, trackers: 0, lastUpdated: now };
        existing.ads += delta.ads;
        existing.trackers += delta.trackers;
        existing.lastUpdated = now;
        state.siteStatistics[domain] = existing;
      }

      // Enforce bounds: prune old sites if count > MAX_SITE_STATISTICS
      const siteKeys = Object.keys(state.siteStatistics);
      if (siteKeys.length > CONSTANTS.MAX_SITE_STATISTICS) {
        const sorted = siteKeys.sort((a, b) => {
          const tA = state.siteStatistics[a]?.lastUpdated || 0;
          const tB = state.siteStatistics[b]?.lastUpdated || 0;
          return tA - tB; // oldest first
        });
        const removeCount = siteKeys.length - CONSTANTS.MAX_SITE_STATISTICS;
        for (let i = 0; i < removeCount; i++) {
          const keyToRemove = sorted[i];
          if (keyToRemove) {
            delete state.siteStatistics[keyToRemove];
          }
        }
      }

      // Enforce bounds: prune old daily records older than STATISTICS_RETENTION_DAYS
      const retentionCutoff = new Date();
      retentionCutoff.setDate(retentionCutoff.getDate() - CONSTANTS.STATISTICS_RETENTION_DAYS);
      const cutoffDateStr = retentionCutoff.toISOString().slice(0, 10);

      for (const dateKey of Object.keys(state.dailyStatistics)) {
        if (dateKey < cutoffDateStr) {
          delete state.dailyStatistics[dateKey];
        }
      }

      await Storage.setFullState(state);
      Logger.debug(`Flushed statistics: +${adsDelta} ads, +${trackersDelta} trackers`);
    } catch (err) {
      Logger.error('Failed to flush statistics to storage:', err);
    }
  }

  /**
   * Resets in-memory counters.
   */
  resetMemory(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.pendingAds = 0;
    this.pendingTrackers = 0;
    this.pendingSiteDeltas.clear();
    this.pendingDailyDeltas.clear();
  }
}

export const StatsManager = new StatisticsManager();
