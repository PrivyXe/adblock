import type { StorageSchema, ExtensionSettings, GlobalStatistics, SiteStatistics, DailyStatistics } from '../types/storage.js';
import { DEFAULT_STORAGE_STATE, sanitizeStorageData } from './schema.js';
import { migrateStorageData } from './migrations.js';
import { Logger } from '../utils/logger.js';

class StorageManager {
  private memoryStore: StorageSchema = { ...DEFAULT_STORAGE_STATE };

  private isChromeStorageAvailable(): boolean {
    return (
      typeof chrome !== 'undefined' &&
      typeof chrome.storage !== 'undefined' &&
      typeof chrome.storage.local !== 'undefined'
    );
  }

  /**
   * Retrieves full storage state, validating and migrating if necessary.
   */
  async getFullState(): Promise<StorageSchema> {
    if (!this.isChromeStorageAvailable()) {
      return { ...this.memoryStore };
    }

    try {
      const raw = await chrome.storage.local.get(null);
      const migrated = migrateStorageData(raw);
      return migrated;
    } catch (err) {
      Logger.error('Failed to read from chrome.storage.local:', err);
      return { ...DEFAULT_STORAGE_STATE };
    }
  }

  /**
   * Saves full storage state.
   */
  async setFullState(state: StorageSchema): Promise<void> {
    const sanitized = sanitizeStorageData(state);
    this.memoryStore = sanitized;

    if (!this.isChromeStorageAvailable()) {
      return;
    }

    try {
      await chrome.storage.local.set(sanitized);
    } catch (err) {
      Logger.error('Failed to write full state to chrome.storage.local:', err);
    }
  }

  /**
   * Retrieves extension settings.
   */
  async getSettings(): Promise<ExtensionSettings> {
    const state = await this.getFullState();
    return state.settings;
  }

  /**
   * Updates partial or full settings.
   */
  async updateSettings(partial: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const state = await this.getFullState();
    state.settings = { ...state.settings, ...partial };
    await this.setFullState(state);
    return state.settings;
  }

  /**
   * Retrieves current whitelist domains.
   */
  async getWhitelist(): Promise<string[]> {
    const state = await this.getFullState();
    return state.whitelist;
  }

  /**
   * Saves new whitelist domains.
   */
  async setWhitelist(whitelist: string[]): Promise<void> {
    const state = await this.getFullState();
    state.whitelist = Array.from(new Set(whitelist));
    await this.setFullState(state);
  }

  /**
   * Retrieves pause state domains.
   */
  async getPauseState(): Promise<string[]> {
    const state = await this.getFullState();
    return state.pauseState;
  }

  /**
   * Saves pause state domains.
   */
  async setPauseState(pauseState: string[]): Promise<void> {
    const state = await this.getFullState();
    state.pauseState = Array.from(new Set(pauseState));
    await this.setFullState(state);
  }

  /**
   * Retrieves global statistics.
   */
  async getStatistics(): Promise<GlobalStatistics> {
    const state = await this.getFullState();
    return state.statistics;
  }

  /**
   * Retrieves site statistics map.
   */
  async getSiteStatistics(): Promise<Record<string, SiteStatistics>> {
    const state = await this.getFullState();
    return state.siteStatistics;
  }

  /**
   * Retrieves daily statistics map.
   */
  async getDailyStatistics(): Promise<Record<string, DailyStatistics>> {
    const state = await this.getFullState();
    return state.dailyStatistics;
  }

  /**
   * Resets all statistics to zero.
   */
  async resetAllStatistics(): Promise<void> {
    const state = await this.getFullState();
    state.statistics = { totalAdsBlocked: 0, totalTrackersBlocked: 0 };
    state.siteStatistics = {};
    state.dailyStatistics = {};
    await this.setFullState(state);
  }
}

export const Storage = new StorageManager();
