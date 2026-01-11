// Content script injected into web pages
const browserAPI = typeof chrome !== 'undefined' && chrome.runtime ? chrome : browser;

// Listen for messages from background script
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showPopup') {
    showPopupOverlay(message.domain, message.timeSpent);
    sendResponse({ success: true });
  }
  return true;
});

// Track page visibility
let isPageVisible = true;

document.addEventListener('visibilitychange', () => {
  isPageVisible = !document.hidden;
  // Notify background script of visibility change
  browserAPI.runtime.sendMessage({
    action: 'visibilityChange',
    visible: isPageVisible,
    url: window.location.href
  });
});

// Track focus/blur
window.addEventListener('focus', () => {
  browserAPI.runtime.sendMessage({
    action: 'windowFocus',
    url: window.location.href
  });
});

window.addEventListener('blur', () => {
  browserAPI.runtime.sendMessage({
    action: 'windowBlur',
    url: window.location.href
  });
});

// Function to show popup overlay (will be called by popup-overlay.js)
function showPopupOverlay(domain, timeSpent) {
  // Import and use popup overlay
  if (typeof window.showShameClockPopup === 'function') {
    window.showShameClockPopup(domain, timeSpent);
  } else {
    // Load popup overlay script if not already loaded
    const script = document.createElement('script');
    script.src = browserAPI.runtime.getURL('content/popup-overlay.js');
    script.onload = () => {
      if (typeof window.showShameClockPopup === 'function') {
        window.showShameClockPopup(domain, timeSpent);
      }
    };
    document.head.appendChild(script);
  }
}

// Make function globally available
window.showShameClockPopup = showPopupOverlay;

