// Popup UI logic
const browserAPI = typeof chrome !== 'undefined' && chrome.runtime ? chrome : browser;

// State
let isPaused = false;
let hasGoals = false;
let focusSessionActive = false;

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

// Show toast message
function showToast(message, type = 'info') {
  const toast = document.getElementById('status-toast');
  const toastMessage = document.getElementById('toast-message');
  
  toastMessage.textContent = message;
  toast.className = `status-toast ${type}`;
  toast.style.display = 'flex';
  
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// Check if onboarding is needed
async function checkOnboarding() {
  try {
    const welcomeScreen = document.getElementById('welcome-screen');
    const mainApp = document.getElementById('main-app');
    
    const response = await browserAPI.runtime.sendMessage({ action: 'getConfig' });
    const config = response.config || {};
    
    // Check onboarding state
    const onboardingResponse = await browserAPI.runtime.sendMessage({ action: 'getOnboardingState' });
    const onboardingState = onboardingResponse.state;
    
    if (onboardingState && !onboardingState.completed && !onboardingState.skipped) {
      welcomeScreen.classList.add('show');
      mainApp.style.display = 'none';
    } else {
      welcomeScreen.classList.remove('show');
      mainApp.style.display = 'block';
    }
  } catch (error) {
    // If error, show main app
    const welcomeScreen = document.getElementById('welcome-screen');
    const mainApp = document.getElementById('main-app');
    welcomeScreen.classList.remove('show');
    mainApp.style.display = 'block';
  }
}

// Update pause/resume UI
function updatePauseUI(paused) {
  isPaused = paused;
  const pauseBtn = document.getElementById('pause-btn');
  const pauseIcon = document.getElementById('pause-icon');
  const playIcon = document.getElementById('play-icon');
  const pausedBanner = document.getElementById('paused-banner');
  
  if (paused) {
    pauseIcon.style.display = 'none';
    playIcon.style.display = 'block';
    pauseBtn.title = 'Resume Tracking';
    pausedBanner.style.display = 'flex';
  } else {
    pauseIcon.style.display = 'block';
    playIcon.style.display = 'none';
    pauseBtn.title = 'Pause Tracking';
    pausedBanner.style.display = 'none';
  }
}

// Toggle pause/resume
async function togglePause() {
  try {
    const newState = !isPaused;
    await browserAPI.runtime.sendMessage({ 
      action: newState ? 'pauseTracking' : 'resumeTracking' 
    });
    updatePauseUI(newState);
    showToast(newState ? 'Tracking paused' : 'Tracking resumed', 'success');
  } catch (error) {
    console.error('Error toggling pause:', error);
    showToast('Failed to update tracking state', 'error');
  }
}

// Load goal progress
async function loadGoalProgress() {
  try {
    const response = await browserAPI.runtime.sendMessage({ action: 'getGoalProgress' });
    const progress = response.progress;
    
    if (progress && progress.length > 0) {
      const primaryGoal = progress[0]; // Show first active goal
      hasGoals = true;
      
      const section = document.getElementById('goal-progress-section');
      const percentage = document.getElementById('goal-percentage');
      const progressBar = document.getElementById('goal-progress-bar');
      const current = document.getElementById('goal-current');
      const target = document.getElementById('goal-target');
      
      section.style.display = 'block';
      percentage.textContent = `${Math.round(primaryGoal.percentage)}%`;
      progressBar.style.width = `${Math.min(100, primaryGoal.percentage)}%`;
      current.textContent = primaryGoal.formatted.current;
      target.textContent = `/ ${primaryGoal.formatted.target}`;
      
      // Update color based on progress
      if (primaryGoal.exceeded) {
        progressBar.classList.add('exceeded');
        percentage.classList.add('exceeded');
      } else if (primaryGoal.percentage >= 80) {
        progressBar.classList.add('warning');
        percentage.classList.add('warning');
      } else {
        progressBar.classList.remove('exceeded', 'warning');
        percentage.classList.remove('exceeded', 'warning');
      }
    } else {
      document.getElementById('goal-progress-section').style.display = 'none';
    }
  } catch (error) {
    // Goals not available
    document.getElementById('goal-progress-section').style.display = 'none';
  }
}

// Load and display stats
async function loadStats() {
  try {
    // Get config to check pause state
    const configResponse = await browserAPI.runtime.sendMessage({ action: 'getConfig' });
    const config = configResponse.config || {};
    updatePauseUI(config.trackingPaused || false);
    
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
        if (response.tracked && !isPaused) {
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
    
    // Load goal progress
    await loadGoalProgress();
    
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Load focus session status
async function loadFocusStatus() {
  try {
    const response = await browserAPI.runtime.sendMessage({ action: 'getFocusStatus' });
    const status = response.status;
    
    if (status && status.active) {
      focusSessionActive = true;
      document.getElementById('focus-section').style.display = 'block';
      document.getElementById('focus-timer').textContent = status.formatted.remaining;
      document.getElementById('focus-start-btn').style.display = 'none';
      document.getElementById('focus-stop-btn').style.display = 'inline-flex';
    } else {
      focusSessionActive = false;
      document.getElementById('focus-start-btn').style.display = 'inline-flex';
      document.getElementById('focus-stop-btn').style.display = 'none';
    }
  } catch (error) {
    // Focus sessions not available
    document.getElementById('focus-section').style.display = 'none';
  }
}

// Start focus session
async function startFocusSession() {
  try {
    await browserAPI.runtime.sendMessage({ action: 'startFocusSession' });
    focusSessionActive = true;
    showToast('Focus session started!', 'success');
    loadFocusStatus();
  } catch (error) {
    console.error('Error starting focus session:', error);
    showToast('Failed to start focus session', 'error');
  }
}

// Stop focus session
async function stopFocusSession() {
  try {
    await browserAPI.runtime.sendMessage({ action: 'stopFocusSession' });
    focusSessionActive = false;
    showToast('Focus session ended', 'info');
    loadFocusStatus();
  } catch (error) {
    console.error('Error stopping focus session:', error);
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

document.getElementById('pause-btn').addEventListener('click', togglePause);

document.getElementById('resume-from-banner').addEventListener('click', () => {
  if (isPaused) {
    togglePause();
  }
});

// Welcome screen buttons
document.getElementById('welcome-setup-btn').addEventListener('click', () => {
  browserAPI.runtime.openOptionsPage();
  window.close();
});

document.getElementById('welcome-skip-btn').addEventListener('click', async () => {
  try {
    await browserAPI.runtime.sendMessage({ action: 'skipOnboarding' });
    const welcomeScreen = document.getElementById('welcome-screen');
    const mainApp = document.getElementById('main-app');
    welcomeScreen.classList.remove('show');
    mainApp.style.display = 'block';
  } catch (error) {
    console.error('Error skipping onboarding:', error);
  }
});

// Focus session buttons
document.getElementById('focus-start-btn').addEventListener('click', startFocusSession);
document.getElementById('focus-stop-btn').addEventListener('click', stopFocusSession);

// Initialize
async function init() {
  await checkOnboarding();
  await loadStats();
  await loadFocusStatus();
}

init();

// Refresh stats every second for live timer feeling
setInterval(loadStats, 1000);

// Refresh focus status every second
setInterval(loadFocusStatus, 1000);
