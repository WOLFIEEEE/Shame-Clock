// Preset configurations for quick setup
import { saveConfig, getConfig } from './storage.js';
import { DEFAULT_CONFIG } from './config.js';

/**
 * Preset types
 */
export const PresetType = {
  STRICT: 'strict',
  MODERATE: 'moderate',
  LENIENT: 'lenient'
};

/**
 * Preset configurations
 */
export const PRESETS = {
  [PresetType.STRICT]: {
    name: 'Strict Mode',
    description: 'Maximum accountability. Frequent reminders to keep you focused.',
    icon: '🔒',
    config: {
      popupEnabled: true,
      minTimeBeforePopup: 3 * 60 * 1000, // 3 minutes
      popupDuration: 45 * 1000, // 45 seconds
      popupCooldown: 2 * 60 * 1000, // 2 minutes
      thresholds: {
        low: 3 * 60 * 1000,
        medium: 10 * 60 * 1000,
        high: 20 * 60 * 1000,
        veryHigh: Infinity
      },
      intervals: {
        medium: 5 * 60 * 1000,
        high: 3 * 60 * 1000,
        veryHigh: 2 * 60 * 1000
      }
    }
  },
  [PresetType.MODERATE]: {
    name: 'Moderate Mode',
    description: 'Balanced approach. Recommended for most users.',
    icon: '⚖️',
    config: {
      popupEnabled: true,
      minTimeBeforePopup: 5 * 60 * 1000, // 5 minutes
      popupDuration: 30 * 1000, // 30 seconds
      popupCooldown: 3 * 60 * 1000, // 3 minutes
      thresholds: {
        low: 5 * 60 * 1000,
        medium: 15 * 60 * 1000,
        high: 30 * 60 * 1000,
        veryHigh: Infinity
      },
      intervals: {
        medium: 10 * 60 * 1000,
        high: 5 * 60 * 1000,
        veryHigh: 3 * 60 * 1000
      }
    }
  },
  [PresetType.LENIENT]: {
    name: 'Lenient Mode',
    description: 'Gentle reminders. Less frequent, more relaxed.',
    icon: '🌿',
    config: {
      popupEnabled: true,
      minTimeBeforePopup: 10 * 60 * 1000, // 10 minutes
      popupDuration: 20 * 1000, // 20 seconds
      popupCooldown: 5 * 60 * 1000, // 5 minutes
      thresholds: {
        low: 10 * 60 * 1000,
        medium: 20 * 60 * 1000,
        high: 45 * 60 * 1000,
        veryHigh: Infinity
      },
      intervals: {
        medium: 15 * 60 * 1000,
        high: 10 * 60 * 1000,
        veryHigh: 5 * 60 * 1000
      }
    }
  }
};

/**
 * Apply a preset configuration
 * @param {string} presetType - Preset type
 * @returns {Promise<void>}
 */
export async function applyPreset(presetType) {
  const preset = PRESETS[presetType];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetType}`);
  }
  
  const currentConfig = await getConfig();
  const newConfig = {
    ...DEFAULT_CONFIG,
    ...currentConfig, // Keep existing settings
    ...preset.config // Apply preset overrides
  };
  
  await saveConfig(newConfig);
  return preset;
}

/**
 * Get preset info
 * @param {string} presetType - Preset type
 * @returns {Object}
 */
export function getPresetInfo(presetType) {
  return PRESETS[presetType] || null;
}

/**
 * Get all presets
 * @returns {Array}
 */
export function getAllPresets() {
  return Object.entries(PRESETS).map(([type, preset]) => ({
    ...preset,
    type: type,
    recommended: type === PresetType.MODERATE
  }));
}

/**
 * Detect which preset matches current config
 * @param {Object} config - Current configuration
 * @returns {string|null} - Matching preset type or null
 */
export function detectPreset(config) {
  const threshold = config.minTimeBeforePopup || DEFAULT_CONFIG.minTimeBeforePopup;
  
  if (threshold <= 3 * 60 * 1000) {
    return PresetType.STRICT;
  } else if (threshold <= 7 * 60 * 1000) {
    return PresetType.MODERATE;
  } else {
    return PresetType.LENIENT;
  }
}

