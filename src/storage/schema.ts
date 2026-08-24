import { CONSTANTS } from '../utils/constants.js';
import type { StorageSchema, ExtensionSettings, GlobalStatistics } from '../types/storage.js';
import { isPlainObject, isPositiveInteger } from '../utils/validation.js';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  blockAds: true,
  blockTrackers: true,
  theme: 'system'
};

export const DEFAULT_STATISTICS: GlobalStatistics = {
  totalAdsBlocked: 0,
  totalTrackersBlocked: 0
};

export const DEFAULT_STORAGE_STATE: StorageSchema = {
  schemaVersion: CONSTANTS.STORAGE_SCHEMA_VERSION,
  settings: DEFAULT_SETTINGS,
  whitelist: [],
  pauseState: [],
  statistics: DEFAULT_STATISTICS,
  siteStatistics: {},
  dailyStatistics: {}
};

/**
 * Validates and repairs arbitrary raw storage data against the defined StorageSchema.
 * If data is corrupted or missing keys, safe defaults are substituted.
 */
export function sanitizeStorageData(raw: unknown): StorageSchema {
  if (!isPlainObject(raw)) {
    return { ...DEFAULT_STORAGE_STATE };
  }

  // Schema version
  const schemaVersion = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : CONSTANTS.STORAGE_SCHEMA_VERSION;

  // Settings
  const rawSettings = isPlainObject(raw.settings) ? raw.settings : {};
  const settings: ExtensionSettings = {
    enabled: typeof rawSettings.enabled === 'boolean' ? rawSettings.enabled : DEFAULT_SETTINGS.enabled,
    blockAds: typeof rawSettings.blockAds === 'boolean' ? rawSettings.blockAds : DEFAULT_SETTINGS.blockAds,
    blockTrackers: typeof rawSettings.blockTrackers === 'boolean' ? rawSettings.blockTrackers : DEFAULT_SETTINGS.blockTrackers,
    theme: rawSettings.theme === 'dark' || rawSettings.theme === 'light' || rawSettings.theme === 'system'
      ? rawSettings.theme
      : DEFAULT_SETTINGS.theme
  };

  // Whitelist
  const whitelist = Array.isArray(raw.whitelist)
    ? raw.whitelist.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];

  // Pause State
  const pauseState = Array.isArray(raw.pauseState)
    ? raw.pauseState.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];

  // Global Statistics
  const rawStats = isPlainObject(raw.statistics) ? raw.statistics : {};
  const statistics: GlobalStatistics = {
    totalAdsBlocked: isPositiveInteger(rawStats.totalAdsBlocked) ? rawStats.totalAdsBlocked : 0,
    totalTrackersBlocked: isPositiveInteger(rawStats.totalTrackersBlocked) ? rawStats.totalTrackersBlocked : 0
  };

  // Site Statistics
  const siteStatistics: StorageSchema['siteStatistics'] = {};
  if (isPlainObject(raw.siteStatistics)) {
    for (const [domain, stats] of Object.entries(raw.siteStatistics)) {
      if (isPlainObject(stats)) {
        siteStatistics[domain] = {
          ads: isPositiveInteger(stats.ads) ? stats.ads : 0,
          trackers: isPositiveInteger(stats.trackers) ? stats.trackers : 0,
          lastUpdated: isPositiveInteger(stats.lastUpdated) ? stats.lastUpdated : Date.now()
        };
      }
    }
  }

  // Daily Statistics
  const dailyStatistics: StorageSchema['dailyStatistics'] = {};
  if (isPlainObject(raw.dailyStatistics)) {
    for (const [dateKey, stats] of Object.entries(raw.dailyStatistics)) {
      if (isPlainObject(stats) && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        dailyStatistics[dateKey] = {
          ads: isPositiveInteger(stats.ads) ? stats.ads : 0,
          trackers: isPositiveInteger(stats.trackers) ? stats.trackers : 0
        };
      }
    }
  }

  return {
    schemaVersion,
    settings,
    whitelist,
    pauseState,
    statistics,
    siteStatistics,
    dailyStatistics
  };
}
