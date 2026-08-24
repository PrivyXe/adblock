/**
 * DeclarativeNetRequest Type Definitions.
 */

export type RuleActionType =
  | 'block'
  | 'allow'
  | 'allowAllRequests'
  | 'redirect'
  | 'upgradeScheme'
  | 'modifyHeaders';

export type ResourceType =
  | 'main_frame'
  | 'sub_frame'
  | 'stylesheet'
  | 'script'
  | 'image'
  | 'font'
  | 'object'
  | 'xmlhttprequest'
  | 'ping'
  | 'csp_report'
  | 'media'
  | 'websocket'
  | 'webtransport'
  | 'webbundle'
  | 'other';

export interface DNRRuleAction {
  type: RuleActionType;
}

export interface DNRRuleCondition {
  urlFilter?: string;
  regexFilter?: string;
  isUrlFilterCaseSensitive?: boolean;
  domains?: string[];
  excludedDomains?: string[];
  initiatorDomains?: string[];
  excludedInitiatorDomains?: string[];
  requestDomains?: string[];
  excludedRequestDomains?: string[];
  resourceTypes?: ResourceType[];
  excludedResourceTypes?: ResourceType[];
}

export interface DNRRule {
  id: number;
  priority: number;
  action: DNRRuleAction;
  condition: DNRRuleCondition;
}
