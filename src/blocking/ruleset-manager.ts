import { CONSTANTS } from '../utils/constants.js';
import type { ExtensionSettings } from '../types/storage.js';
import { Logger } from '../utils/logger.js';

class RulesetManager {
  private isChromeDnrAvailable(): boolean {
    return (
      typeof chrome !== 'undefined' &&
      typeof chrome.declarativeNetRequest !== 'undefined' &&
      typeof chrome.declarativeNetRequest.updateEnabledRulesets !== 'undefined'
    );
  }

  /**
   * Applies settings to Chrome's static rulesets.
   */
  async applySettings(settings: ExtensionSettings): Promise<void> {
    if (!this.isChromeDnrAvailable()) {
      Logger.debug('DNR not available; skipping ruleset update.');
      return;
    }

    try {
      const enableRulesetIds: string[] = [];
      const disableRulesetIds: string[] = [];

      if (!settings.enabled) {
        // Master OFF: disable all rulesets
        disableRulesetIds.push(
          CONSTANTS.RULESET_IDS.ADS,
          CONSTANTS.RULESET_IDS.TRACKERS,
          CONSTANTS.RULESET_IDS.SITES
        );
      } else {
        // Ads ruleset
        if (settings.blockAds) {
          enableRulesetIds.push(CONSTANTS.RULESET_IDS.ADS);
        } else {
          disableRulesetIds.push(CONSTANTS.RULESET_IDS.ADS);
        }

        // Trackers ruleset
        if (settings.blockTrackers) {
          enableRulesetIds.push(CONSTANTS.RULESET_IDS.TRACKERS);
        } else {
          disableRulesetIds.push(CONSTANTS.RULESET_IDS.TRACKERS);
        }

        // Sites ruleset enabled if master is ON
        enableRulesetIds.push(CONSTANTS.RULESET_IDS.SITES);
      }

      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds,
        disableRulesetIds
      });

      Logger.info('Updated enabled static rulesets:', { enableRulesetIds, disableRulesetIds });
    } catch (err) {
      Logger.error('Failed to update enabled rulesets:', err);
    }
  }

  /**
   * Queries which static rulesets are currently active.
   */
  async getEnabledRulesetIds(): Promise<string[]> {
    if (!this.isChromeDnrAvailable()) {
      return [CONSTANTS.RULESET_IDS.ADS, CONSTANTS.RULESET_IDS.TRACKERS, CONSTANTS.RULESET_IDS.SITES];
    }
    try {
      return await chrome.declarativeNetRequest.getEnabledRulesets();
    } catch (err) {
      Logger.error('Failed to get enabled rulesets:', err);
      return [];
    }
  }
}

export const Ruleset = new RulesetManager();
