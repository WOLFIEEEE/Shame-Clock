// Internationalization system
import { getStorageValue, setStorageValue } from './storage.js';

const I18N_KEY = 'i18nConfig';

/**
 * Supported languages
 */
export const SupportedLanguages = {
  EN: 'en',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
  PT: 'pt',
  JA: 'ja',
  ZH: 'zh'
};

/**
 * Language metadata
 */
export const LanguageInfo = {
  en: { name: 'English', nativeName: 'English', rtl: false },
  es: { name: 'Spanish', nativeName: 'Español', rtl: false },
  fr: { name: 'French', nativeName: 'Français', rtl: false },
  de: { name: 'German', nativeName: 'Deutsch', rtl: false },
  pt: { name: 'Portuguese', nativeName: 'Português', rtl: false },
  ja: { name: 'Japanese', nativeName: '日本語', rtl: false },
  zh: { name: 'Chinese', nativeName: '中文', rtl: false }
};

/**
 * English translations (default)
 */
const translations = {
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.remove': 'Remove',
    'common.enable': 'Enable',
    'common.disable': 'Disable',
    'common.settings': 'Settings',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.warning': 'Warning',
    'common.confirm': 'Confirm',
    
    // Time
    'time.hours': '{count}h',
    'time.minutes': '{count}m',
    'time.seconds': '{count}s',
    'time.today': 'Today',
    'time.yesterday': 'Yesterday',
    'time.thisWeek': 'This Week',
    'time.thisMonth': 'This Month',
    
    // Popup
    'popup.title': 'Shame Clock',
    'popup.totalTime': 'Total Time',
    'popup.activeSites': 'Active Sites',
    'popup.liveSession': 'Live Session',
    'popup.noActivity': 'No distractions tracked yet.',
    'popup.openDashboard': 'Open Dashboard',
    'popup.pauseTracking': 'Pause Tracking',
    'popup.resumeTracking': 'Resume Tracking',
    'popup.trackingPaused': 'Tracking is paused',
    
    // Options/Settings
    'options.dashboard': 'Dashboard',
    'options.sites': 'Monitored Sites',
    'options.personas': 'AI Personas',
    'options.behavior': 'Behavior',
    'options.privacy': 'Privacy & Data',
    'options.goals': 'Goals',
    'options.schedule': 'Schedule',
    'options.focus': 'Focus Sessions',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.overview': 'Today\'s Overview',
    'dashboard.totalTracked': 'Total Time Tracked',
    'dashboard.sitesVisited': 'Sites Visited',
    'dashboard.avgPerSite': 'Average per Site',
    'dashboard.topSite': 'Top Site',
    'dashboard.siteBreakdown': 'Site Activity Breakdown',
    'dashboard.weeklySummary': 'Weekly Summary',
    'dashboard.refresh': 'Refresh',
    
    // Sites
    'sites.default': 'Default Sites',
    'sites.custom': 'Custom Sites',
    'sites.addSite': 'Add Site',
    'sites.enterDomain': 'Enter domain (e.g., example.com)',
    'sites.alreadyMonitored': 'Site is already being monitored',
    'sites.invalidDomain': 'Please enter a valid domain',
    
    // Personas
    'personas.title': 'Choose Your Voice',
    'personas.description': 'Select the personas that will remind you to stay focused.',
    'personas.futureSelf': 'Your Future Self',
    'personas.mom': 'Your Mom',
    'personas.historical': 'Historical Figures',
    
    // Behavior/Popup Settings
    'behavior.popupEnabled': 'Enable Popups',
    'behavior.popupEnabledDesc': 'Show intervention popups on tracked sites',
    'behavior.patience': 'Patience Threshold',
    'behavior.patienceDesc': 'Minutes before first popup',
    'behavior.duration': 'Popup Duration',
    'behavior.durationDesc': 'How long popups stay visible',
    'behavior.cooldown': 'Cooldown Period',
    'behavior.cooldownDesc': 'Minutes between popups',
    'behavior.aiEnabled': 'AI Messages',
    'behavior.aiEnabledDesc': 'Use AI to generate unique messages',
    
    // Privacy
    'privacy.title': 'Your Data Sovereignty',
    'privacy.description': 'Everything stays local. We don\'t have servers.',
    'privacy.export': 'Export Data',
    'privacy.import': 'Import Data',
    'privacy.clear': 'Clear All Data',
    'privacy.clearConfirm': 'This will permanently delete all your data. Continue?',
    
    // Goals
    'goals.title': 'Your Goals',
    'goals.addGoal': 'Add Goal',
    'goals.dailyLimit': 'Daily Limit',
    'goals.siteLimit': 'Site Limit',
    'goals.weeklyLimit': 'Weekly Limit',
    'goals.progress': 'Progress',
    'goals.exceeded': 'Goal exceeded!',
    'goals.onTrack': 'On track',
    
    // Focus Sessions
    'focus.title': 'Focus Sessions',
    'focus.start': 'Start Focus',
    'focus.pause': 'Pause',
    'focus.resume': 'Resume',
    'focus.stop': 'Stop',
    'focus.sessionComplete': 'Session Complete!',
    'focus.takeBreak': 'Take a break',
    'focus.streak': 'Current Streak',
    
    // Schedule
    'schedule.title': 'Schedule',
    'schedule.quietHours': 'Quiet Hours',
    'schedule.workHours': 'Work Hours',
    'schedule.weekendMode': 'Weekend Mode',
    
    // Intervention Popup
    'intervention.title': 'Time to Refocus!',
    'intervention.dismiss': 'Dismiss',
    'intervention.productive': 'I\'ll be productive',
    'intervention.snooze': 'Snooze',
    'intervention.timeSpent': 'You\'ve spent {time} on {site}',
    
    // Onboarding
    'onboarding.welcome': 'Welcome to Shame Clock',
    'onboarding.welcomeDesc': 'Your personal accountability companion.',
    'onboarding.skip': 'Skip Tutorial',
    'onboarding.next': 'Next',
    'onboarding.back': 'Back',
    'onboarding.finish': 'Get Started',
    'onboarding.step1': 'Track Your Time',
    'onboarding.step1Desc': 'We\'ll monitor how long you spend on distracting sites.',
    'onboarding.step2': 'Choose Your Voice',
    'onboarding.step2Desc': 'Pick who will remind you to stay focused.',
    'onboarding.step3': 'Set Your Limits',
    'onboarding.step3Desc': 'Configure thresholds and reminders.',
    
    // Status Messages
    'status.saved': 'Settings saved',
    'status.exported': 'Data exported',
    'status.imported': 'Data imported',
    'status.cleared': 'Data cleared',
    'status.error': 'Something went wrong',
    'status.offline': 'You are offline'
  }
};

/**
 * Default i18n configuration
 */
const DEFAULT_I18N_CONFIG = {
  language: 'en',
  dateFormat: 'auto',
  timeFormat: 'auto',
  numberFormat: 'auto'
};

/**
 * Current translations cache
 */
let currentTranslations = translations.en;
let currentLanguage = 'en';

/**
 * Get i18n configuration
 * @returns {Promise<Object>}
 */
export async function getI18nConfig() {
  const config = await getStorageValue(I18N_KEY);
  return config || { ...DEFAULT_I18N_CONFIG };
}

/**
 * Save i18n configuration
 * @param {Object} config
 * @returns {Promise<void>}
 */
export async function saveI18nConfig(config) {
  return setStorageValue(I18N_KEY, config);
}

/**
 * Initialize i18n system
 * @returns {Promise<void>}
 */
export async function initI18n() {
  const config = await getI18nConfig();
  await setLanguage(config.language);
}

/**
 * Set current language
 * @param {string} lang
 * @returns {Promise<void>}
 */
export async function setLanguage(lang) {
  if (!translations[lang]) {
    lang = 'en';
  }
  
  currentLanguage = lang;
  currentTranslations = translations[lang];
  
  const config = await getI18nConfig();
  config.language = lang;
  await saveI18nConfig(config);
  
  // Update document direction for RTL languages
  if (typeof document !== 'undefined') {
    document.documentElement.dir = LanguageInfo[lang]?.rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
}

/**
 * Get current language
 * @returns {string}
 */
export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Translate a key
 * @param {string} key
 * @param {Object} params
 * @returns {string}
 */
export function t(key, params = {}) {
  let text = currentTranslations[key] || translations.en[key] || key;
  
  // Replace parameters
  for (const [param, value] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
  }
  
  return text;
}

/**
 * Translate and return HTML-safe string
 * @param {string} key
 * @param {Object} params
 * @returns {string}
 */
export function tSafe(key, params = {}) {
  return escapeHtml(t(key, params));
}

/**
 * Format date according to locale
 * @param {Date|string|number} date
 * @param {Object} options
 * @returns {string}
 */
export function formatDate(date, options = {}) {
  const d = new Date(date);
  const defaultOptions = { dateStyle: 'medium' };
  
  try {
    return new Intl.DateTimeFormat(currentLanguage, { ...defaultOptions, ...options }).format(d);
  } catch (e) {
    return d.toLocaleDateString();
  }
}

/**
 * Format time according to locale
 * @param {Date|string|number} date
 * @param {Object} options
 * @returns {string}
 */
export function formatTime(date, options = {}) {
  const d = new Date(date);
  const defaultOptions = { timeStyle: 'short' };
  
  try {
    return new Intl.DateTimeFormat(currentLanguage, { ...defaultOptions, ...options }).format(d);
  } catch (e) {
    return d.toLocaleTimeString();
  }
}

/**
 * Format number according to locale
 * @param {number} num
 * @param {Object} options
 * @returns {string}
 */
export function formatNumber(num, options = {}) {
  try {
    return new Intl.NumberFormat(currentLanguage, options).format(num);
  } catch (e) {
    return String(num);
  }
}

/**
 * Format duration (special handling)
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const seconds = Math.floor((ms % 60000) / 1000);
  
  if (hours > 0) {
    return t('time.hours', { count: hours }) + ' ' + t('time.minutes', { count: minutes % 60 });
  } else if (minutes > 0) {
    return t('time.minutes', { count: minutes });
  } else {
    return t('time.seconds', { count: seconds });
  }
}

/**
 * Get available languages
 * @returns {Array}
 */
export function getAvailableLanguages() {
  return Object.entries(LanguageInfo).map(([code, info]) => ({
    code,
    ...info,
    available: !!translations[code]
  }));
}

/**
 * Add or update translations for a language
 * @param {string} lang
 * @param {Object} newTranslations
 */
export function addTranslations(lang, newTranslations) {
  if (!translations[lang]) {
    translations[lang] = { ...translations.en };
  }
  translations[lang] = { ...translations[lang], ...newTranslations };
  
  if (currentLanguage === lang) {
    currentTranslations = translations[lang];
  }
}

/**
 * Detect browser language
 * @returns {string}
 */
export function detectBrowserLanguage() {
  if (typeof navigator === 'undefined') return 'en';
  
  const browserLang = navigator.language || navigator.userLanguage || 'en';
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  return translations[langCode] ? langCode : 'en';
}

/**
 * Escape HTML entities
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize with browser language on load
if (typeof window !== 'undefined') {
  // Will be properly initialized when module loads
  currentLanguage = detectBrowserLanguage();
  currentTranslations = translations[currentLanguage] || translations.en;
}

