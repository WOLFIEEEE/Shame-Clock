// Site matching and URL detection logic
import { getTrackedSites, getUserSites, saveUserSites } from './storage.js';

let defaultSites = [];
let userSites = [];
let allSites = [];

/**
 * Load default sites from JSON file
 */
async function loadDefaultSites() {
  try {
    const browserAPI = typeof chrome !== 'undefined' && chrome.runtime ? chrome : browser;
    const response = await fetch(browserAPI.runtime.getURL('data/default-sites.json'));
    defaultSites = await response.json();
    return defaultSites;
  } catch (error) {
    console.error('Error loading default sites:', error);
    return [];
  }
}

/**
 * Load user sites from storage
 */
async function loadUserSites() {
  try {
    userSites = await getUserSites();
    return userSites;
  } catch (error) {
    console.error('Error loading user sites:', error);
    return [];
  }
}

/**
 * Extract domain from URL
 * @param {string} url - Full URL
 * @returns {string} - Domain name
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '').toLowerCase();
  } catch (error) {
    // If URL parsing fails, try simple extraction
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    return match ? match[1].toLowerCase() : url.toLowerCase();
  }
}

/**
 * Check if a domain matches a pattern
 * @param {string} domain - Domain to check
 * @param {string} pattern - Pattern to match (supports wildcards)
 * @returns {boolean}
 */
function matchesPattern(domain, pattern) {
  const normalizedPattern = pattern.toLowerCase().replace(/^www\./, '');
  const normalizedDomain = domain.toLowerCase();
  
  // Exact match
  if (normalizedPattern === normalizedDomain) {
    return true;
  }
  
  // Wildcard support (e.g., *.example.com)
  if (normalizedPattern.startsWith('*.')) {
    const baseDomain = normalizedPattern.substring(2);
    return normalizedDomain === baseDomain || normalizedDomain.endsWith('.' + baseDomain);
  }
  
  // Subdomain match (e.g., example.com matches www.example.com)
  if (normalizedDomain.endsWith('.' + normalizedPattern)) {
    return true;
  }
  
  // Regex pattern support
  try {
    const regex = new RegExp(normalizedPattern);
    return regex.test(normalizedDomain);
  } catch (e) {
    // Not a valid regex, ignore
  }
  
  return false;
}

/**
 * Check if a URL matches any tracked site
 * @param {string} url - URL to check
 * @returns {Object|null} - Matched site object or null
 */
export async function isTrackedSite(url) {
  // Load sites if not already loaded
  if (allSites.length === 0) {
    await refreshSites();
  }
  
  const domain = extractDomain(url);
  
  // Check against all sites
  for (const site of allSites) {
    if (!site.enabled) continue;
    
    const sitePattern = site.domain || site.pattern || site;
    
    if (typeof sitePattern === 'string') {
      if (matchesPattern(domain, sitePattern)) {
        return {
          domain: domain,
          pattern: sitePattern,
          name: site.name || sitePattern,
          category: site.category || 'unknown',
          ...site
        };
      }
    }
  }
  
  return null;
}

/**
 * Refresh the sites list from storage and default sites
 */
export async function refreshSites() {
  defaultSites = await loadDefaultSites();
  userSites = await loadUserSites();
  
  // Combine default and user sites
  allSites = [
    ...defaultSites,
    ...userSites.map(site => ({
      domain: site,
      name: site,
      category: 'user_defined',
      enabled: true,
      userAdded: true
    }))
  ];
  
  return allSites;
}

/**
 * Add a user site
 * @param {string} sitePattern - Site domain or pattern
 * @returns {Promise<void>}
 */
export async function addUserSite(sitePattern) {
  const sites = await getUserSites();
  const normalized = sitePattern.toLowerCase().trim();
  
  if (!sites.includes(normalized)) {
    sites.push(normalized);
    await saveUserSites(sites);
    await refreshSites();
  }
}

/**
 * Remove a user site
 * @param {string} sitePattern - Site domain or pattern to remove
 * @returns {Promise<void>}
 */
export async function removeUserSite(sitePattern) {
  const sites = await getUserSites();
  const normalized = sitePattern.toLowerCase().trim();
  const filtered = sites.filter(s => s !== normalized);
  await saveUserSites(filtered);
  await refreshSites();
}

/**
 * Get all tracked sites
 * @returns {Promise<Array>}
 */
export async function getAllTrackedSites() {
  if (allSites.length === 0) {
    await refreshSites();
  }
  return allSites;
}

