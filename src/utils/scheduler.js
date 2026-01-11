// Advanced scheduling system
import { getStorageValue, setStorageValue } from './storage.js';

const SCHEDULER_KEY = 'schedulerConfig';

/**
 * Schedule types
 */
export const ScheduleType = {
  QUIET_HOURS: 'quiet_hours',      // No popups during these hours
  WORK_HOURS: 'work_hours',        // Different thresholds during work
  BLOCKED_DAYS: 'blocked_days',    // Days with no tracking
  CUSTOM: 'custom'                 // Custom schedules
};

/**
 * Days of week
 */
export const DaysOfWeek = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};

/**
 * Default scheduler configuration
 */
const DEFAULT_SCHEDULER_CONFIG = {
  enabled: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  schedules: [],
  quickSettings: {
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    workHoursEnabled: false,
    workHoursStart: '09:00',
    workHoursEnd: '17:00',
    workDays: [1, 2, 3, 4, 5], // Mon-Fri
    weekendMode: false,
    weekendMultiplier: 1.5 // More lenient on weekends
  }
};

/**
 * Get scheduler configuration
 * @returns {Promise<Object>}
 */
export async function getSchedulerConfig() {
  const config = await getStorageValue(SCHEDULER_KEY);
  return config || { ...DEFAULT_SCHEDULER_CONFIG };
}

/**
 * Save scheduler configuration
 * @param {Object} config
 * @returns {Promise<void>}
 */
export async function saveSchedulerConfig(config) {
  return setStorageValue(SCHEDULER_KEY, config);
}

/**
 * Add a new schedule
 * @param {Object} schedule
 * @returns {Promise<Object>}
 */
export async function addSchedule(schedule) {
  const config = await getSchedulerConfig();
  
  const newSchedule = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    type: schedule.type || ScheduleType.CUSTOM,
    name: schedule.name || 'Custom Schedule',
    enabled: true,
    startTime: schedule.startTime || '09:00',
    endTime: schedule.endTime || '17:00',
    days: schedule.days || [1, 2, 3, 4, 5],
    action: schedule.action || 'disable_popups', // or 'adjust_threshold', 'block_tracking'
    thresholdMultiplier: schedule.thresholdMultiplier || 1,
    createdAt: new Date().toISOString(),
    ...schedule
  };
  
  config.schedules.push(newSchedule);
  await saveSchedulerConfig(config);
  
  return newSchedule;
}

/**
 * Update a schedule
 * @param {string} scheduleId
 * @param {Object} updates
 * @returns {Promise<Object|null>}
 */
export async function updateSchedule(scheduleId, updates) {
  const config = await getSchedulerConfig();
  const index = config.schedules.findIndex(s => s.id === scheduleId);
  
  if (index === -1) return null;
  
  config.schedules[index] = { ...config.schedules[index], ...updates };
  await saveSchedulerConfig(config);
  
  return config.schedules[index];
}

/**
 * Delete a schedule
 * @param {string} scheduleId
 * @returns {Promise<boolean>}
 */
export async function deleteSchedule(scheduleId) {
  const config = await getSchedulerConfig();
  const initialLength = config.schedules.length;
  config.schedules = config.schedules.filter(s => s.id !== scheduleId);
  
  if (config.schedules.length !== initialLength) {
    await saveSchedulerConfig(config);
    return true;
  }
  return false;
}

/**
 * Check if current time is within quiet hours
 * @returns {Promise<boolean>}
 */
export async function isQuietHours() {
  const config = await getSchedulerConfig();
  
  if (!config.enabled || !config.quickSettings.quietHoursEnabled) {
    return false;
  }
  
  return isWithinTimeRange(
    config.quickSettings.quietHoursStart,
    config.quickSettings.quietHoursEnd
  );
}

/**
 * Check if current time is within work hours
 * @returns {Promise<boolean>}
 */
export async function isWorkHours() {
  const config = await getSchedulerConfig();
  
  if (!config.enabled || !config.quickSettings.workHoursEnabled) {
    return false;
  }
  
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Check if it's a work day
  if (!config.quickSettings.workDays.includes(dayOfWeek)) {
    return false;
  }
  
  return isWithinTimeRange(
    config.quickSettings.workHoursStart,
    config.quickSettings.workHoursEnd
  );
}

/**
 * Check if today is a weekend
 * @returns {boolean}
 */
export function isWeekend() {
  const dayOfWeek = new Date().getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Get current threshold multiplier based on schedules
 * @returns {Promise<number>}
 */
export async function getCurrentThresholdMultiplier() {
  const config = await getSchedulerConfig();
  
  if (!config.enabled) {
    return 1;
  }
  
  let multiplier = 1;
  
  // Check weekend mode
  if (config.quickSettings.weekendMode && isWeekend()) {
    multiplier *= config.quickSettings.weekendMultiplier;
  }
  
  // Check work hours (stricter)
  if (await isWorkHours()) {
    multiplier *= 0.5; // More strict during work hours
  }
  
  // Check custom schedules
  for (const schedule of config.schedules) {
    if (schedule.enabled && await isScheduleActive(schedule)) {
      if (schedule.action === 'adjust_threshold') {
        multiplier *= schedule.thresholdMultiplier;
      }
    }
  }
  
  return multiplier;
}

/**
 * Check if popups should be suppressed
 * @returns {Promise<boolean>}
 */
export async function shouldSuppressPopups() {
  const config = await getSchedulerConfig();
  
  if (!config.enabled) {
    return false;
  }
  
  // Check quiet hours
  if (await isQuietHours()) {
    return true;
  }
  
  // Check custom schedules with disable_popups action
  for (const schedule of config.schedules) {
    if (schedule.enabled && schedule.action === 'disable_popups') {
      if (await isScheduleActive(schedule)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if tracking should be blocked
 * @returns {Promise<boolean>}
 */
export async function shouldBlockTracking() {
  const config = await getSchedulerConfig();
  
  if (!config.enabled) {
    return false;
  }
  
  // Check custom schedules with block_tracking action
  for (const schedule of config.schedules) {
    if (schedule.enabled && schedule.action === 'block_tracking') {
      if (await isScheduleActive(schedule)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if a schedule is currently active
 * @param {Object} schedule
 * @returns {Promise<boolean>}
 */
export async function isScheduleActive(schedule) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Check if today is in the schedule's days
  if (!schedule.days.includes(dayOfWeek)) {
    return false;
  }
  
  // Check if current time is within the schedule's time range
  return isWithinTimeRange(schedule.startTime, schedule.endTime);
}

/**
 * Check if current time is within a time range
 * @param {string} startTime - Format: "HH:MM"
 * @param {string} endTime - Format: "HH:MM"
 * @returns {boolean}
 */
function isWithinTimeRange(startTime, endTime) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Handle overnight ranges (e.g., 22:00 to 08:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Get next schedule change time
 * @returns {Promise<Object|null>}
 */
export async function getNextScheduleChange() {
  const config = await getSchedulerConfig();
  const now = new Date();
  let nextChange = null;
  let nextAction = null;
  
  // Check quiet hours
  if (config.quickSettings.quietHoursEnabled) {
    const quietStart = getNextOccurrence(config.quickSettings.quietHoursStart);
    const quietEnd = getNextOccurrence(config.quickSettings.quietHoursEnd);
    
    if (!nextChange || quietStart < nextChange) {
      nextChange = quietStart;
      nextAction = await isQuietHours() ? 'quiet_hours_end' : 'quiet_hours_start';
    }
  }
  
  return nextChange ? { time: nextChange, action: nextAction } : null;
}

/**
 * Get next occurrence of a time
 * @param {string} timeStr - Format: "HH:MM"
 * @returns {Date}
 */
function getNextOccurrence(timeStr) {
  const [hour, min] = timeStr.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  
  next.setHours(hour, min, 0, 0);
  
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}

/**
 * Update quick settings
 * @param {Object} quickSettings
 * @returns {Promise<void>}
 */
export async function updateQuickSettings(quickSettings) {
  const config = await getSchedulerConfig();
  config.quickSettings = { ...config.quickSettings, ...quickSettings };
  await saveSchedulerConfig(config);
}

/**
 * Get schedule summary for display
 * @returns {Promise<Object>}
 */
export async function getScheduleSummary() {
  const config = await getSchedulerConfig();
  
  return {
    enabled: config.enabled,
    quietHoursActive: await isQuietHours(),
    workHoursActive: await isWorkHours(),
    isWeekend: isWeekend(),
    currentMultiplier: await getCurrentThresholdMultiplier(),
    popupsSuppressed: await shouldSuppressPopups(),
    trackingBlocked: await shouldBlockTracking(),
    activeSchedules: config.schedules.filter(s => s.enabled).length,
    totalSchedules: config.schedules.length
  };
}

