/**
 * Central system constants for the AdBlock & Privacy Shield extension.
 */
export const CONSTANTS = {
  EXTENSION_NAME: 'AdBlock & Privacy Shield',
  STORAGE_SCHEMA_VERSION: 1,
  
  // Storage & retention bounds
  STATISTICS_RETENTION_DAYS: 90,
  MAX_SITE_STATISTICS: 500,
  BATCH_FLUSH_INTERVAL_MS: 3000,
  
  // Rule ID Ranges
  SESSION_RULE_ID_START: 1,
  SESSION_RULE_ID_END: 999,
  
  DYNAMIC_RULE_ID_START: 1000,
  DYNAMIC_RULE_ID_END: 99999,
  
  STATIC_ADS_RULE_ID_START: 100000,
  STATIC_TRACKERS_RULE_ID_START: 200000,
  STATIC_SITES_RULE_ID_START: 300000,

  // Rule Priorities (higher priority overrides lower)
  PRIORITY_SESSION_PAUSE: 2000,
  PRIORITY_DYNAMIC_WHITELIST: 1000,
  PRIORITY_SITE_SPECIFIC: 300,
  PRIORITY_TRACKER_BLOCK: 200,
  PRIORITY_AD_BLOCK: 100,

  // Static ruleset IDs (must match manifest.json)
  RULESET_IDS: {
    ADS: 'ruleset_ads',
    TRACKERS: 'ruleset_trackers',
    SITES: 'ruleset_sites',
  } as const,

  // Storage keys
  STORAGE_KEYS: {
    SETTINGS: 'settings',
    WHITELIST: 'whitelist',
    PAUSE_STATE: 'pauseState',
    STATISTICS: 'statistics',
    SITE_STATISTICS: 'siteStatistics',
    DAILY_STATISTICS: 'dailyStatistics',
    SCHEMA_VERSION: 'schemaVersion',
  } as const,
} as const;

export type RulesetId = typeof CONSTANTS.RULESET_IDS[keyof typeof CONSTANTS.RULESET_IDS];
