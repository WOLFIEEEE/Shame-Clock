// Popup UI logic
const browserAPI = typeof chrome !== 'undefined' && chrome.runtime ? chrome : browser;

// Format time for summary display
function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

// Format time for live session display (detailed)
function formatLiveTime(ms) {
  const seconds = Math.floor((ms % 60000) / 1000);
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

// Load and display stats
async function loadStats() {
  try {
    // Get today's stats
    const response = await browserAPI.runtime.sendMessage({ action: 'getTodayStats' });
    const stats = response.stats || [];
    
    // Calculate total time
    const totalTimeMs = stats.reduce((sum, stat) => sum + stat.timeSpent, 0);
    document.getElementById('total-time').textContent = formatTime(totalTimeMs);
    document.getElementById('tracked-count').textContent = stats.length;
    
    // Display sites list
    const sitesList = document.getElementById('sites-list');
    if (stats.length === 0) {
      sitesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">☕</div>
          <p>No distractions tracked yet.</p>
        </div>
      `;
    } else {
      sitesList.innerHTML = stats.map(stat => {
        const domain = stat.domain;
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        return `
          <div class="activity-item">
            <div class="site-info">
              <img src="${faviconUrl}" class="site-icon" alt="" onerror="this.style.display='none'">
              <span class="site-name">${escapeHtml(domain)}</span>
            </div>
            <span class="site-duration">${stat.formatted}</span>
          </div>
        `;
      }).join('');
    }
    
    // Check current active tab for live session
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      const tab = tabs[0];
      if (tab.url) {
        const response = await browserAPI.runtime.sendMessage({
          action: 'isTrackedSite',
          url: tab.url
        });
        
        const currentSection = document.getElementById('current-site-section');
        if (response.tracked) {
          const domain = new URL(tab.url).hostname.replace(/^www\./, '');
          const timeResponse = await browserAPI.runtime.sendMessage({
            action: 'getTimeSpent',
            domain: domain
          });
          
          document.getElementById('current-site-name').textContent = domain;
          document.getElementById('current-site-time').textContent = formatLiveTime(timeResponse.timeSpent || 0);
          currentSection.style.display = 'flex';
        } else {
          currentSection.style.display = 'none';
        }
      }
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
document.getElementById('settings-btn').addEventListener('click', () => {
  browserAPI.runtime.openOptionsPage();
});

document.getElementById('view-settings-btn').addEventListener('click', () => {
  browserAPI.runtime.openOptionsPage();
});

// Load stats on open
loadStats();

// Refresh stats every second for live timer feeling
setInterval(loadStats, 1000);
