// Centralized error handling system
import { getStorageValue, setStorageValue } from './storage.js';

const ERROR_LOG_KEY = 'errorLog';
const MAX_ERROR_LOG_SIZE = 100;

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Error categories
 */
export const ErrorCategory = {
  STORAGE: 'storage',
  NETWORK: 'network',
  AI: 'ai',
  UI: 'ui',
  TRACKING: 'tracking',
  UNKNOWN: 'unknown'
};

/**
 * User-friendly error messages
 */
const USER_FRIENDLY_MESSAGES = {
  storage_quota_exceeded: 'Storage is full. Please clear some data in Settings > Privacy & Data.',
  storage_access_denied: 'Cannot access storage. Please check extension permissions.',
  network_offline: 'You appear to be offline. Some features may not work.',
  network_timeout: 'Connection timed out. Please try again.',
  ai_model_loading: 'AI model is loading. Using template messages for now.',
  ai_model_failed: 'AI features unavailable. Using template messages.',
  tracking_permission_denied: 'Cannot track this site. Permission denied.',
  unknown_error: 'Something went wrong. Please try again.'
};

/**
 * Error log entry
 */
class ErrorLogEntry {
  constructor(error, category = ErrorCategory.UNKNOWN, severity = ErrorSeverity.ERROR, context = {}) {
    this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    this.timestamp = new Date().toISOString();
    this.message = error.message || String(error);
    this.stack = error.stack || null;
    this.category = category;
    this.severity = severity;
    this.context = context;
    this.url = typeof window !== 'undefined' ? window.location.href : 'background';
  }
}

/**
 * Log error to local storage
 * @param {Error|string} error
 * @param {string} category
 * @param {string} severity
 * @param {Object} context
 * @returns {Promise<ErrorLogEntry>}
 */
export async function logError(error, category = ErrorCategory.UNKNOWN, severity = ErrorSeverity.ERROR, context = {}) {
  const entry = new ErrorLogEntry(error, category, severity, context);
  
  try {
    const log = await getErrorLog();
    log.unshift(entry);
    
    // Keep log size manageable
    if (log.length > MAX_ERROR_LOG_SIZE) {
      log.length = MAX_ERROR_LOG_SIZE;
    }
    
    await setStorageValue(ERROR_LOG_KEY, log);
  } catch (e) {
    // If we can't log, at least output to console
    console.error('Failed to log error:', e);
  }
  
  // Always console log for debugging
  console.error(`[${category}/${severity}]`, error, context);
  
  return entry;
}

/**
 * Get error log
 * @returns {Promise<Array>}
 */
export async function getErrorLog() {
  try {
    const log = await getStorageValue(ERROR_LOG_KEY);
    return log || [];
  } catch (e) {
    return [];
  }
}

/**
 * Clear error log
 * @returns {Promise<void>}
 */
export async function clearErrorLog() {
  await setStorageValue(ERROR_LOG_KEY, []);
}

/**
 * Get user-friendly error message
 * @param {Error|string} error
 * @param {string} category
 * @returns {string}
 */
export function getUserFriendlyMessage(error, category = ErrorCategory.UNKNOWN) {
  const errorString = error.message || String(error);
  
  // Check for known error patterns
  if (errorString.includes('quota') || errorString.includes('QuotaExceeded')) {
    return USER_FRIENDLY_MESSAGES.storage_quota_exceeded;
  }
  if (errorString.includes('permission') || errorString.includes('denied')) {
    if (category === ErrorCategory.STORAGE) {
      return USER_FRIENDLY_MESSAGES.storage_access_denied;
    }
    return USER_FRIENDLY_MESSAGES.tracking_permission_denied;
  }
  if (errorString.includes('offline') || errorString.includes('network')) {
    return USER_FRIENDLY_MESSAGES.network_offline;
  }
  if (errorString.includes('timeout')) {
    return USER_FRIENDLY_MESSAGES.network_timeout;
  }
  if (category === ErrorCategory.AI) {
    if (errorString.includes('loading')) {
      return USER_FRIENDLY_MESSAGES.ai_model_loading;
    }
    return USER_FRIENDLY_MESSAGES.ai_model_failed;
  }
  
  return USER_FRIENDLY_MESSAGES.unknown_error;
}

/**
 * Handle error with retry mechanism
 * @param {Function} operation
 * @param {Object} options
 * @returns {Promise<any>}
 */
export async function withRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    onRetry = null,
    category = ErrorCategory.UNKNOWN
  } = options;
  
  let lastError;
  let currentDelay = delay;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt + 1, maxRetries, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoff;
      }
    }
  }
  
  // Log the final error
  await logError(lastError, category, ErrorSeverity.ERROR, { maxRetries, operation: operation.name });
  throw lastError;
}

/**
 * Create an error boundary for async operations
 * @param {Function} operation
 * @param {any} fallback
 * @param {Object} options
 * @returns {Promise<any>}
 */
export async function withErrorBoundary(operation, fallback = null, options = {}) {
  const { category = ErrorCategory.UNKNOWN, silent = false } = options;
  
  try {
    return await operation();
  } catch (error) {
    if (!silent) {
      await logError(error, category, ErrorSeverity.ERROR);
    }
    return typeof fallback === 'function' ? fallback(error) : fallback;
  }
}

/**
 * Check if we're offline
 * @returns {boolean}
 */
export function isOffline() {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

/**
 * Create error toast data (for UI to display)
 * @param {Error|string} error
 * @param {string} category
 * @returns {Object}
 */
export function createErrorToast(error, category = ErrorCategory.UNKNOWN) {
  return {
    id: Date.now().toString(36),
    message: getUserFriendlyMessage(error, category),
    type: 'error',
    category,
    timestamp: Date.now(),
    dismissible: true,
    duration: 5000
  };
}

/**
 * Create success toast data
 * @param {string} message
 * @returns {Object}
 */
export function createSuccessToast(message) {
  return {
    id: Date.now().toString(36),
    message,
    type: 'success',
    timestamp: Date.now(),
    dismissible: true,
    duration: 3000
  };
}

/**
 * Create info toast data
 * @param {string} message
 * @returns {Object}
 */
export function createInfoToast(message) {
  return {
    id: Date.now().toString(36),
    message,
    type: 'info',
    timestamp: Date.now(),
    dismissible: true,
    duration: 4000
  };
}

