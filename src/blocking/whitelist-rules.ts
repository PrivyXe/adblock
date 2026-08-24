import { CONSTANTS } from '../utils/constants.js';
import { normalizeDomain } from '../utils/domain.js';
import type { DNRRule } from './rule-types.js';

/**
 * Generates deterministic DNR rules for whitelisted domains.
 * Uses 'allowAllRequests' with high priority (1000) on initiatorDomains.
 */
export function generateWhitelistRules(domains: string[], idOffset = CONSTANTS.DYNAMIC_RULE_ID_START): DNRRule[] {
  const validDomains = Array.from(
    new Set(
      domains
        .map(d => normalizeDomain(d))
        .filter((d): d is string => Boolean(d))
    )
  ).sort();

  return validDomains.map((domain, index) => {
    const rule: DNRRule = {
      id: idOffset + index,
      priority: CONSTANTS.PRIORITY_DYNAMIC_WHITELIST,
      action: {
        type: 'allowAllRequests'
      },
      condition: {
        initiatorDomains: [domain]
      }
    };
    return rule;
  });
}

/**
 * Generates temporary session DNR rules for paused websites.
 * Uses highest priority (2000) on initiatorDomains.
 */
export function generatePauseRules(domains: string[], idOffset = CONSTANTS.SESSION_RULE_ID_START): DNRRule[] {
  const validDomains = Array.from(
    new Set(
      domains
        .map(d => normalizeDomain(d))
        .filter((d): d is string => Boolean(d))
    )
  ).sort();

  return validDomains.map((domain, index) => {
    const rule: DNRRule = {
      id: idOffset + index,
      priority: CONSTANTS.PRIORITY_SESSION_PAUSE,
      action: {
        type: 'allowAllRequests'
      },
      condition: {
        initiatorDomains: [domain]
      }
    };
    return rule;
  });
}
