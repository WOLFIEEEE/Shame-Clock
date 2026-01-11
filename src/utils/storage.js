// Cross-browser storage abstraction layer
import { STORAGE_KEYS } from './config.js';

// Detect browser and use appropriate API
const browserAPI = typeof chrome !== 'undefined' && chrome.storage ? chrome : browser;

/**
 * Get storage API (chrome.storage.local or browser.storage.local)
 */
function getStorage() {
  return browserAPI.storage.local;
}

/**
 * Get a value from storage
 * @param {string} key - Storage key
 * @returns {Promise<any>} - Stored value or null
 */
export async function getStorageValue(key) {
  try {
    const storage = getStorage();
    return new Promise((resolve, reject) => {
      storage.get(key, (result) => {
        if (browserAPI.runtime.lastError) {
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve(result[key] || null);
        }
      });
    });
  } catch (error) {
    console.error('Error getting storage value:', error);
    return null;
  }
}

/**
 * Set a value in storage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {Promise<void>}
 */
export async function setStorageValue(key, value) {
  try {
    const storage = getStorage();
    return new Promise((resolve, reject) => {
      storage.set({ [key]: value }, () => {
        if (browserAPI.runtime.lastError) {
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error setting storage value:', error);
    throw error;
  }
}

/**
 * Get multiple values from storage
 * @param {string[]} keys - Array of storage keys
 * @returns {Promise<Object>} - Object with key-value pairs
 */
export async function getStorageValues(keys) {
  try {
    const storage = getStorage();
    return new Promise((resolve, reject) => {
      storage.get(keys, (result) => {
        if (browserAPI.runtime.lastError) {
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.error('Error getting storage values:', error);
    return {};
  }
}

/**
 * Set multiple values in storage
 * @param {Object} items - Object with key-value pairs
 * @returns {Promise<void>}
 */
export async function setStorageValues(items) {
  try {
    const storage = getStorage();
    return new Promise((resolve, reject) => {
      storage.set(items, () => {
        if (browserAPI.runtime.lastError) {
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error setting storage values:', error);
    throw error;
  }
}

/**
 * Remove a value from storage
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export async function removeStorageValue(key) {
  try {
    const storage = getStorage();
    return new Promise((resolve, reject) => {
      storage.remove(key, () => {
        if (browserAPI.runtime.lastError) {
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error removing storage value:', error);
    throw error;
  }
}

/**
 * Clear all storage
 * @returns {Promise<void>}
 */
export async function clearStorage() {
  try {
    const storage = getStorage();
    return new Promise((resolve, reject) => {
      storage.clear(() => {
        if (browserAPI.runtime.lastError) {
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
}

/**
 * Get configuration
 * @returns {Promise<Object>}
 */
export async function getConfig() {
  const config = await getStorageValue(STORAGE_KEYS.CONFIG);
  return config || {};
}

/**
 * Save configuration
 * @param {Object} config - Configuration object
 * @returns {Promise<void>}
 */
export async function saveConfig(config) {
  return setStorageValue(STORAGE_KEYS.CONFIG, config);
}

/**
 * Get tracked sites
 * @returns {Promise<Array>}
 */
export async function getTrackedSites() {
  const sites = await getStorageValue(STORAGE_KEYS.TRACKED_SITES);
  return sites || [];
}

/**
 * Save tracked sites
 * @param {Array} sites - Array of site patterns
 * @returns {Promise<void>}
 */
export async function saveTrackedSites(sites) {
  return setStorageValue(STORAGE_KEYS.TRACKED_SITES, sites);
}

/**
 * Get time tracking data
 * @returns {Promise<Object>}
 */
export async function getTimeData() {
  const data = await getStorageValue(STORAGE_KEYS.TIME_DATA);
  return data || {};
}

/**
 * Save time tracking data
 * @param {Object} data - Time tracking data
 * @returns {Promise<void>}
 */
export async function saveTimeData(data) {
  return setStorageValue(STORAGE_KEYS.TIME_DATA, data);
}

/**
 * Get user-added sites
 * @returns {Promise<Array>}
 */
export async function getUserSites() {
  const sites = await getStorageValue(STORAGE_KEYS.USER_SITES);
  return sites || [];
}

/**
 * Save user-added sites
 * @param {Array} sites - Array of user site patterns
 * @returns {Promise<void>}
 */
export async function saveUserSites(sites) {
  return setStorageValue(STORAGE_KEYS.USER_SITES, sites);
}

