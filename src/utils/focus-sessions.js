// Focus session tracking with Pomodoro integration
import { getStorageValue, setStorageValue } from './storage.js';

const FOCUS_KEY = 'focusSessions';

/**
 * Session types
 */
export const SessionType = {
  FOCUS: 'focus',
  SHORT_BREAK: 'short_break',
  LONG_BREAK: 'long_break',
  CUSTOM: 'custom'
};

/**
 * Session status
 */
export const SessionStatus = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Default Pomodoro settings
 */
const DEFAULT_POMODORO_SETTINGS = {
  focusDuration: 25 * 60 * 1000,      // 25 minutes
  shortBreakDuration: 5 * 60 * 1000,   // 5 minutes
  longBreakDuration: 15 * 60 * 1000,   // 15 minutes
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  soundVolume: 0.5
};

/**
 * Default focus sessions state
 */
const DEFAULT_FOCUS_STATE = {
  settings: DEFAULT_POMODORO_SETTINGS,
  currentSession: null,
  sessionHistory: [],
  todayStats: {
    date: new Date().toISOString().split('T')[0],
    focusTime: 0,
    breakTime: 0,
    sessionsCompleted: 0,
    distractionsAvoided: 0
  },
  streak: {
    current: 0,
    best: 0,
    lastSessionDate: null
  }
};

/**
 * Get focus sessions state
 * @returns {Promise<Object>}
 */
export async function getFocusState() {
  const state = await getStorageValue(FOCUS_KEY);
  const defaultState = { ...DEFAULT_FOCUS_STATE };
  
  if (!state) {
    return defaultState;
  }
  
  // Reset today stats if it's a new day
  const today = new Date().toISOString().split('T')[0];
  if (state.todayStats?.date !== today) {
    state.todayStats = {
      ...DEFAULT_FOCUS_STATE.todayStats,
      date: today
    };
  }
  
  return { ...defaultState, ...state };
}

/**
 * Save focus sessions state
 * @param {Object} state
 * @returns {Promise<void>}
 */
export async function saveFocusState(state) {
  return setStorageValue(FOCUS_KEY, state);
}

/**
 * Start a new focus session
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function startFocusSession(options = {}) {
  const state = await getFocusState();
  
  // Can't start if already in a session
  if (state.currentSession?.status === SessionStatus.ACTIVE) {
    throw new Error('A session is already active');
  }
  
  const {
    type = SessionType.FOCUS,
    duration = null,
    name = ''
  } = options;
  
  let sessionDuration;
  switch (type) {
    case SessionType.FOCUS:
      sessionDuration = duration || state.settings.focusDuration;
      break;
    case SessionType.SHORT_BREAK:
      sessionDuration = duration || state.settings.shortBreakDuration;
      break;
    case SessionType.LONG_BREAK:
      sessionDuration = duration || state.settings.longBreakDuration;
      break;
    default:
      sessionDuration = duration || state.settings.focusDuration;
  }
  
  const session = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    type,
    name: name || getSessionName(type),
    duration: sessionDuration,
    startTime: Date.now(),
    endTime: null,
    pausedTime: 0,
    pauseStart: null,
    status: SessionStatus.ACTIVE,
    interruptions: 0
  };
  
  state.currentSession = session;
  await saveFocusState(state);
  
  return session;
}

/**
 * Pause current session
 * @returns {Promise<Object|null>}
 */
export async function pauseSession() {
  const state = await getFocusState();
  
  if (!state.currentSession || state.currentSession.status !== SessionStatus.ACTIVE) {
    return null;
  }
  
  state.currentSession.status = SessionStatus.PAUSED;
  state.currentSession.pauseStart = Date.now();
  state.currentSession.interruptions++;
  
  await saveFocusState(state);
  return state.currentSession;
}

/**
 * Resume current session
 * @returns {Promise<Object|null>}
 */
export async function resumeSession() {
  const state = await getFocusState();
  
  if (!state.currentSession || state.currentSession.status !== SessionStatus.PAUSED) {
    return null;
  }
  
  const pauseDuration = Date.now() - state.currentSession.pauseStart;
  state.currentSession.pausedTime += pauseDuration;
  state.currentSession.pauseStart = null;
  state.currentSession.status = SessionStatus.ACTIVE;
  
  await saveFocusState(state);
  return state.currentSession;
}

/**
 * Complete current session
 * @returns {Promise<Object|null>}
 */
export async function completeSession() {
  const state = await getFocusState();
  
  if (!state.currentSession) {
    return null;
  }
  
  const session = state.currentSession;
  session.endTime = Date.now();
  session.status = SessionStatus.COMPLETED;
  
  // Calculate actual duration (excluding pauses)
  const actualDuration = session.endTime - session.startTime - session.pausedTime;
  session.actualDuration = actualDuration;
  
  // Update today's stats
  const today = new Date().toISOString().split('T')[0];
  if (state.todayStats.date !== today) {
    state.todayStats = { ...DEFAULT_FOCUS_STATE.todayStats, date: today };
  }
  
  if (session.type === SessionType.FOCUS) {
    state.todayStats.focusTime += actualDuration;
    state.todayStats.sessionsCompleted++;
  } else {
    state.todayStats.breakTime += actualDuration;
  }
  
  // Update streak
  if (session.type === SessionType.FOCUS) {
    if (state.streak.lastSessionDate === today) {
      // Already had a session today, don't increment
    } else if (isYesterday(state.streak.lastSessionDate)) {
      state.streak.current++;
    } else {
      state.streak.current = 1;
    }
    state.streak.lastSessionDate = today;
    state.streak.best = Math.max(state.streak.best, state.streak.current);
  }
  
  // Add to history
  state.sessionHistory.unshift(session);
  
  // Keep only last 100 sessions
  if (state.sessionHistory.length > 100) {
    state.sessionHistory.length = 100;
  }
  
  state.currentSession = null;
  await saveFocusState(state);
  
  return session;
}

/**
 * Cancel current session
 * @returns {Promise<Object|null>}
 */
export async function cancelSession() {
  const state = await getFocusState();
  
  if (!state.currentSession) {
    return null;
  }
  
  const session = state.currentSession;
  session.endTime = Date.now();
  session.status = SessionStatus.CANCELLED;
  
  // Still add to history for tracking
  state.sessionHistory.unshift(session);
  state.currentSession = null;
  
  await saveFocusState(state);
  return session;
}

/**
 * Get current session status
 * @returns {Promise<Object>}
 */
export async function getSessionStatus() {
  const state = await getFocusState();
  
  if (!state.currentSession) {
    return {
      active: false,
      session: null,
      remaining: 0,
      progress: 0
    };
  }
  
  const session = state.currentSession;
  const now = Date.now();
  
  let elapsed;
  if (session.status === SessionStatus.PAUSED) {
    elapsed = session.pauseStart - session.startTime - session.pausedTime;
  } else {
    elapsed = now - session.startTime - session.pausedTime;
  }
  
  const remaining = Math.max(0, session.duration - elapsed);
  const progress = Math.min(100, (elapsed / session.duration) * 100);
  
  return {
    active: session.status === SessionStatus.ACTIVE,
    paused: session.status === SessionStatus.PAUSED,
    session,
    elapsed,
    remaining,
    progress,
    formatted: {
      elapsed: formatDuration(elapsed),
      remaining: formatDuration(remaining)
    }
  };
}

/**
 * Check if session timer is complete
 * @returns {Promise<boolean>}
 */
export async function isSessionTimerComplete() {
  const status = await getSessionStatus();
  return status.active && status.remaining <= 0;
}

/**
 * Get Pomodoro settings
 * @returns {Promise<Object>}
 */
export async function getPomodoroSettings() {
  const state = await getFocusState();
  return state.settings;
}

/**
 * Update Pomodoro settings
 * @param {Object} settings
 * @returns {Promise<void>}
 */
export async function updatePomodoroSettings(settings) {
  const state = await getFocusState();
  state.settings = { ...state.settings, ...settings };
  await saveFocusState(state);
}

/**
 * Get today's focus stats
 * @returns {Promise<Object>}
 */
export async function getTodayFocusStats() {
  const state = await getFocusState();
  const today = new Date().toISOString().split('T')[0];
  
  if (state.todayStats.date !== today) {
    return { ...DEFAULT_FOCUS_STATE.todayStats, date: today };
  }
  
  return {
    ...state.todayStats,
    formatted: {
      focusTime: formatDuration(state.todayStats.focusTime),
      breakTime: formatDuration(state.todayStats.breakTime)
    }
  };
}

/**
 * Get focus session history
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getSessionHistory(limit = 20) {
  const state = await getFocusState();
  return state.sessionHistory.slice(0, limit);
}

/**
 * Get focus streak info
 * @returns {Promise<Object>}
 */
export async function getStreakInfo() {
  const state = await getFocusState();
  return state.streak;
}

/**
 * Record distraction avoided during focus session
 * @returns {Promise<void>}
 */
export async function recordDistractionAvoided() {
  const state = await getFocusState();
  
  if (state.currentSession?.type === SessionType.FOCUS) {
    const today = new Date().toISOString().split('T')[0];
    if (state.todayStats.date === today) {
      state.todayStats.distractionsAvoided++;
      await saveFocusState(state);
    }
  }
}

/**
 * Get suggested next session type (for Pomodoro)
 * @returns {Promise<Object>}
 */
export async function getSuggestedNextSession() {
  const state = await getFocusState();
  const completedFocus = state.todayStats.sessionsCompleted;
  
  // Check if it's time for a long break
  if (completedFocus > 0 && completedFocus % state.settings.sessionsBeforeLongBreak === 0) {
    return {
      type: SessionType.LONG_BREAK,
      duration: state.settings.longBreakDuration,
      reason: 'You\'ve completed a Pomodoro set! Time for a longer break.'
    };
  }
  
  // If we just had a break, suggest focus
  const lastSession = state.sessionHistory[0];
  if (lastSession && lastSession.type !== SessionType.FOCUS) {
    return {
      type: SessionType.FOCUS,
      duration: state.settings.focusDuration,
      reason: 'Break time is over. Let\'s focus!'
    };
  }
  
  // If we just had focus, suggest short break
  if (lastSession && lastSession.type === SessionType.FOCUS) {
    return {
      type: SessionType.SHORT_BREAK,
      duration: state.settings.shortBreakDuration,
      reason: 'Great work! Take a short break.'
    };
  }
  
  // Default to focus
  return {
    type: SessionType.FOCUS,
    duration: state.settings.focusDuration,
    reason: 'Ready to start your focus session?'
  };
}

/**
 * Get session name based on type
 * @param {string} type
 * @returns {string}
 */
function getSessionName(type) {
  switch (type) {
    case SessionType.FOCUS:
      return 'Focus Session';
    case SessionType.SHORT_BREAK:
      return 'Short Break';
    case SessionType.LONG_BREAK:
      return 'Long Break';
    default:
      return 'Custom Session';
  }
}

/**
 * Check if date is yesterday
 * @param {string} dateStr
 * @returns {boolean}
 */
function isYesterday(dateStr) {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toISOString().split('T')[0];
}

/**
 * Format duration in milliseconds
 * @param {number} ms
 * @returns {string}
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m ${seconds % 60}s`;
}

