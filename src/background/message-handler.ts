import { Storage } from '../storage/storage.js';
import { Ruleset } from '../blocking/ruleset-manager.js';
import { DynamicRules } from '../blocking/dynamic-rules.js';
import { StatsManager } from './statistics-manager.js';
import { normalizeDomain, isBrowserInternalUrl, isSubdomainOrEqual } from '../utils/domain.js';
import { getTodayDateString } from '../utils/validation.js';
import { Logger } from '../utils/logger.js';
import type { MessageRequest, MessageResponse, ExtensionStateResponse, RulesInfo } from '../types/messages.js';

export async function handleRuntimeMessage(
  message: unknown,
  _sender: chrome.runtime.MessageSender
): Promise<MessageResponse> {
  if (!message || typeof message !== 'object' || !('type' in message)) {
    return { success: false, error: 'Invalid message structure' };
  }

  const req = message as MessageRequest;

  try {
    switch (req.type) {
      case 'GET_STATE': {
        await StatsManager.flushToStorage();
        const state = await Storage.getFullState();
        const domain = req.domain ? normalizeDomain(req.domain) ?? undefined : undefined;
        const isInternal = domain ? isBrowserInternalUrl(req.domain || '') : false;

        const isCurrentSiteWhitelisted = domain
          ? state.whitelist.some(w => isSubdomainOrEqual(domain, w))
          : false;

        const isCurrentSitePaused = domain
          ? state.pauseState.some(p => isSubdomainOrEqual(domain, p))
          : false;

        const today = getTodayDateString();
        const todayStats = state.dailyStatistics[today] || { ads: 0, trackers: 0 };
        const currentSiteStats = domain ? state.siteStatistics[domain] : undefined;

        const dynamicCount = await DynamicRules.getDynamicRulesCount();
        const sessionCount = await DynamicRules.getSessionRulesCount();

        const rulesInfo: RulesInfo = {
          adsCount: 55,
          trackersCount: 38,
          sitesCount: 2,
          dynamicRulesCount: dynamicCount,
          sessionRulesCount: sessionCount
        };

        const responseData: ExtensionStateResponse = {
          settings: state.settings,
          whitelist: state.whitelist,
          isCurrentSitePaused,
          isCurrentSiteWhitelisted,
          currentDomain: domain,
          isInternalUrl: isInternal,
          statistics: state.statistics,
          currentSiteStats,
          todayStats,
          rulesInfo
        };

        return { success: true, data: responseData };
      }

      case 'TOGGLE_PROTECTION': {
        if (typeof req.enabled !== 'boolean') {
          return { success: false, error: 'Invalid enabled boolean value' };
        }
        const updated = await Storage.updateSettings({ enabled: req.enabled });
        await Ruleset.applySettings(updated);
        return { success: true, data: updated };
      }

      case 'TOGGLE_FEATURE': {
        if (req.feature !== 'blockAds' && req.feature !== 'blockTrackers') {
          return { success: false, error: 'Invalid feature identifier' };
        }
        const partial = { [req.feature]: Boolean(req.enabled) };
        const updated = await Storage.updateSettings(partial);
        await Ruleset.applySettings(updated);
        return { success: true, data: updated };
      }

      case 'SET_THEME': {
        if (req.theme !== 'system' && req.theme !== 'dark' && req.theme !== 'light') {
          return { success: false, error: 'Invalid theme' };
        }
        const updated = await Storage.updateSettings({ theme: req.theme });
        return { success: true, data: updated };
      }

      case 'PAUSE_SITE': {
        const domain = normalizeDomain(req.domain);
        if (!domain) {
          return { success: false, error: 'Invalid domain format' };
        }
        const current = await Storage.getPauseState();
        if (!current.includes(domain)) {
          const updated = [...current, domain];
          await Storage.setPauseState(updated);
          await DynamicRules.syncSessionPauseRules(updated);
        }
        return { success: true };
      }

      case 'UNPAUSE_SITE': {
        const domain = normalizeDomain(req.domain);
        if (!domain) {
          return { success: false, error: 'Invalid domain format' };
        }
        const current = await Storage.getPauseState();
        const updated = current.filter(d => d !== domain);
        await Storage.setPauseState(updated);
        await DynamicRules.syncSessionPauseRules(updated);
        return { success: true };
      }

      case 'WHITELIST_SITE': {
        const domain = normalizeDomain(req.domain);
        if (!domain) {
          return { success: false, error: 'Invalid domain format' };
        }
        const current = await Storage.getWhitelist();
        if (!current.includes(domain)) {
          const updated = [...current, domain];
          await Storage.setWhitelist(updated);
          await DynamicRules.syncWhitelistRules(updated);
        }
        return { success: true };
      }

      case 'REMOVE_WHITELIST': {
        const domain = normalizeDomain(req.domain);
        if (!domain) {
          return { success: false, error: 'Invalid domain format' };
        }
        const current = await Storage.getWhitelist();
        const updated = current.filter(d => d !== domain);
        await Storage.setWhitelist(updated);
        await DynamicRules.syncWhitelistRules(updated);
        return { success: true };
      }

      case 'CLEAR_WHITELIST': {
        await Storage.setWhitelist([]);
        await DynamicRules.syncWhitelistRules([]);
        return { success: true };
      }

      case 'GET_STATISTICS': {
        await StatsManager.flushToStorage();
        const full = await Storage.getFullState();
        return {
          success: true,
          data: {
            global: full.statistics,
            daily: full.dailyStatistics,
            sites: full.siteStatistics
          }
        };
      }

      case 'RESET_STATISTICS': {
        StatsManager.resetMemory();
        await Storage.resetAllStatistics();
        return { success: true };
      }

      case 'GET_RULES_INFO': {
        const dynamicCount = await DynamicRules.getDynamicRulesCount();
        const sessionCount = await DynamicRules.getSessionRulesCount();
        const info: RulesInfo = {
          adsCount: 55,
          trackersCount: 38,
          sitesCount: 2,
          dynamicRulesCount: dynamicCount,
          sessionRulesCount: sessionCount
        };
        return { success: true, data: info };
      }

      default: {
        return { success: false, error: `Unknown message type: ${(req as { type: string }).type}` };
      }
    }
  } catch (err) {
    Logger.error('Message handler exception:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Internal error' };
  }
}
