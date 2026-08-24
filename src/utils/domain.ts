/**
 * High-performance, RFC-compliant Domain & URL Normalization Utilities.
 */

const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
const LOCALHOST_REGEX = /^localhost(?::\d+)?$/i;

/**
 * Normalizes user input or raw strings into a clean FQDN hostname.
 * Returns null if the domain is malformed or contains invalid characters.
 */
export function normalizeDomain(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  let cleaned = input.trim().toLowerCase();
  if (!cleaned) {
    return null;
  }

  // Remove common leading protocol prefixes
  cleaned = cleaned.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');

  // Remove authentication if present (user:pass@)
  const atIndex = cleaned.indexOf('@');
  if (atIndex !== -1) {
    cleaned = cleaned.slice(atIndex + 1);
  }

  // Strip path, query params, hash fragments
  const firstSlash = cleaned.indexOf('/');
  if (firstSlash !== -1) {
    cleaned = cleaned.slice(0, firstSlash);
  }
  const firstQuestion = cleaned.indexOf('?');
  if (firstQuestion !== -1) {
    cleaned = cleaned.slice(0, firstQuestion);
  }
  const firstHash = cleaned.indexOf('#');
  if (firstHash !== -1) {
    cleaned = cleaned.slice(0, firstHash);
  }

  // Strip port if present (:8080)
  const colonIndex = cleaned.indexOf(':');
  if (colonIndex !== -1 && !cleaned.includes('[')) {
    cleaned = cleaned.slice(0, colonIndex);
  }

  // Strip trailing dots
  cleaned = cleaned.replace(/\.+$/, '');

  // Strip leading www. if needed or keep domain format
  // Note: users whitelisting example.com or www.example.com
  if (cleaned === 'localhost' || LOCALHOST_REGEX.test(cleaned)) {
    return 'localhost';
  }

  if (cleaned.length > 253) {
    return null;
  }

  // Check valid hostname format
  if (!isValidDomain(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Validates whether a normalized string is a valid FQDN domain.
 */
export function isValidDomain(domain: string): boolean {
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  if (domain === 'localhost') {
    return true;
  }

  if (!DOMAIN_REGEX.test(domain)) {
    return false;
  }

  // Check individual label constraints
  const labels = domain.split('.');
  if (labels.length < 2) {
    return false;
  }

  for (const label of labels) {
    if (label.length === 0 || label.length > 63) {
      return false;
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return false;
    }
  }

  return true;
}

/**
 * Extracts a normalized domain from a full URL.
 */
export function extractDomainFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol)) {
      return null;
    }
    return normalizeDomain(parsed.hostname);
  } catch {
    // If URL parsing fails, attempt fallback string normalization
    return normalizeDomain(url);
  }
}

/**
 * Returns true if the candidate domain is identical to or a subdomain of the target parent domain.
 * Example: 'sub.example.com' is subdomain of 'example.com' -> true
 * Example: 'example.com' is subdomain of 'example.com' -> true
 * Example: 'badexample.com' is subdomain of 'example.com' -> false
 */
export function isSubdomainOrEqual(candidate: string, parent: string): boolean {
  const normCandidate = normalizeDomain(candidate);
  const normParent = normalizeDomain(parent);

  if (!normCandidate || !normParent) {
    return false;
  }

  if (normCandidate === normParent) {
    return true;
  }

  return normCandidate.endsWith('.' + normParent);
}

/**
 * Checks whether a URL is an internal browser page or restricted scheme
 * (where extension blocking cannot or should not execute).
 */
export function isBrowserInternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return true;
  }

  const lower = url.toLowerCase().trim();
  return (
    lower.startsWith('chrome://') ||
    lower.startsWith('chrome-extension://') ||
    lower.startsWith('edge://') ||
    lower.startsWith('brave://') ||
    lower.startsWith('opera://') ||
    lower.startsWith('about:') ||
    lower.startsWith('view-source:') ||
    lower.startsWith('devtools://') ||
    lower.startsWith('file://') ||
    lower.startsWith('data:') ||
    lower.startsWith('blob:')
  );
}
