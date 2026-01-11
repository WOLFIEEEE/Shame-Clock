// Options page logic
import { 
  getConfig, 
  saveConfig, 
  getUserSites, 
  saveUserSites,
  getTimeData,
  clearStorage,
  setStorageValue,
  getStorageValue
} from '../utils/storage.js';
import { DEFAULT_CONFIG, STORAGE_KEYS } from '../utils/config.js';
import { getAllPersonas } from '../ai/personas.js';
import { refreshSites } from '../utils/site-matcher.js';

// Browser API abstraction - ensure it's always available
function getBrowserAPI() {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome;
  }
  if (typeof browser !== 'undefined' && browser.runtime) {
    return browser;
  }
  console.error('Browser API not available');
  return null;
}

const browserAPI = getBrowserAPI();

let defaultSites = [];
let userSites = [];
let personas = [];
let currentOnboardingStep = 0;
const totalOnboardingSteps = 5;

const TAB_INFO = {
  dashboard: {
    title: 'Dashboard',
    description: 'Comprehensive view of your browsing activity and time management insights.'
  },
  goals: {
    title: 'Goals',
    description: 'Set time limits and track your progress toward mindful browsing.'
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
  schedule: {
    title: 'Schedule',
    description: 'Set quiet hours, work hours, and customize when tracking is active.'
  },
  focus: {
    title: 'Focus Sessions',
    description: 'Track productive focus time with the Pomodoro technique.'
  },
  privacy: {
    title: 'Your Data Sovereignty',
    description: 'Everything stays local. We don\'t have servers, so we can\'t see your data.'
  }
};

// Initialize page
async function init() {
  await loadData();
  await checkOnboarding();
  setupEventListeners();
  renderDashboard();
  renderSites();
  renderPersonas();
  renderSettings();
  renderGoals();
  renderSchedule();
  renderFocusStats();
}

// Check if onboarding is needed
async function checkOnboarding() {
  try {
    const onboardingState = await getStorageValue('onboardingState');
    
    if (!onboardingState || (!onboardingState.completed && !onboardingState.skipped)) {
      showOnboarding();
    }
  } catch (error) {
    console.error('Error checking onboarding:', error);
  }
}

// Show onboarding overlay
function showOnboarding() {
  document.getElementById('onboarding-overlay').style.display = 'flex';
  updateOnboardingStep(0);
}

// Hide onboarding overlay
function hideOnboarding() {
  document.getElementById('onboarding-overlay').style.display = 'none';
}

// Update onboarding step
function updateOnboardingStep(step) {
  currentOnboardingStep = step;
  
  // Update progress bar
  const progress = ((step + 1) / totalOnboardingSteps) * 100;
  document.getElementById('onboarding-progress-bar').style.width = `${progress}%`;
  
  // Hide all steps
  for (let i = 1; i <= totalOnboardingSteps; i++) {
    const stepEl = document.getElementById(`onboarding-step-${i}`);
    if (stepEl) {
      stepEl.classList.remove('active');
    }
  }
  
  // Show current step
  const currentStepEl = document.getElementById(`onboarding-step-${step + 1}`);
  if (currentStepEl) {
    currentStepEl.classList.add('active');
  }
  
  // Update buttons
  const prevBtn = document.getElementById('onboarding-prev');
  const nextBtn = document.getElementById('onboarding-next');
  
  prevBtn.style.display = step > 0 ? 'inline-flex' : 'none';
  nextBtn.textContent = step === totalOnboardingSteps - 1 ? 'Get Started' : 'Next';
}

// Load data
async function loadData() {
  // Load default sites
  try {
    const api = getBrowserAPI();
    if (!api || !api.runtime) {
      console.error('Browser API not available');
      defaultSites = [];
      return;
    }
    const response = await fetch(api.runtime.getURL('data/default-sites.json'));
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
  
  // Import data
  document.getElementById('import-data-btn').addEventListener('click', () => {
    document.getElementById('import-file-input').click();
  });
  
  document.getElementById('import-file-input').addEventListener('change', importData);
  
  // Clear data
  document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
  
  // Onboarding buttons
  document.getElementById('onboarding-skip').addEventListener('click', async () => {
    await setStorageValue('onboardingState', { completed: false, skipped: true, tutorialShown: true });
    hideOnboarding();
  });
  
  document.getElementById('onboarding-prev').addEventListener('click', () => {
    if (currentOnboardingStep > 0) {
      updateOnboardingStep(currentOnboardingStep - 1);
    }
  });
  
  document.getElementById('onboarding-next').addEventListener('click', async () => {
    if (currentOnboardingStep < totalOnboardingSteps - 1) {
      updateOnboardingStep(currentOnboardingStep + 1);
    } else {
      await setStorageValue('onboardingState', { completed: true, skipped: false, tutorialShown: true });
      hideOnboarding();
    }
  });
  
  // Goals
  document.getElementById('goal-type').addEventListener('change', (e) => {
    const siteRow = document.getElementById('goal-site-row');
    siteRow.style.display = e.target.value === 'site_limit' ? 'flex' : 'none';
  });
  
  document.getElementById('add-goal-btn').addEventListener('click', addGoal);
  
  // Focus session buttons
  document.getElementById('start-focus-btn')?.addEventListener('click', startFocusSession);
  document.getElementById('focus-stop-btn')?.addEventListener('click', stopFocusSession);
  document.getElementById('focus-pause-btn')?.addEventListener('click', pauseFocusSession);
  
  // Focus preset buttons
  document.querySelectorAll('.focus-preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.focus-preset-btn').forEach(b => b.classList.remove('selected'));
      e.target.classList.add('selected');
    });
  });
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
  
  // Render tab-specific content
  if (tabName === 'goals') {
    renderGoals();
  } else if (tabName === 'focus') {
    renderFocusStats();
    updateFocusSessionUI();
  } else if (tabName === 'schedule') {
    renderSchedule();
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
    // Ensure browser API is available
    const api = getBrowserAPI();
    if (!api || !api.runtime) {
      console.error('Browser API not available');
      document.getElementById('dashboard-sites-list').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <p>Browser API not available. Please reload the extension.</p>
        </div>
      `;
      return;
    }
    
    // Get today's stats
    const response = await api.runtime.sendMessage({ action: 'getTodayStats' });
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

// Render goals
async function renderGoals() {
  try {
    const api = getBrowserAPI();
    if (!api || !api.runtime) {
      console.error('Browser API not available');
      return;
    }
    const response = await api.runtime.sendMessage({ action: 'getGoals' });
    const goalsData = response.goals || { goals: [] };
    const goalsList = document.getElementById('goals-list');
    
    // Populate site dropdown for site-specific goals
    const siteSelect = document.getElementById('goal-site');
    siteSelect.innerHTML = '<option value="">Select a site...</option>';
    
    const allSites = [...defaultSites.filter(s => s.enabled), ...userSites.map(s => ({ domain: s, name: s }))];
    allSites.forEach(site => {
      const option = document.createElement('option');
      option.value = site.domain;
      option.textContent = site.name || site.domain;
      siteSelect.appendChild(option);
    });
    
    if (goalsData.goals.length === 0) {
      goalsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎯</div>
          <p>No goals set yet. Add one to get started!</p>
        </div>
      `;
      return;
    }
    
    // Get progress for each goal
    const progressResponse = await api.runtime.sendMessage({ action: 'getGoalProgress' });
    const progress = progressResponse.progress || [];
    
    goalsList.innerHTML = goalsData.goals.map(goal => {
      const goalProgress = progress.find(p => p.goalId === goal.id) || {
        percentage: 0,
        formatted: { current: '0m', remaining: goal.target + 'm' }
      };
      
      const progressClass = goalProgress.exceeded ? 'exceeded' : goalProgress.percentage >= 80 ? 'warning' : '';
      
      return `
        <div class="goal-item ${progressClass}">
          <div class="goal-item-header">
            <div class="goal-item-info">
              <h4>${escapeHtml(goal.name)}</h4>
              <p>${goal.domain ? escapeHtml(goal.domain) : 'All tracked sites'} • ${goal.target} min ${goal.type === 'weekly_limit' ? '/ week' : '/ day'}</p>
            </div>
            <button class="btn-icon delete-goal-btn" data-goal-id="${goal.id}" title="Delete goal">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="goal-item-progress">
            <div class="goal-progress-bar">
              <div class="goal-progress-fill ${progressClass}" style="width: ${Math.min(100, goalProgress.percentage)}%"></div>
            </div>
            <div class="goal-progress-text">
              <span>${goalProgress.formatted.current}</span>
              <span>${Math.round(goalProgress.percentage)}%</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Add delete handlers
    document.querySelectorAll('.delete-goal-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const goalId = e.currentTarget.dataset.goalId;
        if (confirm('Delete this goal?')) {
          const api = getBrowserAPI();
          if (api && api.runtime) {
            await api.runtime.sendMessage({ action: 'deleteGoal', goalId });
            renderGoals();
            showStatus('Goal deleted', 'success');
          }
        }
      });
    });
  } catch (error) {
    console.error('Error rendering goals:', error);
  }
}

// Add goal
async function addGoal() {
  const type = document.getElementById('goal-type').value;
  const target = parseInt(document.getElementById('goal-target').value);
  const name = document.getElementById('goal-name').value.trim();
  const site = document.getElementById('goal-site').value;
  
  if (!name) {
    showStatus('Please enter a goal name', 'error');
    return;
  }
  
  if (target < 5 || target > 480) {
    showStatus('Target must be between 5 and 480 minutes', 'error');
    return;
  }
  
  if (type === 'site_limit' && !site) {
    showStatus('Please select a site', 'error');
    return;
  }
  
  try {
    const api = getBrowserAPI();
    if (!api || !api.runtime) {
      showStatus('Browser API not available', 'error');
      return;
    }
    await api.runtime.sendMessage({
      action: 'addGoal',
      goal: {
        type,
        target,
        name,
        domain: type === 'site_limit' ? site : null
      }
    });
    
    // Reset form
    document.getElementById('goal-name').value = '';
    document.getElementById('goal-target').value = '60';
    
    renderGoals();
    showStatus('Goal added', 'success');
  } catch (error) {
    console.error('Error adding goal:', error);
    showStatus('Failed to add goal', 'error');
  }
}

// Render schedule settings
async function renderSchedule() {
  try {
    const schedulerConfig = await getStorageValue('schedulerConfig');
    const config = schedulerConfig || {
      quickSettings: {
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        workHoursEnabled: false,
        workHoursStart: '09:00',
        workHoursEnd: '17:00',
        weekendMode: false
      }
    };
    
    document.getElementById('quiet-hours-enabled').checked = config.quickSettings.quietHoursEnabled;
    document.getElementById('quiet-hours-start').value = config.quickSettings.quietHoursStart;
    document.getElementById('quiet-hours-end').value = config.quickSettings.quietHoursEnd;
    document.getElementById('work-hours-enabled').checked = config.quickSettings.workHoursEnabled;
    document.getElementById('work-hours-start').value = config.quickSettings.workHoursStart;
    document.getElementById('work-hours-end').value = config.quickSettings.workHoursEnd;
    document.getElementById('weekend-mode').checked = config.quickSettings.weekendMode;
  } catch (error) {
    console.error('Error rendering schedule:', error);
  }
}

// Render focus stats
async function renderFocusStats() {
  try {
    const api = getBrowserAPI();
    if (!api || !api.runtime) {
      console.error('Browser API not available');
      return;
    }
    const response = await api.runtime.sendMessage({ action: 'getFocusStatus' });
    const focusState = await getStorageValue('focusSessions');
    
    if (focusState && focusState.todayStats) {
      document.getElementById('focus-total-time').textContent = formatTimeShort(focusState.todayStats.focusTime);
      document.getElementById('focus-sessions-count').textContent = focusState.todayStats.sessionsCompleted;
    }
    
    if (focusState && focusState.streak) {
      document.getElementById('focus-streak').textContent = focusState.streak.current;
    }
    
    // Update active session UI
    updateFocusSessionUI();
  } catch (error) {
    console.error('Error rendering focus stats:', error);
  }
}

// Update focus session UI
async function updateFocusSessionUI() {
  try {
    const api = getBrowserAPI();
    if (!api || !api.runtime) {
      console.error('Browser API not available');
      return;
    }
    const response = await api.runtime.sendMessage({ action: 'getFocusStatus' });
    const status = response.status;
    
    const activeSection = document.getElementById('focus-session-active');
    const startSection = document.getElementById('focus-session-start');
    
    if (status && status.active) {
      activeSection.style.display = 'block';
      startSection.style.display = 'none';
      
      document.getElementById('focus-session-timer').textContent = status.formatted.remaining;
      document.getElementById('focus-progress-bar').style.width = `${status.progress}%`;
    } else {
      activeSection.style.display = 'none';
      startSection.style.display = 'block';
    }
  } catch (error) {
    console.error('Error updating focus session UI:', error);
  }
}

// Start focus session
async function startFocusSession() {
  const selectedPreset = document.querySelector('.focus-preset-btn.selected');
  const duration = selectedPreset ? parseInt(selectedPreset.dataset.duration) : 25;
  
  try {
    const api = getBrowserAPI();
    if (!api || !api.runtime) {
      showStatus('Browser API not available', 'error');
      return;
    }
    await api.runtime.sendMessage({
      action: 'startFocusSession',
      options: { duration: duration * 60 * 1000 }
    });
    updateFocusSessionUI();
    showStatus('Focus session started!', 'success');
  } catch (error) {
    console.error('Error starting focus session:', error);
    showStatus('Failed to start focus session', 'error');
  }
}

// Stop focus session
async function stopFocusSession() {
  try {
    const api = getBrowserAPI();
    if (!api || !api.runtime) {
      showStatus('Browser API not available', 'error');
      return;
    }
    await api.runtime.sendMessage({ action: 'stopFocusSession' });
    updateFocusSessionUI();
    renderFocusStats();
    showStatus('Focus session ended', 'info');
  } catch (error) {
    console.error('Error stopping focus session:', error);
  }
}

// Pause focus session (placeholder)
async function pauseFocusSession() {
  showStatus('Pause feature coming soon', 'info');
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
  if (userSites.length === 0) {
    userList.innerHTML = '<p class="empty-hint">No custom sites added yet.</p>';
  } else {
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
  }
  
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
  document.getElementById('snooze-duration').value = Math.floor((config.snoozeDuration || DEFAULT_CONFIG.snoozeDuration) / 60000);
  document.getElementById('ai-enabled').checked = config.aiEnabled !== false;
  
  // Data retention
  const dataRetention = document.getElementById('data-retention');
  if (dataRetention) {
    dataRetention.value = config.dataRetentionDays || 30;
  }
  
  // Pomodoro settings
  const focusState = await getStorageValue('focusSessions');
  if (focusState && focusState.settings) {
    document.getElementById('pomodoro-focus').value = Math.floor(focusState.settings.focusDuration / 60000);
    document.getElementById('pomodoro-short-break').value = Math.floor(focusState.settings.shortBreakDuration / 60000);
    document.getElementById('pomodoro-long-break').value = Math.floor(focusState.settings.longBreakDuration / 60000);
  }
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
  config.snoozeDuration = parseInt(document.getElementById('snooze-duration').value) * 60000;
  config.aiEnabled = document.getElementById('ai-enabled').checked;
  
  // Data retention
  const dataRetention = document.getElementById('data-retention');
  if (dataRetention) {
    config.dataRetentionDays = parseInt(dataRetention.value);
  }
  
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
  
  await saveConfig(config);
  
  // Save schedule settings
  const schedulerConfig = await getStorageValue('schedulerConfig') || { quickSettings: {} };
  schedulerConfig.quickSettings = {
    quietHoursEnabled: document.getElementById('quiet-hours-enabled').checked,
    quietHoursStart: document.getElementById('quiet-hours-start').value,
    quietHoursEnd: document.getElementById('quiet-hours-end').value,
    workHoursEnabled: document.getElementById('work-hours-enabled').checked,
    workHoursStart: document.getElementById('work-hours-start').value,
    workHoursEnd: document.getElementById('work-hours-end').value,
    weekendMode: document.getElementById('weekend-mode').checked,
    workDays: [1, 2, 3, 4, 5]
  };
  await setStorageValue('schedulerConfig', schedulerConfig);
  
  // Save Pomodoro settings
  const focusState = await getStorageValue('focusSessions') || { settings: {} };
  focusState.settings = {
    ...focusState.settings,
    focusDuration: parseInt(document.getElementById('pomodoro-focus').value) * 60000,
    shortBreakDuration: parseInt(document.getElementById('pomodoro-short-break').value) * 60000,
    longBreakDuration: parseInt(document.getElementById('pomodoro-long-break').value) * 60000
  };
  await setStorageValue('focusSessions', focusState);
  
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
  renderSchedule();
  showStatus('Reset complete', 'success');
}

// Export data
async function exportData() {
  const config = await getConfig();
  const timeData = await getTimeData();
  const userSitesData = await getUserSites();
  const goalsData = await getStorageValue('userGoals');
  const schedulerConfig = await getStorageValue('schedulerConfig');
  const focusSessions = await getStorageValue('focusSessions');
  
  const exportData = {
    version: '1.0',
    config: config,
    timeData: timeData,
    userSites: userSitesData,
    goals: goalsData,
    scheduler: schedulerConfig,
    focusSessions: focusSessions,
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

// Import data
async function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.version || !data.config) {
      throw new Error('Invalid backup file');
    }
    
    if (!confirm('Import will merge with existing data. Continue?')) {
      return;
    }
    
    // Restore data
    if (data.config) await saveConfig(data.config);
    if (data.userSites) await saveUserSites(data.userSites);
    if (data.goals) await setStorageValue('userGoals', data.goals);
    if (data.scheduler) await setStorageValue('schedulerConfig', data.scheduler);
    if (data.focusSessions) await setStorageValue('focusSessions', data.focusSessions);
    
    // Merge time data
    if (data.timeData) {
      const existingData = await getTimeData();
      const mergedData = { ...data.timeData, ...existingData };
      await setStorageValue(STORAGE_KEYS.TIME_DATA, mergedData);
    }
    
    await loadData();
    renderSites();
    renderPersonas();
    renderSettings();
    renderGoals();
    renderSchedule();
    
    showStatus('Data imported', 'success');
  } catch (error) {
    console.error('Import error:', error);
    showStatus('Failed to import: ' + error.message, 'error');
  }
  
  // Reset file input
  e.target.value = '';
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
  renderGoals();
  renderDashboard();
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
