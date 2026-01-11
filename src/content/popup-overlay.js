// Popup overlay UI injected into pages
// Uses message passing to communicate with background script

let currentPopup = null;
let popupTimeout = null;
const browserAPI = typeof chrome !== 'undefined' && chrome.runtime ? chrome : browser;

/**
 * Format time in milliseconds to human-readable string
 * @param {number} ms - Milliseconds
 * @returns {string}
 */
function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${Math.floor(ms / 1000)}s`;
  }
}

/**
 * Request message generation from background script
 * @param {string} domain - Domain name
 * @param {number} timeSpent - Time spent in milliseconds
 * @returns {Promise<Object>}
 */
async function requestMessage(domain, timeSpent) {
  return new Promise((resolve, reject) => {
    browserAPI.runtime.sendMessage({
      action: 'generateMessage',
      domain: domain,
      timeSpent: timeSpent
    }, (response) => {
      if (browserAPI.runtime.lastError) {
        reject(new Error(browserAPI.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Get config from background script
 * @returns {Promise<Object>}
 */
async function getConfig() {
  return new Promise((resolve, reject) => {
    browserAPI.runtime.sendMessage({
      action: 'getConfig'
    }, (response) => {
      if (browserAPI.runtime.lastError) {
        reject(new Error(browserAPI.runtime.lastError.message));
      } else {
        resolve(response.config || {});
      }
    });
  });
}

/**
 * Create and show popup overlay
 * @param {string} domain - Domain name
 * @param {number} timeSpent - Time spent in milliseconds
 */
export async function showPopup(domain, timeSpent) {
  // Remove existing popup if any
  if (currentPopup) {
    removePopup();
  }
  
  try {
    // Generate message via background script
    const messageData = await requestMessage(domain, timeSpent);
    
    // Get config for popup duration
    const config = await getConfig();
    const duration = (config.popupDuration || 30000);
    
    // Create popup element
    const popup = document.createElement('div');
    popup.id = 'shame-clock-popup';
    popup.className = 'shame-clock-popup';
    
    // Load CSS if not already loaded
    if (!document.getElementById('shame-clock-popup-styles')) {
      const link = document.createElement('link');
      link.id = 'shame-clock-popup-styles';
      link.rel = 'stylesheet';
      link.href = browserAPI.runtime.getURL('content/popup-overlay.css');
      document.head.appendChild(link);
    }
    
    // Popup content
    popup.innerHTML = `
      <div class="shame-clock-popup-content">
        <div class="shame-clock-popup-header">
          <span class="shame-clock-popup-icon">⏰</span>
          <h3 class="shame-clock-popup-title">Time to Refocus!</h3>
          <button class="shame-clock-popup-close" aria-label="Close">×</button>
        </div>
        <div class="shame-clock-popup-body">
          <p class="shame-clock-popup-message">${escapeHtml(messageData.message || 'You\'ve been here a while. Time to refocus!')}</p>
          <div class="shame-clock-popup-stats">
            <span class="shame-clock-popup-time">⏱️ ${formatTime(timeSpent)} on ${escapeHtml(domain)}</span>
          </div>
        </div>
        <div class="shame-clock-popup-footer">
          <button class="shame-clock-popup-button shame-clock-popup-button-primary" data-action="productive">
            I'll be productive
          </button>
          <button class="shame-clock-popup-button shame-clock-popup-button-secondary" data-action="dismiss">
            Dismiss
          </button>
        </div>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(popup);
    currentPopup = popup;
    
    // Trigger animation
    setTimeout(() => {
      popup.classList.add('shame-clock-popup-visible');
    }, 10);
    
    // Auto-dismiss after duration
    popupTimeout = setTimeout(() => {
      removePopup();
    }, duration);
    
    // Event listeners
    const closeBtn = popup.querySelector('.shame-clock-popup-close');
    const productiveBtn = popup.querySelector('[data-action="productive"]');
    const dismissBtn = popup.querySelector('[data-action="dismiss"]');
    
    closeBtn.addEventListener('click', () => {
      removePopup();
    });
    
    productiveBtn.addEventListener('click', () => {
      removePopup();
      // Notify background script
      browserAPI.runtime.sendMessage({
        action: 'popupAcknowledged',
        domain: domain,
        actionType: 'productive'
      });
    });
    
    dismissBtn.addEventListener('click', () => {
      removePopup();
      // Notify background script
      browserAPI.runtime.sendMessage({
        action: 'popupDismissed',
        domain: domain,
        actionType: 'dismiss'
      });
    });
    
    // Close on escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        removePopup();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  } catch (error) {
    console.error('Error showing popup:', error);
  }
}

/**
 * Remove popup overlay
 */
function removePopup() {
  if (currentPopup) {
    currentPopup.classList.remove('shame-clock-popup-visible');
    currentPopup.classList.add('shame-clock-popup-hiding');
    
    setTimeout(() => {
      if (currentPopup && currentPopup.parentNode) {
        currentPopup.parentNode.removeChild(currentPopup);
      }
      currentPopup = null;
    }, 300); // Match CSS transition duration
  }
  
  if (popupTimeout) {
    clearTimeout(popupTimeout);
    popupTimeout = null;
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string}
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make function globally available
window.showShameClockPopup = showPopup;

// Listen for messages from content script
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showPopup') {
    showPopup(message.domain, message.timeSpent);
    sendResponse({ success: true });
  }
  return true;
});
