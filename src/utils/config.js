// Default configuration values
export const DEFAULT_CONFIG = {
  // Popup settings
  popupEnabled: true,
  minTimeBeforePopup: 5 * 60 * 1000, // 5 minutes in milliseconds
  popupDuration: 30 * 1000, // 30 seconds
  popupCooldown: 3 * 60 * 1000, // 3 minutes between popups
  
  // Smart popup thresholds (in milliseconds)
  thresholds: {
    low: 5 * 60 * 1000,      // 5 minutes - no popup
    medium: 15 * 60 * 1000,  // 15 minutes - popup every 10 minutes
    high: 30 * 60 * 1000,    // 30 minutes - popup every 5 minutes
    veryHigh: Infinity       // 30+ minutes - popup every 3 minutes
  },
  
  // Popup intervals (in milliseconds)
  intervals: {
    medium: 10 * 60 * 1000,  // Every 10 minutes
    high: 5 * 60 * 1000,     // Every 5 minutes
    veryHigh: 3 * 60 * 1000  // Every 3 minutes
  },
  
  // Persona settings
  enabledPersonas: ['future_self', 'mom', 'historical_figures'],
  personaWeights: {
    future_self: 0.4,
    mom: 0.3,
    historical_figures: 0.3
  },
  
  // AI settings
  aiEnabled: true,
  useLocalAI: true,
  messageCacheSize: 10,
  
  // Tracking settings
  trackAllSites: false,
  resetDaily: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
};

export const STORAGE_KEYS = {
  CONFIG: 'shameClockConfig',
  TRACKED_SITES: 'trackedSites',
  TIME_DATA: 'timeData',
  USER_SITES: 'userSites',
  LAST_POPUP_TIME: 'lastPopupTime',
  LAST_POPUP_DOMAIN: 'lastPopupDomain',
  DAILY_RESET: 'dailyReset'
};

