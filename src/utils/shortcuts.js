// Keyboard shortcuts system
import { getStorageValue, setStorageValue } from './storage.js';

const SHORTCUTS_KEY = 'keyboardShortcuts';

/**
 * Available shortcut actions
 */
export const ShortcutAction = {
  OPEN_POPUP: 'open_popup',
  OPEN_SETTINGS: 'open_settings',
  PAUSE_TRACKING: 'pause_tracking',
  RESUME_TRACKING: 'resume_tracking',
  TOGGLE_TRACKING: 'toggle_tracking',
  START_FOCUS: 'start_focus',
  END_FOCUS: 'end_focus',
  QUICK_STATS: 'quick_stats',
  DISMISS_POPUP: 'dismiss_popup',
  SNOOZE_POPUP: 'snooze_popup'
};

/**
 * Default keyboard shortcuts
 */
const DEFAULT_SHORTCUTS = {
  enabled: true,
  shortcuts: {
    [ShortcutAction.TOGGLE_TRACKING]: {
      key: 'KeyP',
      modifiers: ['ctrl', 'shift'],
      description: 'Pause/Resume tracking',
      enabled: true
    },
    [ShortcutAction.OPEN_SETTINGS]: {
      key: 'KeyS',
      modifiers: ['ctrl', 'shift'],
      description: 'Open settings',
      enabled: true
    },
    [ShortcutAction.DISMISS_POPUP]: {
      key: 'Escape',
      modifiers: [],
      description: 'Dismiss current popup',
      enabled: true
    },
    [ShortcutAction.SNOOZE_POPUP]: {
      key: 'KeyN',
      modifiers: ['ctrl'],
      description: 'Snooze popup for 5 minutes',
      enabled: true
    },
    [ShortcutAction.START_FOCUS]: {
      key: 'KeyF',
      modifiers: ['ctrl', 'shift'],
      description: 'Start focus session',
      enabled: true
    },
    [ShortcutAction.QUICK_STATS]: {
      key: 'KeyQ',
      modifiers: ['ctrl', 'shift'],
      description: 'Show quick stats',
      enabled: true
    }
  }
};

/**
 * Get shortcuts configuration
 * @returns {Promise<Object>}
 */
export async function getShortcutsConfig() {
  const config = await getStorageValue(SHORTCUTS_KEY);
  return config || { ...DEFAULT_SHORTCUTS };
}

/**
 * Save shortcuts configuration
 * @param {Object} config
 * @returns {Promise<void>}
 */
export async function saveShortcutsConfig(config) {
  return setStorageValue(SHORTCUTS_KEY, config);
}

/**
 * Update a specific shortcut
 * @param {string} action
 * @param {Object} shortcut
 * @returns {Promise<void>}
 */
export async function updateShortcut(action, shortcut) {
  const config = await getShortcutsConfig();
  config.shortcuts[action] = { ...config.shortcuts[action], ...shortcut };
  await saveShortcutsConfig(config);
}

/**
 * Reset shortcuts to defaults
 * @returns {Promise<void>}
 */
export async function resetShortcuts() {
  await saveShortcutsConfig({ ...DEFAULT_SHORTCUTS });
}

/**
 * Check if a keyboard event matches a shortcut
 * @param {KeyboardEvent} event
 * @param {Object} shortcut
 * @returns {boolean}
 */
export function matchesShortcut(event, shortcut) {
  if (!shortcut.enabled) return false;
  
  // Check key
  if (event.code !== shortcut.key) return false;
  
  // Check modifiers
  const modifiers = shortcut.modifiers || [];
  
  if (modifiers.includes('ctrl') !== event.ctrlKey) return false;
  if (modifiers.includes('shift') !== event.shiftKey) return false;
  if (modifiers.includes('alt') !== event.altKey) return false;
  if (modifiers.includes('meta') !== event.metaKey) return false;
  
  return true;
}

/**
 * Find action for a keyboard event
 * @param {KeyboardEvent} event
 * @returns {Promise<string|null>}
 */
export async function findActionForEvent(event) {
  const config = await getShortcutsConfig();
  
  if (!config.enabled) return null;
  
  for (const [action, shortcut] of Object.entries(config.shortcuts)) {
    if (matchesShortcut(event, shortcut)) {
      return action;
    }
  }
  
  return null;
}

/**
 * Format shortcut for display
 * @param {Object} shortcut
 * @returns {string}
 */
export function formatShortcut(shortcut) {
  const parts = [];
  
  const modifiers = shortcut.modifiers || [];
  
  if (modifiers.includes('ctrl')) {
    parts.push(isMac() ? '⌃' : 'Ctrl');
  }
  if (modifiers.includes('shift')) {
    parts.push(isMac() ? '⇧' : 'Shift');
  }
  if (modifiers.includes('alt')) {
    parts.push(isMac() ? '⌥' : 'Alt');
  }
  if (modifiers.includes('meta')) {
    parts.push(isMac() ? '⌘' : 'Win');
  }
  
  // Format key name
  let keyName = shortcut.key;
  if (keyName.startsWith('Key')) {
    keyName = keyName.substring(3);
  } else if (keyName.startsWith('Digit')) {
    keyName = keyName.substring(5);
  } else if (keyName === 'Escape') {
    keyName = 'Esc';
  } else if (keyName === 'ArrowLeft') {
    keyName = '←';
  } else if (keyName === 'ArrowRight') {
    keyName = '→';
  } else if (keyName === 'ArrowUp') {
    keyName = '↑';
  } else if (keyName === 'ArrowDown') {
    keyName = '↓';
  }
  
  parts.push(keyName);
  
  return parts.join(isMac() ? '' : '+');
}

/**
 * Parse shortcut string to object
 * @param {string} shortcutStr
 * @returns {Object}
 */
export function parseShortcutString(shortcutStr) {
  const parts = shortcutStr.split('+').map(p => p.trim().toLowerCase());
  const modifiers = [];
  let key = '';
  
  for (const part of parts) {
    if (['ctrl', 'control'].includes(part)) {
      modifiers.push('ctrl');
    } else if (['shift'].includes(part)) {
      modifiers.push('shift');
    } else if (['alt', 'option'].includes(part)) {
      modifiers.push('alt');
    } else if (['meta', 'cmd', 'command', 'win', 'windows'].includes(part)) {
      modifiers.push('meta');
    } else {
      // This is the key
      if (part.length === 1 && part.match(/[a-z]/i)) {
        key = `Key${part.toUpperCase()}`;
      } else if (part.length === 1 && part.match(/[0-9]/)) {
        key = `Digit${part}`;
      } else {
        key = part.charAt(0).toUpperCase() + part.slice(1);
      }
    }
  }
  
  return { key, modifiers };
}

/**
 * Check if there's a conflict with another shortcut
 * @param {Object} shortcut
 * @param {string} excludeAction
 * @returns {Promise<string|null>}
 */
export async function checkConflict(shortcut, excludeAction = null) {
  const config = await getShortcutsConfig();
  
  for (const [action, existing] of Object.entries(config.shortcuts)) {
    if (action === excludeAction) continue;
    if (!existing.enabled) continue;
    
    if (existing.key === shortcut.key) {
      const existingMods = existing.modifiers || [];
      const newMods = shortcut.modifiers || [];
      
      if (existingMods.length === newMods.length &&
          existingMods.every(m => newMods.includes(m))) {
        return action;
      }
    }
  }
  
  return null;
}

/**
 * Get all shortcuts for display
 * @returns {Promise<Array>}
 */
export async function getAllShortcutsForDisplay() {
  const config = await getShortcutsConfig();
  
  return Object.entries(config.shortcuts).map(([action, shortcut]) => ({
    action,
    description: shortcut.description,
    shortcut: formatShortcut(shortcut),
    enabled: shortcut.enabled,
    key: shortcut.key,
    modifiers: shortcut.modifiers
  }));
}

/**
 * Check if running on Mac
 * @returns {boolean}
 */
function isMac() {
  return typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
}

/**
 * Create shortcut handler for content scripts
 * @param {Object} handlers - Map of action to handler function
 * @returns {Function}
 */
export function createShortcutHandler(handlers) {
  return async (event) => {
    const action = await findActionForEvent(event);
    
    if (action && handlers[action]) {
      event.preventDefault();
      event.stopPropagation();
      handlers[action](event);
    }
  };
}

/**
 * Register global shortcut listener
 * @param {Object} handlers
 * @returns {Function} - Cleanup function
 */
export function registerShortcutListener(handlers) {
  const handler = createShortcutHandler(handlers);
  document.addEventListener('keydown', handler);
  
  return () => {
    document.removeEventListener('keydown', handler);
  };
}

