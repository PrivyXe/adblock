import type { ExtensionSettings, GlobalStatistics, SiteStatistics, DailyStatistics } from './storage.js';

export type MessageRequest =
  | { type: 'GET_STATE'; domain?: string }
  | { type: 'TOGGLE_PROTECTION'; enabled: boolean }
  | { type: 'TOGGLE_FEATURE'; feature: 'blockAds' | 'blockTrackers'; enabled: boolean }
  | { type: 'SET_THEME'; theme: 'system' | 'dark' | 'light' }
  | { type: 'PAUSE_SITE'; domain: string }
  | { type: 'UNPAUSE_SITE'; domain: string }
  | { type: 'WHITELIST_SITE'; domain: string }
  | { type: 'REMOVE_WHITELIST'; domain: string }
  | { type: 'CLEAR_WHITELIST' }
  | { type: 'GET_STATISTICS'; domain?: string }
  | { type: 'RESET_STATISTICS' }
  | { type: 'GET_RULES_INFO' }
  | { type: 'GET_ACTIVE_TAB' };

export interface RulesInfo {
  adsCount: number;
  trackersCount: number;
  sitesCount: number;
  dynamicRulesCount: number;
  sessionRulesCount: number;
}

export interface ExtensionStateResponse {
  settings: ExtensionSettings;
  whitelist: string[];
  isCurrentSitePaused: boolean;
  isCurrentSiteWhitelisted: boolean;
  currentDomain?: string;
  isInternalUrl: boolean;
  statistics: GlobalStatistics;
  currentSiteStats?: SiteStatistics;
  todayStats: DailyStatistics;
  rulesInfo?: RulesInfo;
}

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
