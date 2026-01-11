// Options page logic
import { 
  getConfig, 
  saveConfig, 
  getUserSites, 
  saveUserSites,
  getTimeData,
  clearStorage,
  setStorageValue
} from '../utils/storage.js';
import { DEFAULT_CONFIG } from '../utils/config.js';
import { getAllPersonas } from '../ai/personas.js';
import { refreshSites } from '../utils/site-matcher.js';

const browserAPI = typeof chrome !== 'undefined' && chrome.runtime ? chrome : browser;

let defaultSites = [];
let userSites = [];
let personas = [];

const TAB_INFO = {
  dashboard: {
    title: 'Dashboard',
    description: 'Comprehensive view of your browsing activity and time management insights.'
  },
  sites: {
    title: 'Monitored Sites',
    description: 'Define the digital spaces where you\'d like a gentle nudge to stay productive.'
  },
  personas: {
    title: 'Voice & Tone',
    description: 'Choose the personas that resonate most with your motivation style.'
  },
  popup: {
    title: 'Interaction Logic',
    description: 'Configure how and when Shame Clock intervenes in your browsing.'
  },
  privacy: {
    title: 'Your Data Sovereignty',
    description: 'Everything stays local. We don\'t have servers, so we can\'t see your data.'
  }
};

// Initialize page
async function init() {
  await loadData();
  setupEventListeners();
  renderDashboard();
  renderSites();
  renderPersonas();
  renderSettings();
}

// Load data
async function loadData() {
  // Load default sites
  try {
    const response = await fetch(browserAPI.runtime.getURL('data/default-sites.json'));
    defaultSites = await response.json();
  } catch (error) {
    console.error('Error loading default sites:', error);
    defaultSites = [];
  }
  
  // Load user sites
  userSites = await getUserSites();
  
  // Load personas
  personas = await getAllPersonas();
  
  // Load config
  const config = await getConfig();
  if (Object.keys(config).length === 0) {
    await saveConfig(DEFAULT_CONFIG);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.dataset.tab;
      switchTab(tab);
    });
  });
  
  // Add site button
  document.getElementById('add-site-btn').addEventListener('click', addUserSite);
  document.getElementById('new-site-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addUserSite();
    }
  });
  
  // Save button
  document.getElementById('save-btn').addEventListener('click', saveSettings);
  
  // Refresh dashboard button
  document.getElementById('refresh-dashboard-btn').addEventListener('click', () => {
    renderDashboard();
    showStatus('Dashboard refreshed', 'success');
  });
  
  // Reset button
  document.getElementById('reset-btn').addEventListener('click', resetToDefaults);
  
  // Export data
  document.getElementById('export-data-btn').addEventListener('click', exportData);
  
  // Clear data
  document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
}

// Switch tabs
function switchTab(tabName) {
  // Update buttons
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  // Update content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });

  // Update header text
  const info = TAB_INFO[tabName];
  if (info) {
    document.getElementById('active-tab-title').textContent = info.title;
    document.getElementById('active-tab-description').textContent = info.description;
  }
  
  // Show/hide refresh button and save button based on tab
  const refreshBtn = document.getElementById('refresh-dashboard-btn');
  const saveBtn = document.getElementById('save-btn');
  
  if (tabName === 'dashboard') {
    refreshBtn.style.display = 'inline-flex';
    saveBtn.style.display = 'none';
    renderDashboard();
    // Set up auto-refresh every 30 seconds when on dashboard
    if (window.dashboardRefreshInterval) {
      clearInterval(window.dashboardRefreshInterval);
    }
    window.dashboardRefreshInterval = setInterval(() => {
      if (document.querySelector('.nav-item.active').dataset.tab === 'dashboard') {
        renderDashboard();
      }
    }, 30000);
  } else {
    refreshBtn.style.display = 'none';
    saveBtn.style.display = 'inline-flex';
    // Clear refresh interval when leaving dashboard
    if (window.dashboardRefreshInterval) {
      clearInterval(window.dashboardRefreshInterval);
      window.dashboardRefreshInterval = null;
    }
  }
}

// Format time for display
function formatTimeDetailed(ms) {
  const seconds = Math.floor((ms % 60000) / 1000);
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

function formatTimeShort(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

// Get weekly stats
async function getWeeklyStats() {
  const timeData = await getTimeData();
  const today = new Date();
  const weeklyStats = [];
  
  // Get last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    const dayData = timeData[dateKey] || {};
    let totalTime = 0;
    let siteCount = 0;
    
    for (const domain in dayData) {
      totalTime += dayData[domain];
      siteCount++;
    }
    
    weeklyStats.push({
      dateKey: dateKey,
      date: dateKey,
      dateObj: date,
      totalTime: totalTime,
      siteCount: siteCount,
      formatted: formatTimeShort(totalTime)
    });
  }
  
  return weeklyStats;
}

// Render dashboard
async function renderDashboard() {
  try {
    // Get today's stats
    const response = await browserAPI.runtime.sendMessage({ action: 'getTodayStats' });
    const stats = response.stats || [];
    
    // Calculate total time
    const totalTimeMs = stats.reduce((sum, stat) => sum + stat.timeSpent, 0);
    document.getElementById('dashboard-total-time').textContent = formatTimeShort(totalTimeMs);
    document.getElementById('dashboard-site-count').textContent = stats.length;
    
    // Calculate additional stats
    const avgTimePerSite = stats.length > 0 ? totalTimeMs / stats.length : 0;
    const topSite = stats.length > 0 ? stats[0] : null;
    
    // Update additional stat displays
    document.getElementById('dashboard-avg-time').textContent = formatTimeShort(avgTimePerSite);
    const topSiteEl = document.getElementById('dashboard-top-site');
    if (topSite) {
      const topSiteDomain = topSite.domain.length > 20 
        ? topSite.domain.substring(0, 17) + '...' 
        : topSite.domain;
      topSiteEl.textContent = topSiteDomain;
      topSiteEl.title = topSite.domain + ' - ' + topSite.formatted;
    } else {
      topSiteEl.textContent = '—';
    }
    
    // Render sites list
    const sitesList = document.getElementById('dashboard-sites-list');
    if (stats.length === 0) {
      sitesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <p>No activity tracked yet today.</p>
        </div>
      `;
    } else {
      sitesList.innerHTML = stats.map((stat, index) => {
        const percentage = totalTimeMs > 0 ? Math.round((stat.timeSpent / totalTimeMs) * 100) : 0;
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${stat.domain}&sz=32`;
        return `
          <div class="dashboard-item">
            <div class="dashboard-item-rank">${index + 1}</div>
            <img src="${faviconUrl}" class="dashboard-item-icon" alt="" onerror="this.style.display='none'">
            <div class="dashboard-item-info">
              <div class="dashboard-item-name">${escapeHtml(stat.domain)}</div>
              <div class="dashboard-item-bar">
                <div class="dashboard-item-progress" style="width: ${percentage}%"></div>
              </div>
            </div>
            <div class="dashboard-item-time">${stat.formatted}</div>
          </div>
        `;
      }).join('');
    }
    
    // Render weekly summary
    const weeklyStats = await getWeeklyStats();
    const weeklyEl = document.getElementById('dashboard-weekly');
    
    if (weeklyStats.every(day => day.totalTime === 0)) {
      weeklyEl.innerHTML = `
        <div class="empty-state">
          <p>Weekly data will appear here after a few days of tracking.</p>
        </div>
      `;
    } else {
      const maxTime = Math.max(...weeklyStats.map(d => d.totalTime), 1);
      const weekTotal = weeklyStats.reduce((sum, d) => sum + d.totalTime, 0);
      const weekAvg = weekTotal / 7;
      
      weeklyEl.innerHTML = `
        <div class="weekly-stats-header">
          <div class="weekly-stat">
            <span class="weekly-stat-label">Week Total</span>
            <span class="weekly-stat-value">${formatTimeShort(weekTotal)}</span>
          </div>
          <div class="weekly-stat">
            <span class="weekly-stat-label">Daily Average</span>
            <span class="weekly-stat-value">${formatTimeShort(weekAvg)}</span>
          </div>
        </div>
        <div class="weekly-chart">
          ${weeklyStats.map(day => {
            const dayName = day.dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = day.dateObj.getDate();
            const height = maxTime > 0 ? Math.round((day.totalTime / maxTime) * 100) : 0;
            const isToday = day.dateKey === new Date().toISOString().split('T')[0];
            
            return `
              <div class="weekly-day ${isToday ? 'today' : ''}">
                <div class="weekly-bar-container">
                  <div class="weekly-bar" style="height: ${Math.max(height, 2)}%">
                    <span class="weekly-bar-value">${day.formatted}</span>
                  </div>
                </div>
                <div class="weekly-day-label">
                  <span class="weekly-day-name">${dayName}</span>
                  <span class="weekly-day-num">${dayNum}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    document.getElementById('dashboard-sites-list').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>Error loading dashboard data. Please refresh the page.</p>
      </div>
    `;
  }
}

// Render sites
async function renderSites() {
  const defaultList = document.getElementById('default-sites-list');
  const userList = document.getElementById('user-sites-list');
  
  // Render default sites
  defaultList.innerHTML = defaultSites.map(site => `
    <div class="site-item">
      <div class="site-item-info">
        <span class="site-item-name">${escapeHtml(site.name)}</span>
        <span class="site-item-domain">${escapeHtml(site.domain)}</span>
      </div>
      <div class="site-item-actions">
        <label class="toggle-modern">
          <input type="checkbox" data-site="${escapeHtml(site.domain)}" ${site.enabled ? 'checked' : ''}>
          <span class="toggle-switch-modern"></span>
        </label>
      </div>
    </div>
  `).join('');
  
  // Render user sites
  userList.innerHTML = userSites.map(site => `
    <div class="site-item">
      <div class="site-item-info">
        <span class="site-item-name">${escapeHtml(site)}</span>
        <span class="site-item-domain">User domain</span>
      </div>
      <div class="site-item-actions">
        <button class="btn-remove" data-site="${escapeHtml(site)}">Remove</button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners
  defaultList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const domain = e.target.dataset.site;
      const site = defaultSites.find(s => s.domain === domain);
      if (site) {
        site.enabled = e.target.checked;
      }
    });
  });
  
  userList.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const site = e.target.dataset.site;
      removeUserSite(site);
    });
  });
}

// Render personas
async function renderPersonas() {
  const personasList = document.getElementById('personas-list');
  const config = await getConfig();
  const enabledPersonas = config.enabledPersonas || DEFAULT_CONFIG.enabledPersonas;
  
  personasList.innerHTML = personas.map(persona => {
    const enabled = enabledPersonas.includes(persona.id);
    return `
      <div class="persona-item ${enabled ? 'enabled' : ''}" data-persona="${escapeHtml(persona.id)}">
        <div class="persona-content">
          <span class="persona-name">${escapeHtml(persona.name)}</span>
          <p class="persona-description">${escapeHtml(persona.system_prompt || 'A unique voice for your focus journey.')}</p>
        </div>
        <label class="toggle-modern">
          <input type="checkbox" data-persona="${escapeHtml(persona.id)}" ${enabled ? 'checked' : ''}>
          <span class="toggle-switch-modern"></span>
        </label>
      </div>
    `;
  }).join('');
  
  // Add event listeners
  personasList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const personaId = e.target.dataset.persona;
      const item = e.target.closest('.persona-item');
      item.classList.toggle('enabled', e.target.checked);
    });
  });
}

// Render settings
async function renderSettings() {
  const config = await getConfig();
  
  document.getElementById('popup-enabled').checked = config.popupEnabled !== false;
  document.getElementById('min-time-popup').value = Math.floor((config.minTimeBeforePopup || DEFAULT_CONFIG.minTimeBeforePopup) / 60000);
  document.getElementById('popup-duration').value = Math.floor((config.popupDuration || DEFAULT_CONFIG.popupDuration) / 1000);
  document.getElementById('popup-cooldown').value = Math.floor((config.popupCooldown || DEFAULT_CONFIG.popupCooldown) / 60000);
  document.getElementById('ai-enabled').checked = config.aiEnabled !== false;
}

// Add user site
async function addUserSite() {
  const input = document.getElementById('new-site-input');
  const site = input.value.trim().toLowerCase();
  
  if (!site) {
    showStatus('Enter a domain', 'error');
    return;
  }
  
  // Simple domain validation
  if (!site.includes('.') || site.length < 4) {
    showStatus('Invalid domain', 'error');
    return;
  }
  
  if (userSites.includes(site)) {
    showStatus('Already monitored', 'error');
    return;
  }
  
  userSites.push(site);
  await saveUserSites(userSites);
  await refreshSites();
  
  input.value = '';
  renderSites();
  showStatus('Added successfully', 'success');
}

// Remove user site
async function removeUserSite(site) {
  userSites = userSites.filter(s => s !== site);
  await saveUserSites(userSites);
  await refreshSites();
  renderSites();
  showStatus('Removed domain', 'success');
}

// Save settings
async function saveSettings() {
  const config = await getConfig();
  
  // Popup settings
  config.popupEnabled = document.getElementById('popup-enabled').checked;
  config.minTimeBeforePopup = parseInt(document.getElementById('min-time-popup').value) * 60000;
  config.popupDuration = parseInt(document.getElementById('popup-duration').value) * 1000;
  config.popupCooldown = parseInt(document.getElementById('popup-cooldown').value) * 60000;
  config.aiEnabled = document.getElementById('ai-enabled').checked;
  
  // Persona settings - collect from checked checkboxes
  const enabledPersonas = [];
  document.querySelectorAll('#personas-list input[type="checkbox"]:checked').forEach(checkbox => {
    enabledPersonas.push(checkbox.dataset.persona);
  });
  
  if (enabledPersonas.length === 0) {
    showStatus('Choose at least one persona', 'error');
    return;
  }
  
  config.enabledPersonas = enabledPersonas;
  
  // Sites state is handled via global objects during interaction in this simplified version
  // but for reliability let's ensure we update any necessary defaults
  
  await saveConfig(config);
  await refreshSites();
  
  showStatus('Preferences saved', 'success');
}

// Reset to defaults
async function resetToDefaults() {
  if (!confirm('Reset all preferences to factory defaults? This cannot be undone.')) {
    return;
  }
  
  await saveConfig(DEFAULT_CONFIG);
  await loadData();
  renderSites();
  renderPersonas();
  renderSettings();
  showStatus('Reset complete', 'success');
}

// Export data
async function exportData() {
  const config = await getConfig();
  const timeData = await getTimeData();
  const userSites = await getUserSites();
  
  const exportData = {
    config: config,
    timeData: timeData,
    userSites: userSites,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shame-clock-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showStatus('Exported JSON', 'success');
}

// Clear all data
async function clearAllData() {
  if (!confirm('Wipe all local tracking data? This is permanent.')) {
    return;
  }
  
  await clearStorage();
  await saveConfig(DEFAULT_CONFIG);
  await loadData();
  renderSites();
  renderPersonas();
  renderSettings();
  showStatus('All data wiped', 'success');
}

// Show status message
function showStatus(message, type = '') {
  const statusEl = document.getElementById('status-message');
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'status-message';
  }, 3000);
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
