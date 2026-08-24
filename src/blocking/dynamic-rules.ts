import { generateWhitelistRules, generatePauseRules } from './whitelist-rules.js';
import { Logger } from '../utils/logger.js';

class DynamicRulesManager {
  private isChromeDnrAvailable(): boolean {
    return (
      typeof chrome !== 'undefined' &&
      typeof chrome.declarativeNetRequest !== 'undefined' &&
      typeof chrome.declarativeNetRequest.updateDynamicRules !== 'undefined'
    );
  }

  /**
   * Synchronizes the user whitelist domains with Chrome DNR dynamic rules.
   */
  async syncWhitelistRules(whitelistDomains: string[]): Promise<boolean> {
    if (!this.isChromeDnrAvailable()) {
      Logger.debug('DNR not available; skipping dynamic rules sync.');
      return false;
    }

    try {
      // Get all current dynamic rule IDs to remove
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const removeRuleIds = existingRules.map(r => r.id);
      const addRules = generateWhitelistRules(whitelistDomains) as unknown as chrome.declarativeNetRequest.Rule[];

      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds,
        addRules
      });

      Logger.info(`Updated dynamic whitelist rules: ${addRules.length} rules active.`);
      return true;
    } catch (err) {
      Logger.error('Failed to sync dynamic rules with DNR:', err);
      return false;
    }
  }

  /**
   * Synchronizes temporarily paused domains with Chrome DNR session rules.
   */
  async syncSessionPauseRules(pausedDomains: string[]): Promise<boolean> {
    if (!this.isChromeDnrAvailable() || typeof chrome.declarativeNetRequest.updateSessionRules === 'undefined') {
      return false;
    }

    try {
      const existingRules = await chrome.declarativeNetRequest.getSessionRules();
      const removeRuleIds = existingRules.map(r => r.id);
      const addRules = generatePauseRules(pausedDomains) as unknown as chrome.declarativeNetRequest.Rule[];

      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds,
        addRules
      });

      Logger.info(`Updated session pause rules: ${addRules.length} rules active.`);
      return true;
    } catch (err) {
      Logger.error('Failed to sync session rules with DNR:', err);
      return false;
    }
  }

  /**
   * Retrieves active dynamic rule count.
   */
  async getDynamicRulesCount(): Promise<number> {
    if (!this.isChromeDnrAvailable()) return 0;
    try {
      const rules = await chrome.declarativeNetRequest.getDynamicRules();
      return rules.length;
    } catch {
      return 0;
    }
  }

  /**
   * Retrieves active session rule count.
   */
  async getSessionRulesCount(): Promise<number> {
    if (!this.isChromeDnrAvailable() || typeof chrome.declarativeNetRequest.getSessionRules === 'undefined') return 0;
    try {
      const rules = await chrome.declarativeNetRequest.getSessionRules();
      return rules.length;
    } catch {
      return 0;
    }
  }
}

export const DynamicRules = new DynamicRulesManager();
