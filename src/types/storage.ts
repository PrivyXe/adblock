/**
 * Storage schema type definitions for chrome.storage.local.
 */

export interface ExtensionSettings {
  enabled: boolean;          // Master protection switch
  blockAds: boolean;         // Static ads ruleset active
  blockTrackers: boolean;    // Static trackers ruleset active
  theme: 'system' | 'dark' | 'light';
}

export interface SiteStatistics {
  ads: number;
  trackers: number;
  lastUpdated: number; // Unix timestamp
}

export interface DailyStatistics {
  ads: number;
  trackers: number;
}

export interface GlobalStatistics {
  totalAdsBlocked: number;
  totalTrackersBlocked: number;
}

export interface StorageSchema {
  schemaVersion: number;
  settings: ExtensionSettings;
  whitelist: string[]; // List of normalized domains
  pauseState: string[]; // List of session-paused domains (persisted or session synced)
  statistics: GlobalStatistics;
  siteStatistics: Record<string, SiteStatistics>;
  dailyStatistics: Record<string, DailyStatistics>; // Keyed by YYYY-MM-DD
}
