import type { MessageRequest, MessageResponse, ExtensionStateResponse } from '../types/messages.js';
import { extractDomainFromUrl, isBrowserInternalUrl } from '../utils/domain.js';

// DOM Elements
const btnMasterToggle = document.getElementById('btnMasterToggle') as HTMLButtonElement;
const masterStatusText = document.getElementById('masterStatusText') as HTMLElement;
const masterStatusDesc = document.getElementById('masterStatusDesc') as HTMLElement;

const activeDomainText = document.getElementById('activeDomainText') as HTMLElement;
const domainStatusBadge = document.getElementById('domainStatusBadge') as HTMLElement;
const siteControls = document.getElementById('siteControls') as HTMLElement;
const internalNotice = document.getElementById('internalNotice') as HTMLElement;

const btnPauseSite = document.getElementById('btnPauseSite') as HTMLButtonElement;
const pauseBtnText = document.getElementById('pauseBtnText') as HTMLElement;
const btnWhitelistSite = document.getElementById('btnWhitelistSite') as HTMLButtonElement;
const whitelistBtnText = document.getElementById('whitelistBtnText') as HTMLElement;

const todayTotalBadge = document.getElementById('todayTotalBadge') as HTMLElement;
const statAdsCount = document.getElementById('statAdsCount') as HTMLElement;
const statTrackersCount = document.getElementById('statTrackersCount') as HTMLElement;
const statAdsSite = document.getElementById('statAdsSite') as HTMLElement;
const statTrackersSite = document.getElementById('statTrackersSite') as HTMLElement;

const chkBlockAds = document.getElementById('chkBlockAds') as HTMLInputElement;
const chkBlockTrackers = document.getElementById('chkBlockTrackers') as HTMLInputElement;
const btnOptions = document.getElementById('btnOptions') as HTMLButtonElement;
const linkMoreSettings = document.getElementById('linkMoreSettings') as HTMLAnchorElement;

let currentDomain: string | null = null;
let isInternalPage = false;
let currentState: ExtensionStateResponse | null = null;

async function sendMessage<T>(msg: MessageRequest): Promise<MessageResponse<T>> {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.error('Failed to communicate with service worker:', err);
    return { success: false, error: 'Communication error' };
  }
}

async function loadActiveTab(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    const targetUrl = activeTab?.url || activeTab?.pendingUrl;
    if (targetUrl) {
      isInternalPage = isBrowserInternalUrl(targetUrl);
      currentDomain = extractDomainFromUrl(targetUrl);
    }
  } catch (err) {
    console.warn('Unable to query active tab:', err);
  }
}

function updateUI(state: ExtensionStateResponse): void {
  currentState = state;

  // Set Theme
  if (state.settings.theme !== 'system') {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  // Master Protection Toggle
  const isMasterOn = state.settings.enabled;
  btnMasterToggle.setAttribute('aria-pressed', String(isMasterOn));
  if (isMasterOn) {
    masterStatusText.textContent = 'Protected';
    masterStatusDesc.textContent = 'Network blocking active';
  } else {
    masterStatusText.textContent = 'Disabled';
    masterStatusDesc.textContent = 'Protection paused globally';
  }

  // Active Domain & Site Controls
  if (isInternalPage || !currentDomain) {
    activeDomainText.textContent = currentDomain || 'Internal Browser Page';
    domainStatusBadge.textContent = 'System';
    domainStatusBadge.className = 'domain-badge badge-whitelisted';
    siteControls.classList.add('hidden');
    internalNotice.classList.remove('hidden');
  } else {
    activeDomainText.textContent = currentDomain;
    siteControls.classList.remove('hidden');
    internalNotice.classList.add('hidden');

    if (!isMasterOn) {
      domainStatusBadge.textContent = 'Disabled';
      domainStatusBadge.className = 'domain-badge badge-whitelisted';
    } else if (state.isCurrentSitePaused) {
      domainStatusBadge.textContent = 'Paused';
      domainStatusBadge.className = 'domain-badge badge-paused';
    } else if (state.isCurrentSiteWhitelisted) {
      domainStatusBadge.textContent = 'Whitelisted';
      domainStatusBadge.className = 'domain-badge badge-whitelisted';
    } else {
      domainStatusBadge.textContent = 'Protected';
      domainStatusBadge.className = 'domain-badge badge-active';
    }

    // Pause Button State
    if (state.isCurrentSitePaused) {
      btnPauseSite.classList.add('active');
      pauseBtnText.textContent = 'Resume Site';
    } else {
      btnPauseSite.classList.remove('active');
      pauseBtnText.textContent = 'Pause Site';
    }

    // Whitelist Button State
    if (state.isCurrentSiteWhitelisted) {
      btnWhitelistSite.classList.add('active');
      whitelistBtnText.textContent = 'Whitelisted';
    } else {
      btnWhitelistSite.classList.remove('active');
      whitelistBtnText.textContent = 'Whitelist';
    }
  }

  // Statistics
  const totalToday = (state.todayStats.ads || 0) + (state.todayStats.trackers || 0);
  todayTotalBadge.textContent = `${totalToday.toLocaleString()} today`;

  statAdsCount.textContent = (state.statistics.totalAdsBlocked || 0).toLocaleString();
  statTrackersCount.textContent = (state.statistics.totalTrackersBlocked || 0).toLocaleString();

  const siteAds = state.currentSiteStats?.ads || 0;
  const siteTrackers = state.currentSiteStats?.trackers || 0;
  statAdsSite.textContent = `${siteAds.toLocaleString()} on this site`;
  statTrackersSite.textContent = `${siteTrackers.toLocaleString()} on this site`;

  // Feature Toggles
  chkBlockAds.checked = state.settings.blockAds;
  chkBlockTrackers.checked = state.settings.blockTrackers;
  chkBlockAds.disabled = !isMasterOn;
  chkBlockTrackers.disabled = !isMasterOn;
}

async function refreshState(): Promise<void> {
  const resp = await sendMessage<ExtensionStateResponse>({
    type: 'GET_STATE',
    domain: currentDomain ?? undefined
  });

  if (resp.success && resp.data) {
    updateUI(resp.data);
  }
}

// Event Listeners (Strict CSP compliant, zero inline code)
function setupListeners(): void {
  btnMasterToggle.addEventListener('click', async () => {
    if (!currentState) return;
    const newEnabled = !currentState.settings.enabled;
    const resp = await sendMessage({ type: 'TOGGLE_PROTECTION', enabled: newEnabled });
    if (resp.success) {
      await refreshState();
    }
  });

  chkBlockAds.addEventListener('change', async () => {
    await sendMessage({
      type: 'TOGGLE_FEATURE',
      feature: 'blockAds',
      enabled: chkBlockAds.checked
    });
    await refreshState();
  });

  chkBlockTrackers.addEventListener('change', async () => {
    await sendMessage({
      type: 'TOGGLE_FEATURE',
      feature: 'blockTrackers',
      enabled: chkBlockTrackers.checked
    });
    await refreshState();
  });

  btnPauseSite.addEventListener('click', async () => {
    if (!currentDomain || !currentState) return;
    if (currentState.isCurrentSitePaused) {
      await sendMessage({ type: 'UNPAUSE_SITE', domain: currentDomain });
    } else {
      await sendMessage({ type: 'PAUSE_SITE', domain: currentDomain });
    }
    await refreshState();
  });

  btnWhitelistSite.addEventListener('click', async () => {
    if (!currentDomain || !currentState) return;
    if (currentState.isCurrentSiteWhitelisted) {
      await sendMessage({ type: 'REMOVE_WHITELIST', domain: currentDomain });
    } else {
      await sendMessage({ type: 'WHITELIST_SITE', domain: currentDomain });
    }
    await refreshState();
  });

  const openOptions = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options/options.html'));
    }
  };

  btnOptions.addEventListener('click', openOptions);
  linkMoreSettings.addEventListener('click', (e) => {
    e.preventDefault();
    openOptions();
  });

  const linkDev = document.getElementById('linkDev');
  if (linkDev) {
    linkDev.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof chrome.tabs !== 'undefined' && chrome.tabs.create) {
        chrome.tabs.create({ url: 'https://x.com/PrivyXe' });
      } else {
        window.open('https://x.com/PrivyXe', '_blank');
      }
    });
  }
}

// Initialize Popup
document.addEventListener('DOMContentLoaded', async () => {
  setupListeners();
  await loadActiveTab();
  await refreshState();

  // Refresh counters while popup is active
  setInterval(() => {
    refreshState();
  }, 1200);
});
