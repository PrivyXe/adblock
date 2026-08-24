import { Storage } from '../storage/storage.js';
import { Ruleset } from '../blocking/ruleset-manager.js';
import { DynamicRules } from '../blocking/dynamic-rules.js';
import { StatsManager } from './statistics-manager.js';
import { handleRuntimeMessage } from './message-handler.js';
import { CONSTANTS } from '../utils/constants.js';
import { extractDomainFromUrl } from '../utils/domain.js';
import { Logger } from '../utils/logger.js';

// In-memory map to track blocked counts per tab for toolbar badge
const tabBlockedCounts = new Map<number, number>();

function updateTabBadge(tabId: number): void {
  if (typeof chrome.action === 'undefined') return;

  const count = (tabBlockedCounts.get(tabId) || 0) + 1;
  tabBlockedCounts.set(tabId, count);

  chrome.action.setBadgeText({
    text: count > 0 ? (count > 999 ? '999+' : String(count)) : '',
    tabId
  });

  chrome.action.setBadgeBackgroundColor({
    color: '#10b981', // Emerald green
    tabId
  });
}

/**
 * Initializes extension state and ensures DNR rulesets match stored settings.
 */
async function initializeExtension(): Promise<void> {
  Logger.info('Initializing AdBlock & Privacy Shield extension...');

  try {
    const state = await Storage.getFullState();

    // Sync static rulesets with settings
    await Ruleset.applySettings(state.settings);

    // Sync dynamic whitelist rules
    await DynamicRules.syncWhitelistRules(state.whitelist);

    // Sync session pause rules
    await DynamicRules.syncSessionPauseRules(state.pauseState);

    Logger.info('Extension initialization completed successfully.');
  } catch (err) {
    Logger.error('Initialization error:', err);
  }
}

// Lifecycle: Install / Update
chrome.runtime.onInstalled.addListener(async (details) => {
  Logger.info(`Extension onInstalled triggered (${details.reason})`);
  await initializeExtension();
});

// Lifecycle: Startup
chrome.runtime.onStartup.addListener(async () => {
  Logger.info('Extension onStartup triggered');
  await initializeExtension();
});

// Message Listener (Type-safe dispatcher)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleRuntimeMessage(message, sender)
    .then(response => {
      sendResponse(response);
    })
    .catch(err => {
      sendResponse({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    });

  // Return true to indicate asynchronous response
  return true;
});

// Tab navigation listeners to manage badge counts
if (typeof chrome.tabs !== 'undefined') {
  chrome.tabs.onUpdated?.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') {
      tabBlockedCounts.delete(tabId);
      if (typeof chrome.action !== 'undefined') {
        chrome.action.setBadgeText({ text: '', tabId });
      }
    }
  });

  chrome.tabs.onRemoved?.addListener((tabId) => {
    tabBlockedCounts.delete(tabId);
  });
}

// DNR Rule Matched Debug Listener
if (
  typeof chrome.declarativeNetRequest !== 'undefined' &&
  typeof chrome.declarativeNetRequest.onRuleMatchedDebug !== 'undefined'
) {
  try {
    chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
      const ruleId = info.rule.ruleId;
      const rulesetId = info.rule.rulesetId;

      // Skip allow/bypass rules (do not count allowAllRequests as blocked)
      if (ruleId < CONSTANTS.STATIC_ADS_RULE_ID_START && rulesetId === '_dynamic' || rulesetId === '_session') {
        return;
      }

      // Extract domain from request initiator or URL
      const initiator = info.request.initiator || info.request.url || '';
      const domain = initiator ? extractDomainFromUrl(initiator) ?? undefined : undefined;

      let blockType: 'ad' | 'tracker' = 'ad';

      if (
        rulesetId === CONSTANTS.RULESET_IDS.TRACKERS ||
        (ruleId >= CONSTANTS.STATIC_TRACKERS_RULE_ID_START && ruleId < CONSTANTS.STATIC_SITES_RULE_ID_START)
      ) {
        blockType = 'tracker';
      } else if (
        rulesetId === CONSTANTS.RULESET_IDS.ADS ||
        rulesetId === CONSTANTS.RULESET_IDS.SITES ||
        ruleId >= CONSTANTS.STATIC_ADS_RULE_ID_START
      ) {
        blockType = 'ad';
      }

      // Record blocked event in statistics
      StatsManager.recordBlockedEvent(blockType, domain);

      // Update badge on the relevant tab
      if (typeof info.request.tabId === 'number' && info.request.tabId >= 0) {
        updateTabBadge(info.request.tabId);
      }
    });

    Logger.info('DeclarativeNetRequest onRuleMatchedDebug listener active.');
  } catch (err) {
    Logger.error('Failed to register onRuleMatchedDebug listener:', err);
  }
}

// Ensure pending statistics are persisted on suspend/unload
if (typeof chrome.runtime.onSuspend !== 'undefined') {
  chrome.runtime.onSuspend.addListener(() => {
    StatsManager.flushToStorage().catch(err => Logger.error('onSuspend flush error:', err));
  });
}
