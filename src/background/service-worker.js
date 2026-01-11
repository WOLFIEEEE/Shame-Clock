// Background service worker - main extension logic
import { isTrackedSite, refreshSites } from '../utils/site-matcher.js';
import { 
  updateActiveTab, 
  handleTabUpdate, 
  handleTabInactive,
  getTimeSpentToday,
  getTodayStats,
  resetDailyData
} from './time-tracker.js';
import { getConfig, getStorageValue, setStorageValue } from '../utils/storage.js';
import { STORAGE_KEYS, DEFAULT_CONFIG } from '../utils/config.js';
import { showNotification } from '../utils/notifications.js';

const browserAPI = typeof chrome !== 'undefined' && chrome.tabs ? chrome : browser;

// Initialize on install
browserAPI.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Initialize default config
    const config = await getConfig();
    if (!config.popupEnabled) {
      await setStorageValue(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    }
    
    // Load default sites
    await refreshSites();
    
    console.log('Shame Clock extension installed');
  } else if (details.reason === 'update') {
    console.log('Shame Clock extension updated');
  }
});

// Handle tab activation
browserAPI.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await browserAPI.tabs.get(activeInfo.tabId);
    if (tab.url) {
      const tracked = await isTrackedSite(tab.url);
      await updateActiveTab(activeInfo.tabId, tab.url, tracked !== null);
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

// Handle tab updates (URL changes, etc.)
browserAPI.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const tracked = await isTrackedSite(tab.url);
      await handleTabUpdate(tabId, tab.url, tracked !== null);
    } catch (error) {
      console.error('Error handling tab update:', error);
    }
  }
});

// Handle tab removal
browserAPI.tabs.onRemoved.addListener(async (tabId) => {
  await handleTabInactive();
});

// Handle window focus changes
browserAPI.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === browserAPI.windows.WINDOW_ID_NONE) {
    // All windows lost focus
    await handleTabInactive();
  } else {
    // Window gained focus, check active tab
    try {
      const tabs = await browserAPI.tabs.query({ active: true, windowId: windowId });
      if (tabs.length > 0 && tabs[0].url) {
        const tracked = await isTrackedSite(tabs[0].url);
        await updateActiveTab(tabs[0].id, tabs[0].url, tracked !== null);
      }
    } catch (error) {
      console.error('Error handling window focus:', error);
    }
  }
});

// Check for popup triggers
let popupCheckInterval = null;

async function checkPopupTrigger() {
  const config = await getConfig();
  if (!config.popupEnabled) return;
  
  // Check if tracking is paused
  if (config.trackingPaused) return;
  
  // Check if popups are snoozed
  const snoozeUntil = await getStorageValue(STORAGE_KEYS.SNOOZE_UNTIL);
  if (snoozeUntil && Date.now() < snoozeUntil) return;
  
  // Check scheduler for popup suppression
  try {
    const { shouldSuppressPopups } = await import('../utils/scheduler.js');
    if (await shouldSuppressPopups()) return;
  } catch (e) {
    // Scheduler not available, continue
  }
  
  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) return;
    
    const tab = tabs[0];
    if (!tab.url) return;
    
    const tracked = await isTrackedSite(tab.url);
    if (!tracked) return;
    
    const domain = new URL(tab.url).hostname.replace(/^www\./, '');
    const timeSpent = await getTimeSpentToday(domain);
    
    // Check if enough time has passed
    let minTime = config.minTimeBeforePopup || DEFAULT_CONFIG.minTimeBeforePopup;
    
    // Apply scheduler threshold multiplier
    try {
      const { getCurrentThresholdMultiplier } = await import('../utils/scheduler.js');
      const multiplier = await getCurrentThresholdMultiplier();
      minTime = Math.round(minTime * multiplier);
    } catch (e) {
      // Scheduler not available, use default
    }
    
    if (timeSpent < minTime) return;
    
    // Check cooldown
    const lastPopupTime = await getStorageValue(STORAGE_KEYS.LAST_POPUP_TIME) || 0;
    const lastPopupDomain = await getStorageValue(STORAGE_KEYS.LAST_POPUP_DOMAIN);
    const cooldown = config.popupCooldown || DEFAULT_CONFIG.popupCooldown;
    
    if (lastPopupDomain === domain && Date.now() - lastPopupTime < cooldown) {
      return; // Still in cooldown
    }
    
    // Check goal notifications
    try {
      const { checkGoalNotifications } = await import('../utils/goals.js');
      const goalNotifications = await checkGoalNotifications();
      if (goalNotifications.length > 0) {
        // Show goal notification instead
        for (const notif of goalNotifications) {
          await showNotification(notif.goalName, notif.message, domain);
        }
      }
    } catch (e) {
      // Goals not available
    }
    
    // Determine popup interval based on time spent
    const thresholds = config.thresholds || DEFAULT_CONFIG.thresholds;
    const intervals = config.intervals || DEFAULT_CONFIG.intervals;
    
    let shouldPopup = false;
    let interval = intervals.veryHigh;
    
    if (timeSpent >= thresholds.veryHigh) {
      interval = intervals.veryHigh;
      shouldPopup = true;
    } else if (timeSpent >= thresholds.high) {
      interval = intervals.high;
      shouldPopup = true;
    } else if (timeSpent >= thresholds.medium) {
      interval = intervals.medium;
      shouldPopup = true;
    }
    
    if (shouldPopup) {
      // Check if enough time has passed since last popup
      const timeSinceLastPopup = Date.now() - lastPopupTime;
      if (timeSinceLastPopup >= interval || lastPopupDomain !== domain) {
        // Trigger popup
        await triggerPopup(tab.id, domain, timeSpent);
        await setStorageValue(STORAGE_KEYS.LAST_POPUP_TIME, Date.now());
        await setStorageValue(STORAGE_KEYS.LAST_POPUP_DOMAIN, domain);
      }
    }
  } catch (error) {
    console.error('Error checking popup trigger:', error);
  }
}

async function triggerPopup(tabId, domain, timeSpent) {
  // Send message to content script to show popup
  try {
    await browserAPI.tabs.sendMessage(tabId, {
      action: 'showPopup',
      domain: domain,
      timeSpent: timeSpent
    });
  } catch (error) {
    // Tab might not have content script loaded, use notification instead
    const formattedTime = formatTime(timeSpent);
    await showNotification(
      'Time to refocus!',
      `You've spent ${formattedTime} on ${domain} today.`,
      domain
    );
  }
}

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

// Start popup check interval
function startPopupChecker() {
  if (popupCheckInterval) return;
  
  popupCheckInterval = setInterval(checkPopupTrigger, 30000); // Check every 30 seconds
}

// Stop popup check interval
function stopPopupChecker() {
  if (popupCheckInterval) {
    clearInterval(popupCheckInterval);
    popupCheckInterval = null;
  }
}

// Initialize popup checker
startPopupChecker();

// Handle messages from content scripts and popup
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'getTimeSpent':
          const timeSpent = await getTimeSpentToday(message.domain);
          sendResponse({ timeSpent });
          break;
        
        case 'getTodayStats':
          const stats = await getTodayStats();
          sendResponse({ stats });
          break;
        
        case 'isTrackedSite':
          const tracked = await isTrackedSite(message.url);
          sendResponse({ tracked: tracked !== null, site: tracked });
          break;
        
        case 'refreshSites':
          await refreshSites();
          sendResponse({ success: true });
          break;
        
        case 'generateMessage':
          // Import message generator dynamically
          const { generateMessage } = await import('../ai/message-generator.js');
          const messageData = await generateMessage(message.domain, message.timeSpent);
          sendResponse(messageData);
          break;
        
        case 'getConfig':
          const config = await getConfig();
          sendResponse({ config });
          break;
        
        // Pause/Resume tracking
        case 'pauseTracking':
          const pauseConfig = await getConfig();
          pauseConfig.trackingPaused = true;
          pauseConfig.pausedAt = Date.now();
          await setStorageValue(STORAGE_KEYS.CONFIG, pauseConfig);
          await handleTabInactive();
          sendResponse({ success: true, paused: true });
          break;
        
        case 'resumeTracking':
          const resumeConfig = await getConfig();
          resumeConfig.trackingPaused = false;
          resumeConfig.pausedAt = null;
          await setStorageValue(STORAGE_KEYS.CONFIG, resumeConfig);
          // Re-check current tab
          try {
            const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
            if (tabs.length > 0 && tabs[0].url) {
              const isTracked = await isTrackedSite(tabs[0].url);
              await updateActiveTab(tabs[0].id, tabs[0].url, isTracked !== null);
            }
          } catch (e) {
            console.error('Error resuming tracking:', e);
          }
          sendResponse({ success: true, paused: false });
          break;
        
        // Onboarding
        case 'getOnboardingState':
          const onboardingState = await getStorageValue('onboardingState');
          sendResponse({ state: onboardingState || { completed: false, skipped: false } });
          break;
        
        case 'skipOnboarding':
          await setStorageValue('onboardingState', { 
            completed: false, 
            skipped: true, 
            tutorialShown: true,
            firstInstallDate: Date.now()
          });
          sendResponse({ success: true });
          break;
        
        case 'completeOnboarding':
          await setStorageValue('onboardingState', { 
            completed: true, 
            skipped: false,
            tutorialShown: true,
            firstInstallDate: Date.now()
          });
          sendResponse({ success: true });
          break;
        
        // Goals
        case 'getGoalProgress':
          try {
            const { getAllGoalProgress } = await import('../utils/goals.js');
            const progress = await getAllGoalProgress();
            sendResponse({ progress });
          } catch (e) {
            sendResponse({ progress: [] });
          }
          break;
        
        case 'getGoals':
          try {
            const { getGoals } = await import('../utils/goals.js');
            const goals = await getGoals();
            sendResponse({ goals });
          } catch (e) {
            sendResponse({ goals: { enabled: false, goals: [] } });
          }
          break;
        
        case 'addGoal':
          try {
            const { addGoal } = await import('../utils/goals.js');
            const newGoal = await addGoal(message.goal);
            sendResponse({ success: true, goal: newGoal });
          } catch (e) {
            sendResponse({ success: false, error: e.message });
          }
          break;
        
        case 'deleteGoal':
          try {
            const { deleteGoal } = await import('../utils/goals.js');
            await deleteGoal(message.goalId);
            sendResponse({ success: true });
          } catch (e) {
            sendResponse({ success: false, error: e.message });
          }
          break;
        
        // Focus Sessions
        case 'getFocusStatus':
          try {
            const { getSessionStatus } = await import('../utils/focus-sessions.js');
            const status = await getSessionStatus();
            sendResponse({ status });
          } catch (e) {
            sendResponse({ status: { active: false } });
          }
          break;
        
        case 'startFocusSession':
          try {
            const { startFocusSession } = await import('../utils/focus-sessions.js');
            const session = await startFocusSession(message.options || {});
            sendResponse({ success: true, session });
          } catch (e) {
            sendResponse({ success: false, error: e.message });
          }
          break;
        
        case 'stopFocusSession':
          try {
            const { completeSession } = await import('../utils/focus-sessions.js');
            const session = await completeSession();
            sendResponse({ success: true, session });
          } catch (e) {
            sendResponse({ success: false, error: e.message });
          }
          break;
        
        // Scheduler
        case 'getSchedulerStatus':
          try {
            const { getScheduleSummary } = await import('../utils/scheduler.js');
            const summary = await getScheduleSummary();
            sendResponse({ summary });
          } catch (e) {
            sendResponse({ summary: { enabled: false } });
          }
          break;
        
        case 'shouldSuppressPopups':
          try {
            const { shouldSuppressPopups } = await import('../utils/scheduler.js');
            const suppress = await shouldSuppressPopups();
            sendResponse({ suppress });
          } catch (e) {
            sendResponse({ suppress: false });
          }
          break;
        
        // Analytics
        case 'getAnalytics':
          try {
            const { getAnalytics } = await import('../utils/analytics.js');
            const analytics = await getAnalytics(message.period);
            sendResponse({ analytics });
          } catch (e) {
            sendResponse({ analytics: null, error: e.message });
          }
          break;
        
        case 'getTrendAnalysis':
          try {
            const { getTrendAnalysis } = await import('../utils/analytics.js');
            const trend = await getTrendAnalysis(message.days || 30);
            sendResponse({ trend });
          } catch (e) {
            sendResponse({ trend: null, error: e.message });
          }
          break;
        
        // Backup
        case 'createBackup':
          try {
            const { createBackup } = await import('../utils/backup.js');
            const result = await createBackup(message.name);
            sendResponse({ success: true, backup: result });
          } catch (e) {
            sendResponse({ success: false, error: e.message });
          }
          break;
        
        // Snooze
        case 'snoozePopups':
          const snoozeUntil = Date.now() + (message.duration || 5 * 60 * 1000);
          await setStorageValue(STORAGE_KEYS.SNOOZE_UNTIL, snoozeUntil);
          sendResponse({ success: true, snoozeUntil });
          break;
        
        case 'getSnoozeStatus':
          const snoozeEnd = await getStorageValue(STORAGE_KEYS.SNOOZE_UNTIL);
          const isSnoozed = snoozeEnd && Date.now() < snoozeEnd;
          sendResponse({ snoozed: isSnoozed, until: snoozeEnd });
          break;
        
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  })();
  
  return true; // Keep message channel open for async response
});

// Daily reset check
async function checkDailyReset() {
  const lastReset = await getStorageValue(STORAGE_KEYS.DAILY_RESET);
  const today = new Date().toISOString().split('T')[0];
  
  if (lastReset !== today) {
    await resetDailyData();
    await setStorageValue(STORAGE_KEYS.DAILY_RESET, today);
  }
}

// Check daily reset on startup and periodically
checkDailyReset();
setInterval(checkDailyReset, 3600000); // Check every hour

