// Browser notifications system
const browserAPI = typeof chrome !== 'undefined' && chrome.notifications ? chrome : browser;

/**
 * Show a browser notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} domain - Domain name (for context)
 * @returns {Promise<string>} - Notification ID
 */
export async function showNotification(title, message, domain = '') {
  if (!browserAPI.notifications) {
    console.warn('Notifications API not available');
    return null;
  }
  
  try {
    const notificationId = await new Promise((resolve, reject) => {
      browserAPI.notifications.create({
        type: 'basic',
        iconUrl: browserAPI.runtime.getURL('assets/icons/icon48.png'),
        title: title,
        message: message,
        buttons: [
          { title: 'I\'ll be productive' },
          { title: 'Dismiss' }
        ],
        requireInteraction: false,
        priority: 1
      }, (id) => {
        if (browserAPI.runtime.lastError) {
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve(id);
        }
      });
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
    
    return notificationId;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
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

