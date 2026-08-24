import type { MessageRequest, MessageResponse, ExtensionStateResponse } from '../types/messages.js';
import { normalizeDomain } from '../utils/domain.js';

// DOM Elements: Navigation
const navItems = document.querySelectorAll<HTMLButtonElement>('.nav-item');
const tabPanels = document.querySelectorAll<HTMLElement>('.tab-panel');
const sidebarStatus = document.getElementById('sidebarStatus') as HTMLElement;

// DOM Elements: Protection
const optMasterToggle = document.getElementById('optMasterToggle') as HTMLInputElement;
const optBlockAds = document.getElementById('optBlockAds') as HTMLInputElement;
const optBlockTrackers = document.getElementById('optBlockTrackers') as HTMLInputElement;
const optThemeSelect = document.getElementById('optThemeSelect') as HTMLSelectElement;

// DOM Elements: Whitelist
const formAddWhitelist = document.getElementById('formAddWhitelist') as HTMLFormElement;
const inputNewDomain = document.getElementById('inputNewDomain') as HTMLInputElement;
const domainValidationMsg = document.getElementById('domainValidationMsg') as HTMLElement;
const searchWhitelist = document.getElementById('searchWhitelist') as HTMLInputElement;
const whitelistCountBadge = document.getElementById('whitelistCountBadge') as HTMLElement;
const btnClearWhitelist = document.getElementById('btnClearWhitelist') as HTMLButtonElement;
const whitelistContainer = document.getElementById('whitelistContainer') as HTMLElement;

// DOM Elements: Filter lists
const rulesCountAds = document.getElementById('rulesCountAds') as HTMLElement;
const rulesCountTrackers = document.getElementById('rulesCountTrackers') as HTMLElement;
const rulesCountSites = document.getElementById('rulesCountSites') as HTMLElement;
const rulesCountDynamic = document.getElementById('rulesCountDynamic') as HTMLElement;

// DOM Elements: Statistics
const statTotalAds = document.getElementById('statTotalAds') as HTMLElement;
const statTotalTrackers = document.getElementById('statTotalTrackers') as HTMLElement;
const statTotalToday = document.getElementById('statTotalToday') as HTMLElement;
const topSitesTableBody = document.getElementById('topSitesTableBody') as HTMLElement;
const btnResetStats = document.getElementById('btnResetStats') as HTMLButtonElement;

let currentWhitelist: string[] = [];
let fullState: ExtensionStateResponse | null = null;

async function sendMessage<T>(msg: MessageRequest): Promise<MessageResponse<T>> {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.error('Failed to communicate with service worker:', err);
    return { success: false, error: 'Communication error' };
  }
}

// Navigation Tabs
function setupNavigation(): void {
  navItems.forEach(button => {
    button.addEventListener('click', () => {
      const targetTabId = button.getAttribute('data-tab');
      if (!targetTabId) return;

      navItems.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => p.classList.remove('active'));

      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');

      const targetPanel = document.getElementById(targetTabId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

// Render Whitelist Items (Safe DOM manipulation via createElement)
function renderWhitelist(items: string[], filterQuery = ''): void {
  whitelistContainer.replaceChildren();

  const query = filterQuery.toLowerCase().trim();
  const filtered = items.filter(d => d.includes(query));

  whitelistCountBadge.textContent = `${items.length} ${items.length === 1 ? 'domain' : 'domains'}`;

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = items.length === 0 ? 'No domains in whitelist yet.' : 'No matching domains found.';
    whitelistContainer.appendChild(empty);
    return;
  }

  filtered.forEach(domain => {
    const item = document.createElement('div');
    item.className = 'whitelist-item';

    const domainSpan = document.createElement('span');
    domainSpan.className = 'whitelist-domain';
    domainSpan.textContent = domain;

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon-delete';
    delBtn.setAttribute('type', 'button');
    delBtn.setAttribute('aria-label', `Remove ${domain} from whitelist`);
    delBtn.title = 'Remove domain';

    // SVG icon for delete
    delBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    `;

    delBtn.addEventListener('click', async () => {
      const resp = await sendMessage({ type: 'REMOVE_WHITELIST', domain });
      if (resp.success) {
        await loadState();
      }
    });

    item.appendChild(domainSpan);
    item.appendChild(delBtn);
    whitelistContainer.appendChild(item);
  });
}

// Render Statistics & Top Sites Table
async function loadStatistics(): Promise<void> {
  const resp = await sendMessage<{
    global: { totalAdsBlocked: number; totalTrackersBlocked: number };
    daily: Record<string, { ads: number; trackers: number }>;
    sites: Record<string, { ads: number; trackers: number; lastUpdated: number }>;
  }>({ type: 'GET_STATISTICS' });

  if (!resp.success || !resp.data) return;

  const { global, daily, sites } = resp.data;

  statTotalAds.textContent = (global.totalAdsBlocked || 0).toLocaleString();
  statTotalTrackers.textContent = (global.totalTrackersBlocked || 0).toLocaleString();

  // Today total
  const today = new Date().toISOString().slice(0, 10);
  const todayStats = daily[today] || { ads: 0, trackers: 0 };
  const todayTotal = todayStats.ads + todayStats.trackers;
  statTotalToday.textContent = todayTotal.toLocaleString();

  // Top Sites Table (Safe DOM manipulation)
  topSitesTableBody.replaceChildren();

  const siteEntries = Object.entries(sites)
    .map(([domain, stats]) => ({
      domain,
      ads: stats.ads || 0,
      trackers: stats.trackers || 0,
      total: (stats.ads || 0) + (stats.trackers || 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  if (siteEntries.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.setAttribute('colspan', '4');
    cell.style.textAlign = 'center';
    cell.style.color = 'var(--text-muted)';
    cell.style.padding = '24px';
    cell.textContent = 'No site activity recorded yet.';
    row.appendChild(cell);
    topSitesTableBody.appendChild(row);
    return;
  }

  siteEntries.forEach(entry => {
    const row = document.createElement('tr');

    const domainCell = document.createElement('td');
    domainCell.style.fontWeight = '600';
    domainCell.style.color = 'var(--text-primary)';
    domainCell.textContent = entry.domain;

    const adsCell = document.createElement('td');
    adsCell.textContent = entry.ads.toLocaleString();

    const trackersCell = document.createElement('td');
    trackersCell.textContent = entry.trackers.toLocaleString();

    const totalCell = document.createElement('td');
    totalCell.style.fontWeight = '600';
    totalCell.style.color = 'var(--accent-emerald)';
    totalCell.textContent = entry.total.toLocaleString();

    row.appendChild(domainCell);
    row.appendChild(adsCell);
    row.appendChild(trackersCell);
    row.appendChild(totalCell);
    topSitesTableBody.appendChild(row);
  });
}

// Load Full State
async function loadState(): Promise<void> {
  const resp = await sendMessage<ExtensionStateResponse>({ type: 'GET_STATE' });
  if (!resp.success || !resp.data) return;

  fullState = resp.data;
  currentWhitelist = fullState.whitelist || [];

  // Theme
  if (fullState.settings.theme !== 'system') {
    document.documentElement.setAttribute('data-theme', fullState.settings.theme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  optThemeSelect.value = fullState.settings.theme;

  // Protection Controls
  optMasterToggle.checked = fullState.settings.enabled;
  optBlockAds.checked = fullState.settings.blockAds;
  optBlockTrackers.checked = fullState.settings.blockTrackers;

  optBlockAds.disabled = !fullState.settings.enabled;
  optBlockTrackers.disabled = !fullState.settings.enabled;

  if (fullState.settings.enabled) {
    sidebarStatus.textContent = 'Protection Active';
    sidebarStatus.style.color = 'var(--accent-emerald)';
  } else {
    sidebarStatus.textContent = 'Protection Disabled';
    sidebarStatus.style.color = 'var(--text-muted)';
  }

  // Render Whitelist
  renderWhitelist(currentWhitelist, searchWhitelist.value);

  // Render Rules info
  if (fullState.rulesInfo) {
    rulesCountAds.textContent = `${fullState.rulesInfo.adsCount} rules`;
    rulesCountTrackers.textContent = `${fullState.rulesInfo.trackersCount} rules`;
    rulesCountSites.textContent = `${fullState.rulesInfo.sitesCount} rules`;
    rulesCountDynamic.textContent = `${fullState.rulesInfo.dynamicRulesCount} rules`;
  }

  // Load Stats
  await loadStatistics();
}

function setupEventListeners(): void {
  // Master toggle
  optMasterToggle.addEventListener('change', async () => {
    await sendMessage({ type: 'TOGGLE_PROTECTION', enabled: optMasterToggle.checked });
    await loadState();
  });

  // Ads toggle
  optBlockAds.addEventListener('change', async () => {
    await sendMessage({ type: 'TOGGLE_FEATURE', feature: 'blockAds', enabled: optBlockAds.checked });
    await loadState();
  });

  // Trackers toggle
  optBlockTrackers.addEventListener('change', async () => {
    await sendMessage({ type: 'TOGGLE_FEATURE', feature: 'blockTrackers', enabled: optBlockTrackers.checked });
    await loadState();
  });

  // Theme Select
  optThemeSelect.addEventListener('change', async () => {
    const theme = optThemeSelect.value as 'system' | 'dark' | 'light';
    await sendMessage({ type: 'SET_THEME', theme });
    await loadState();
  });

  // Add Whitelist Form
  formAddWhitelist.addEventListener('submit', async (e) => {
    e.preventDefault();
    domainValidationMsg.textContent = '';
    domainValidationMsg.className = 'validation-message';

    const raw = inputNewDomain.value.trim();
    const normalized = normalizeDomain(raw);

    if (!normalized) {
      domainValidationMsg.textContent = 'Please enter a valid domain name (e.g. example.com).';
      domainValidationMsg.className = 'validation-message error';
      return;
    }

    if (currentWhitelist.includes(normalized)) {
      domainValidationMsg.textContent = `${normalized} is already in the whitelist.`;
      domainValidationMsg.className = 'validation-message error';
      return;
    }

    const resp = await sendMessage({ type: 'WHITELIST_SITE', domain: normalized });
    if (resp.success) {
      inputNewDomain.value = '';
      domainValidationMsg.textContent = `Successfully added ${normalized} to whitelist.`;
      domainValidationMsg.className = 'validation-message success';
      await loadState();
      setTimeout(() => {
        domainValidationMsg.textContent = '';
      }, 3000);
    } else {
      domainValidationMsg.textContent = resp.error || 'Failed to add domain.';
      domainValidationMsg.className = 'validation-message error';
    }
  });

  // Search Whitelist
  searchWhitelist.addEventListener('input', () => {
    renderWhitelist(currentWhitelist, searchWhitelist.value);
  });

  // Clear Whitelist
  btnClearWhitelist.addEventListener('click', async () => {
    if (currentWhitelist.length === 0) return;
    const confirmed = confirm('Are you sure you want to clear all domains from your whitelist?');
    if (confirmed) {
      await sendMessage({ type: 'CLEAR_WHITELIST' });
      await loadState();
    }
  });

  // Reset Statistics
  btnResetStats.addEventListener('click', async () => {
    const confirmed = confirm('Are you sure you want to reset all protection statistics? This cannot be undone.');
    if (confirmed) {
      await sendMessage({ type: 'RESET_STATISTICS' });
      await loadState();
    }
  });

  // Developer link
  const linkSidebarDev = document.getElementById('linkSidebarDev');
  if (linkSidebarDev) {
    linkSidebarDev.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof chrome.tabs !== 'undefined' && chrome.tabs.create) {
        chrome.tabs.create({ url: 'https://x.com/PrivyXe' });
      } else {
        window.open('https://x.com/PrivyXe', '_blank');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupEventListeners();
  await loadState();
});
