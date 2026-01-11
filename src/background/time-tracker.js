// Core time tracking logic
import { getTimeData, saveTimeData, getConfig } from '../utils/storage.js';
import { DEFAULT_CONFIG } from '../utils/config.js';

let activeTab = null;
let startTime = null;
let currentDomain = null;
let trackingInterval = null;

/**
 * Format time duration in milliseconds to human-readable string
 * @param {number} ms - Milliseconds
 * @returns {string}
 */
export function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Get today's date key (YYYY-MM-DD)
 * @returns {string}
 */
function getTodayKey() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Initialize time tracking for a domain
 * @param {string} domain - Domain name
 */
async function startTracking(domain) {
  if (currentDomain === domain && startTime !== null) {
    return; // Already tracking this domain
  }
  
  // Stop previous tracking if any
  if (currentDomain && startTime) {
    await stopTracking();
  }
  
  currentDomain = domain;
  startTime = Date.now();
  
  console.log(`Started tracking: ${domain}`);
}

/**
 * Stop tracking and save accumulated time
 */
async function stopTracking() {
  if (!currentDomain || !startTime) {
    return;
  }
  
  const elapsed = Date.now() - startTime;
  const todayKey = getTodayKey();
  
  // Load existing time data
  const timeData = await getTimeData();
  
  if (!timeData[todayKey]) {
    timeData[todayKey] = {};
  }
  
  if (!timeData[todayKey][currentDomain]) {
    timeData[todayKey][currentDomain] = 0;
  }
  
  // Add elapsed time
  timeData[todayKey][currentDomain] += elapsed;
  
  // Save updated data
  await saveTimeData(timeData);
  
  console.log(`Stopped tracking: ${currentDomain}, added ${formatTime(elapsed)}`);
  
  // Reset tracking state
  const domain = currentDomain;
  currentDomain = null;
  startTime = null;
  
  return {
    domain: domain,
    timeSpent: elapsed,
    totalToday: timeData[todayKey][domain]
  };
}

/**
 * Get time spent on a domain today
 * @param {string} domain - Domain name
 * @returns {Promise<number>} - Time in milliseconds
 */
export async function getTimeSpentToday(domain) {
  const timeData = await getTimeData();
  const todayKey = getTodayKey();
  
  if (!timeData[todayKey] || !timeData[todayKey][domain]) {
    return 0;
  }
  
  // Add current session time if tracking
  let currentSession = 0;
  if (currentDomain === domain && startTime) {
    currentSession = Date.now() - startTime;
  }
  
  return timeData[todayKey][domain] + currentSession;
}

/**
 * Get total time spent today across all domains
 * @returns {Promise<number>} - Time in milliseconds
 */
export async function getTotalTimeToday() {
  const timeData = await getTimeData();
  const todayKey = getTodayKey();
  
  if (!timeData[todayKey]) {
    return 0;
  }
  
  let total = 0;
  for (const domain in timeData[todayKey]) {
    total += timeData[todayKey][domain];
    
    // Add current session if tracking this domain
    if (currentDomain === domain && startTime) {
      total += Date.now() - startTime;
    }
  }
  
  return total;
}

/**
 * Get all domains tracked today
 * @returns {Promise<Array>} - Array of {domain, timeSpent} objects
 */
export async function getTodayStats() {
  const timeData = await getTimeData();
  const todayKey = getTodayKey();
  
  if (!timeData[todayKey]) {
    return [];
  }
  
  const stats = [];
  for (const domain in timeData[todayKey]) {
    let timeSpent = timeData[todayKey][domain];
    
    // Add current session if tracking this domain
    if (currentDomain === domain && startTime) {
      timeSpent += Date.now() - startTime;
    }
    
    stats.push({
      domain: domain,
      timeSpent: timeSpent,
      formatted: formatTime(timeSpent)
    });
  }
  
  // Sort by time spent (descending)
  stats.sort((a, b) => b.timeSpent - a.timeSpent);
  
  return stats;
}

/**
 * Update active tab tracking
 * @param {number} tabId - Tab ID
 * @param {string} url - Tab URL
 * @param {boolean} isTracked - Whether the site is tracked
 */
export async function updateActiveTab(tabId, url, isTracked) {
  activeTab = { tabId, url, isTracked };
  
  if (isTracked) {
    const domain = new URL(url).hostname.replace(/^www\./, '');
    await startTracking(domain);
    
    // Start periodic save interval
    if (!trackingInterval) {
      trackingInterval = setInterval(async () => {
        if (currentDomain && startTime) {
          // Save current progress every minute
          const elapsed = Date.now() - startTime;
          if (elapsed >= 60000) { // Every minute
            await stopTracking();
            await startTracking(currentDomain);
          }
        }
      }, 60000);
    }
  } else {
    await stopTracking();
    if (trackingInterval) {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }
  }
}

/**
 * Handle tab update (URL change, etc.)
 * @param {number} tabId - Tab ID
 * @param {string} url - New URL
 * @param {boolean} isTracked - Whether the site is tracked
 */
export async function handleTabUpdate(tabId, url, isTracked) {
  if (activeTab && activeTab.tabId === tabId) {
    await updateActiveTab(tabId, url, isTracked);
  }
}

/**
 * Handle tab close or switch
 */
export async function handleTabInactive() {
  await stopTracking();
  activeTab = null;
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
}

/**
 * Reset daily data (called at midnight)
 */
export async function resetDailyData() {
  const timeData = await getTimeData();
  const todayKey = getTodayKey();
  
  // Keep only last 30 days of data
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  const cutoffKey = cutoffDate.toISOString().split('T')[0];
  
  for (const dateKey in timeData) {
    if (dateKey < cutoffKey) {
      delete timeData[dateKey];
    }
  }
  
  await saveTimeData(timeData);
}

/**
 * Get current tracking state
 * @returns {Object}
 */
export function getTrackingState() {
  return {
    activeTab: activeTab,
    currentDomain: currentDomain,
    startTime: startTime,
    isTracking: currentDomain !== null && startTime !== null
  };
}

