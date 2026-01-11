// Page-level whitelist/blacklist rules
import { getStorageValue, setStorageValue } from './storage.js';

const PAGE_RULES_KEY = 'pageRules';

/**
 * Rule types
 */
export const RuleType = {
  WHITELIST: 'whitelist',  // Don't track these pages
  BLACKLIST: 'blacklist'   // Only track these pages (within tracked domains)
};

/**
 * Match types
 */
export const MatchType = {
  EXACT: 'exact',           // Exact URL match
  CONTAINS: 'contains',     // URL contains string
  STARTS_WITH: 'starts_with', // URL starts with
  REGEX: 'regex'            // Regex pattern
};

/**
 * Default page rules configuration
 */
const DEFAULT_PAGE_RULES = {
  enabled: true,
  rules: [],
  defaultBehavior: 'track' // 'track' or 'ignore'
};

/**
 * Get page rules configuration
 * @returns {Promise<Object>}
 */
export async function getPageRules() {
  const rules = await getStorageValue(PAGE_RULES_KEY);
  return rules || { ...DEFAULT_PAGE_RULES };
}

/**
 * Save page rules configuration
 * @param {Object} config
 * @returns {Promise<void>}
 */
export async function savePageRules(config) {
  return setStorageValue(PAGE_RULES_KEY, config);
}

/**
 * Add a page rule
 * @param {Object} rule
 * @returns {Promise<Object>}
 */
export async function addPageRule(rule) {
  const config = await getPageRules();
  
  const newRule = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    type: rule.type || RuleType.WHITELIST,
    matchType: rule.matchType || MatchType.CONTAINS,
    pattern: rule.pattern || '',
    domain: rule.domain || null, // null = all domains
    description: rule.description || '',
    enabled: true,
    createdAt: new Date().toISOString(),
    ...rule
  };
  
  config.rules.push(newRule);
  await savePageRules(config);
  
  return newRule;
}

/**
 * Update a page rule
 * @param {string} ruleId
 * @param {Object} updates
 * @returns {Promise<Object|null>}
 */
export async function updatePageRule(ruleId, updates) {
  const config = await getPageRules();
  const index = config.rules.findIndex(r => r.id === ruleId);
  
  if (index === -1) return null;
  
  config.rules[index] = { ...config.rules[index], ...updates };
  await savePageRules(config);
  
  return config.rules[index];
}

/**
 * Delete a page rule
 * @param {string} ruleId
 * @returns {Promise<boolean>}
 */
export async function deletePageRule(ruleId) {
  const config = await getPageRules();
  const initialLength = config.rules.length;
  config.rules = config.rules.filter(r => r.id !== ruleId);
  
  if (config.rules.length !== initialLength) {
    await savePageRules(config);
    return true;
  }
  return false;
}

/**
 * Check if a URL matches a rule pattern
 * @param {string} url
 * @param {Object} rule
 * @returns {boolean}
 */
function matchesRule(url, rule) {
  if (!rule.enabled) return false;
  
  const urlLower = url.toLowerCase();
  const patternLower = rule.pattern.toLowerCase();
  
  switch (rule.matchType) {
    case MatchType.EXACT:
      return urlLower === patternLower;
      
    case MatchType.CONTAINS:
      return urlLower.includes(patternLower);
      
    case MatchType.STARTS_WITH:
      return urlLower.startsWith(patternLower);
      
    case MatchType.REGEX:
      try {
        const regex = new RegExp(rule.pattern, 'i');
        return regex.test(url);
      } catch (e) {
        console.error('Invalid regex pattern:', rule.pattern);
        return false;
      }
      
    default:
      return false;
  }
}

/**
 * Check if a URL should be tracked based on page rules
 * @param {string} url
 * @param {string} domain - The domain of the URL
 * @returns {Promise<Object>}
 */
export async function shouldTrackPage(url, domain) {
  const config = await getPageRules();
  
  if (!config.enabled) {
    return { shouldTrack: true, reason: 'Page rules disabled' };
  }
  
  // Get rules applicable to this domain
  const applicableRules = config.rules.filter(rule => {
    if (!rule.enabled) return false;
    if (!rule.domain) return true; // Global rule
    return rule.domain.toLowerCase() === domain.toLowerCase();
  });
  
  // Check whitelist rules (don't track these pages)
  const whitelistRules = applicableRules.filter(r => r.type === RuleType.WHITELIST);
  for (const rule of whitelistRules) {
    if (matchesRule(url, rule)) {
      return {
        shouldTrack: false,
        reason: `Whitelisted by rule: ${rule.description || rule.pattern}`,
        matchedRule: rule
      };
    }
  }
  
  // Check blacklist rules (only track these pages)
  const blacklistRules = applicableRules.filter(r => r.type === RuleType.BLACKLIST);
  if (blacklistRules.length > 0) {
    // If there are blacklist rules, URL must match one to be tracked
    for (const rule of blacklistRules) {
      if (matchesRule(url, rule)) {
        return {
          shouldTrack: true,
          reason: `Matched blacklist rule: ${rule.description || rule.pattern}`,
          matchedRule: rule
        };
      }
    }
    // No blacklist rule matched, don't track
    return {
      shouldTrack: false,
      reason: 'No blacklist rule matched',
      matchedRule: null
    };
  }
  
  // Default behavior
  return {
    shouldTrack: config.defaultBehavior === 'track',
    reason: 'Default behavior',
    matchedRule: null
  };
}

/**
 * Get rules for a specific domain
 * @param {string} domain
 * @returns {Promise<Array>}
 */
export async function getRulesForDomain(domain) {
  const config = await getPageRules();
  
  return config.rules.filter(rule => {
    if (!rule.domain) return true; // Global rules
    return rule.domain.toLowerCase() === domain.toLowerCase();
  });
}

/**
 * Get all rules grouped by domain
 * @returns {Promise<Object>}
 */
export async function getRulesGroupedByDomain() {
  const config = await getPageRules();
  const grouped = {
    global: [],
    byDomain: {}
  };
  
  for (const rule of config.rules) {
    if (!rule.domain) {
      grouped.global.push(rule);
    } else {
      const domain = rule.domain.toLowerCase();
      if (!grouped.byDomain[domain]) {
        grouped.byDomain[domain] = [];
      }
      grouped.byDomain[domain].push(rule);
    }
  }
  
  return grouped;
}

/**
 * Get common rule presets
 * @returns {Array}
 */
export function getRulePresets() {
  return [
    {
      name: 'YouTube - Educational',
      type: RuleType.WHITELIST,
      matchType: MatchType.CONTAINS,
      pattern: '/channel/',
      domain: 'youtube.com',
      description: 'Don\'t track YouTube channel pages'
    },
    {
      name: 'YouTube - Subscriptions',
      type: RuleType.WHITELIST,
      matchType: MatchType.CONTAINS,
      pattern: '/feed/subscriptions',
      domain: 'youtube.com',
      description: 'Don\'t track subscriptions feed'
    },
    {
      name: 'Reddit - Productivity',
      type: RuleType.WHITELIST,
      matchType: MatchType.CONTAINS,
      pattern: '/r/productivity',
      domain: 'reddit.com',
      description: 'Don\'t track r/productivity'
    },
    {
      name: 'Reddit - Programming',
      type: RuleType.WHITELIST,
      matchType: MatchType.REGEX,
      pattern: '/r/(programming|learnprogramming|webdev)',
      domain: 'reddit.com',
      description: 'Don\'t track programming subreddits'
    },
    {
      name: 'Twitter - Lists',
      type: RuleType.WHITELIST,
      matchType: MatchType.CONTAINS,
      pattern: '/lists/',
      domain: 'twitter.com',
      description: 'Don\'t track Twitter lists'
    }
  ];
}

/**
 * Add a preset rule
 * @param {Object} preset
 * @returns {Promise<Object>}
 */
export async function addPresetRule(preset) {
  return addPageRule({
    type: preset.type,
    matchType: preset.matchType,
    pattern: preset.pattern,
    domain: preset.domain,
    description: preset.description
  });
}

/**
 * Export rules to JSON
 * @returns {Promise<string>}
 */
export async function exportRules() {
  const config = await getPageRules();
  return JSON.stringify(config, null, 2);
}

/**
 * Import rules from JSON
 * @param {string} json
 * @param {boolean} merge - If true, merge with existing rules
 * @returns {Promise<Object>}
 */
export async function importRules(json, merge = false) {
  const imported = JSON.parse(json);
  
  if (merge) {
    const existing = await getPageRules();
    imported.rules = [...existing.rules, ...imported.rules];
  }
  
  await savePageRules(imported);
  return imported;
}

