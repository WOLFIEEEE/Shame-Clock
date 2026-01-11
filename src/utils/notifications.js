// Enhanced browser notifications system
import { getStorageValue, setStorageValue } from './storage.js';

const browserAPI = typeof chrome !== 'undefined' && chrome.notifications ? chrome : browser;

const NOTIFICATION_HISTORY_KEY = 'notificationHistory';
const MAX_HISTORY_SIZE = 50;

/**
 * Notification types
 */
export const NotificationType = {
  REMINDER: 'reminder',
  GOAL_WARNING: 'goal_warning',
  GOAL_EXCEEDED: 'goal_exceeded',
  FOCUS_COMPLETE: 'focus_complete',
  ACHIEVEMENT: 'achievement',
  DAILY_SUMMARY: 'daily_summary'
};

/**
 * Default notification settings
 */
const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  sound: false,
  soundVolume: 0.5,
  doNotDisturb: false,
  dndStart: '22:00',
  dndEnd: '08:00'
};

/**
 * Get notification settings
 * @returns {Promise<Object>}
 */
export async function getNotificationSettings() {
  const settings = await getStorageValue('notificationSettings');
  return settings || { ...DEFAULT_NOTIFICATION_SETTINGS };
}

/**
 * Save notification settings
 * @param {Object} settings
 * @returns {Promise<void>}
 */
export async function saveNotificationSettings(settings) {
  return setStorageValue('notificationSettings', settings);
}

/**
 * Check if notifications should be suppressed (DND mode)
 * @returns {Promise<boolean>}
 */
export async function isDoNotDisturbActive() {
  const settings = await getNotificationSettings();
  
  if (!settings.doNotDisturb) return false;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = settings.dndStart.split(':').map(Number);
  const [endHour, endMin] = settings.dndEnd.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Handle overnight ranges
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Show a browser notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} domain - Domain name (for context)
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - Notification ID
 */
export async function showNotification(title, message, domain = '', options = {}) {
  const settings = await getNotificationSettings();
  
  // Check if notifications are enabled
  if (!settings.enabled) return null;
  
  // Check DND mode
  if (await isDoNotDisturbActive()) return null;
  
  if (!browserAPI.notifications) {
    console.warn('Notifications API not available');
    return null;
  }
  
  try {
    const notificationOptions = {
      type: 'basic',
      iconUrl: browserAPI.runtime.getURL('assets/icons/icon48.png'),
      title: title,
      message: message,
      buttons: options.buttons || [
        { title: 'I\'ll be productive' },
        { title: 'Dismiss' }
      ],
      requireInteraction: options.requireInteraction || false,
      priority: options.priority || 1,
      silent: !settings.sound
    };
    
    const notificationId = await new Promise((resolve, reject) => {
      browserAPI.notifications.create(notificationOptions, (id) => {
        if (browserAPI.runtime.lastError) {
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve(id);
        }
      });
    });
    
    // Add to history
    await addToNotificationHistory({
      id: notificationId,
      title,
      message,
      domain,
      type: options.type || NotificationType.REMINDER,
      timestamp: new Date().toISOString()
    });
    
    // Handle notification button clicks
    browserAPI.notifications.onButtonClicked.addListener((id, buttonIndex) => {
      if (id === notificationId) {
        if (buttonIndex === 0) {
          // "I'll be productive" clicked
          console.log('User acknowledged notification');
        }
        browserAPI.notifications.clear(id);
      }
    });
    
    // Play sound if enabled
    if (settings.sound && options.playSound !== false) {
      playNotificationSound(settings.soundVolume);
    }
    
    return notificationId;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
}

/**
 * Show a goal warning notification
 * @param {string} goalName - Goal name
 * @param {number} percentage - Current percentage
 * @returns {Promise<string>}
 */
export async function showGoalWarning(goalName, percentage) {
  const title = percentage >= 100 ? 'Goal Exceeded!' : 'Goal Warning';
  const message = percentage >= 100 
    ? `You've exceeded your ${goalName} limit. Time to take a break!`
    : `You're at ${Math.round(percentage)}% of your ${goalName} limit.`;
  
  return showNotification(title, message, '', {
    type: percentage >= 100 ? NotificationType.GOAL_EXCEEDED : NotificationType.GOAL_WARNING,
    priority: 2,
    buttons: [
      { title: 'Take a break' },
      { title: 'Got it' }
    ]
  });
}

/**
 * Show focus session complete notification
 * @param {string} sessionType - Session type
 * @param {number} duration - Session duration in ms
 * @returns {Promise<string>}
 */
export async function showFocusComplete(sessionType, duration) {
  const minutes = Math.floor(duration / 60000);
  const title = sessionType === 'focus' ? 'Focus Session Complete!' : 'Break Time Over!';
  const message = sessionType === 'focus'
    ? `Great work! You focused for ${minutes} minutes. Time for a break.`
    : `Break is over. Ready for another focus session?`;
  
  return showNotification(title, message, '', {
    type: NotificationType.FOCUS_COMPLETE,
    priority: 2,
    playSound: true,
    buttons: [
      { title: sessionType === 'focus' ? 'Start Break' : 'Start Focus' },
      { title: 'Later' }
    ]
  });
}

/**
 * Show achievement notification
 * @param {string} achievementName - Achievement name
 * @param {string} description - Achievement description
 * @returns {Promise<string>}
 */
export async function showAchievement(achievementName, description) {
  return showNotification('Achievement Unlocked!', `${achievementName}: ${description}`, '', {
    type: NotificationType.ACHIEVEMENT,
    priority: 1
  });
}

/**
 * Show daily summary notification
 * @param {Object} stats - Daily stats
 * @returns {Promise<string>}
 */
export async function showDailySummary(stats) {
  const hours = Math.floor(stats.totalTime / 3600000);
  const minutes = Math.floor((stats.totalTime % 3600000) / 60000);
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  
  return showNotification(
    'Daily Summary',
    `Today you spent ${timeStr} on ${stats.siteCount} tracked sites.`,
    '',
    {
      type: NotificationType.DAILY_SUMMARY,
      buttons: [
        { title: 'View Details' },
        { title: 'Dismiss' }
      ]
    }
  );
}

/**
 * Play notification sound
 * @param {number} volume - Volume (0-1)
 */
function playNotificationSound(volume = 0.5) {
  try {
    // Use Web Audio API for a simple notification sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = volume * 0.3;
    
    oscillator.start();
    
    // Quick fade out
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, 300);
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}

/**
 * Add notification to history
 * @param {Object} notification
 * @returns {Promise<void>}
 */
async function addToNotificationHistory(notification) {
  try {
    const history = await getNotificationHistory();
    history.unshift(notification);
    
    // Keep history size manageable
    if (history.length > MAX_HISTORY_SIZE) {
      history.length = MAX_HISTORY_SIZE;
    }
    
    await setStorageValue(NOTIFICATION_HISTORY_KEY, history);
  } catch (error) {
    console.error('Error adding to notification history:', error);
  }
}

/**
 * Get notification history
 * @returns {Promise<Array>}
 */
export async function getNotificationHistory() {
  const history = await getStorageValue(NOTIFICATION_HISTORY_KEY);
  return history || [];
}

/**
 * Clear notification history
 * @returns {Promise<void>}
 */
export async function clearNotificationHistory() {
  await setStorageValue(NOTIFICATION_HISTORY_KEY, []);
}

/**
 * Clear a notification
 * @param {string} notificationId - Notification ID
 */
export async function clearNotification(notificationId) {
  if (!browserAPI.notifications) return;
  
  try {
    browserAPI.notifications.clear(notificationId);
  } catch (error) {
    console.error('Error clearing notification:', error);
  }
}

/**
 * Check if notifications are permitted
 * @returns {Promise<boolean>}
 */
export async function hasNotificationPermission() {
  if (!browserAPI.notifications) return false;
  
  try {
    const level = await new Promise((resolve) => {
      browserAPI.notifications.getPermissionLevel((level) => {
        resolve(level);
      });
    });
    return level === 'granted';
  } catch (error) {
    // Firefox doesn't have getPermissionLevel, assume granted if API exists
    return true;
  }
}

/**
 * Request notification permission
 * @returns {Promise<boolean>}
 */
export async function requestNotificationPermission() {
  if (typeof Notification !== 'undefined') {
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  return false;
}
