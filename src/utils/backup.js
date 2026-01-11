// Backup and restore system
import { 
  getStorageValue, 
  setStorageValue, 
  getConfig, 
  saveConfig,
  getTimeData, 
  saveTimeData,
  getUserSites,
  saveUserSites,
  clearStorage
} from './storage.js';

const BACKUP_KEY = 'backupHistory';
const AUTO_BACKUP_KEY = 'lastAutoBackup';

/**
 * Backup metadata
 */
const BACKUP_VERSION = '1.0';

/**
 * Get backup history
 * @returns {Promise<Array>}
 */
export async function getBackupHistory() {
  const history = await getStorageValue(BACKUP_KEY);
  return history || [];
}

/**
 * Create a full backup
 * @param {string} name
 * @param {boolean} isAutomatic
 * @returns {Promise<Object>}
 */
export async function createBackup(name = '', isAutomatic = false) {
  const config = await getConfig();
  const timeData = await getTimeData();
  const userSites = await getUserSites();
  
  // Get all storage keys we care about
  const onboardingState = await getStorageValue('onboardingState');
  const goalsData = await getStorageValue('userGoals');
  const schedulerConfig = await getStorageValue('schedulerConfig');
  
  const backup = {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    name: name || `Backup ${new Date().toLocaleDateString()}`,
    isAutomatic,
    data: {
      config,
      timeData,
      userSites,
      onboardingState,
      goalsData,
      schedulerConfig
    },
    metadata: {
      totalTimeTracked: calculateTotalTime(timeData),
      sitesCount: userSites.length,
      daysTracked: Object.keys(timeData).length
    }
  };
  
  // Add to backup history
  const history = await getBackupHistory();
  const backupEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    name: backup.name,
    createdAt: backup.createdAt,
    isAutomatic,
    size: JSON.stringify(backup).length,
    metadata: backup.metadata
  };
  
  history.unshift(backupEntry);
  
  // Keep only last 10 backup entries in history
  if (history.length > 10) {
    history.length = 10;
  }
  
  await setStorageValue(BACKUP_KEY, history);
  
  if (isAutomatic) {
    await setStorageValue(AUTO_BACKUP_KEY, new Date().toISOString());
  }
  
  return { backup, entry: backupEntry };
}

/**
 * Export backup to file
 * @param {string} name
 * @returns {Promise<Blob>}
 */
export async function exportBackup(name = '') {
  const { backup } = await createBackup(name, false);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  return blob;
}

/**
 * Download backup file
 * @param {string} name
 */
export async function downloadBackup(name = '') {
  const blob = await exportBackup(name);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shame-clock-backup-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Restore from backup
 * @param {Object|string} backup - Backup object or JSON string
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function restoreBackup(backup, options = {}) {
  const {
    restoreConfig = true,
    restoreTimeData = true,
    restoreUserSites = true,
    restoreGoals = true,
    restoreScheduler = true,
    clearExisting = false
  } = options;
  
  // Parse if string
  if (typeof backup === 'string') {
    backup = JSON.parse(backup);
  }
  
  // Validate backup
  if (!backup.version || !backup.data) {
    throw new Error('Invalid backup file format');
  }
  
  const restored = {
    config: false,
    timeData: false,
    userSites: false,
    goals: false,
    scheduler: false
  };
  
  // Clear existing data if requested
  if (clearExisting) {
    await clearStorage();
  }
  
  // Restore config
  if (restoreConfig && backup.data.config) {
    await saveConfig(backup.data.config);
    restored.config = true;
  }
  
  // Restore time data
  if (restoreTimeData && backup.data.timeData) {
    if (clearExisting) {
      await saveTimeData(backup.data.timeData);
    } else {
      // Merge with existing data
      const existingData = await getTimeData();
      const mergedData = { ...backup.data.timeData, ...existingData };
      await saveTimeData(mergedData);
    }
    restored.timeData = true;
  }
  
  // Restore user sites
  if (restoreUserSites && backup.data.userSites) {
    if (clearExisting) {
      await saveUserSites(backup.data.userSites);
    } else {
      // Merge with existing sites
      const existingSites = await getUserSites();
      const mergedSites = [...new Set([...backup.data.userSites, ...existingSites])];
      await saveUserSites(mergedSites);
    }
    restored.userSites = true;
  }
  
  // Restore goals
  if (restoreGoals && backup.data.goalsData) {
    await setStorageValue('userGoals', backup.data.goalsData);
    restored.goals = true;
  }
  
  // Restore scheduler
  if (restoreScheduler && backup.data.schedulerConfig) {
    await setStorageValue('schedulerConfig', backup.data.schedulerConfig);
    restored.scheduler = true;
  }
  
  // Restore onboarding state
  if (backup.data.onboardingState) {
    await setStorageValue('onboardingState', backup.data.onboardingState);
  }
  
  return {
    success: true,
    restored,
    backupDate: backup.createdAt,
    backupName: backup.name
  };
}

/**
 * Import backup from file
 * @param {File} file
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function importBackupFromFile(file, options = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        const result = await restoreBackup(backup, options);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to import backup: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read backup file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Check if auto backup is needed
 * @returns {Promise<boolean>}
 */
export async function needsAutoBackup() {
  const lastBackup = await getStorageValue(AUTO_BACKUP_KEY);
  
  if (!lastBackup) {
    return true;
  }
  
  const lastBackupDate = new Date(lastBackup);
  const now = new Date();
  const daysSinceBackup = (now - lastBackupDate) / (1000 * 60 * 60 * 24);
  
  return daysSinceBackup >= 1; // Auto backup daily
}

/**
 * Perform auto backup if needed
 * @returns {Promise<Object|null>}
 */
export async function performAutoBackupIfNeeded() {
  if (await needsAutoBackup()) {
    return await createBackup('Auto Backup', true);
  }
  return null;
}

/**
 * Get backup preview (for displaying before restore)
 * @param {Object|string} backup
 * @returns {Object}
 */
export function getBackupPreview(backup) {
  if (typeof backup === 'string') {
    backup = JSON.parse(backup);
  }
  
  return {
    version: backup.version,
    createdAt: backup.createdAt,
    name: backup.name,
    metadata: backup.metadata,
    hasConfig: !!backup.data.config,
    hasTimeData: !!backup.data.timeData,
    hasUserSites: !!backup.data.userSites,
    hasGoals: !!backup.data.goalsData,
    hasScheduler: !!backup.data.schedulerConfig
  };
}

/**
 * Validate backup file
 * @param {Object|string} backup
 * @returns {Object}
 */
export function validateBackup(backup) {
  try {
    if (typeof backup === 'string') {
      backup = JSON.parse(backup);
    }
    
    const issues = [];
    
    if (!backup.version) {
      issues.push('Missing version information');
    }
    
    if (!backup.data) {
      issues.push('Missing data section');
    }
    
    if (!backup.createdAt) {
      issues.push('Missing creation date');
    }
    
    // Check for very old backups
    if (backup.version && backup.version !== BACKUP_VERSION) {
      issues.push(`Backup version ${backup.version} may not be fully compatible`);
    }
    
    return {
      valid: issues.length === 0,
      issues,
      backup: issues.length === 0 ? backup : null
    };
  } catch (error) {
    return {
      valid: false,
      issues: ['Invalid JSON format'],
      backup: null
    };
  }
}

/**
 * Calculate total time from time data
 * @param {Object} timeData
 * @returns {number}
 */
function calculateTotalTime(timeData) {
  let total = 0;
  for (const dateKey in timeData) {
    for (const domain in timeData[dateKey]) {
      total += timeData[dateKey][domain];
    }
  }
  return total;
}

/**
 * Export data for migration to another browser
 * @returns {Promise<Object>}
 */
export async function exportForMigration() {
  const { backup } = await createBackup('Migration Export', false);
  
  return {
    ...backup,
    migrationVersion: '1.0',
    exportedFrom: navigator.userAgent,
    instructions: 'Import this file in your new browser after installing Shame Clock'
  };
}

/**
 * Get selective export (by date range or sites)
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function selectiveExport(options = {}) {
  const { startDate, endDate, sites, includeConfig = true } = options;
  
  const timeData = await getTimeData();
  const filteredTimeData = {};
  
  for (const dateKey in timeData) {
    // Filter by date
    if (startDate && dateKey < startDate) continue;
    if (endDate && dateKey > endDate) continue;
    
    const dayData = timeData[dateKey];
    const filteredDayData = {};
    
    for (const domain in dayData) {
      // Filter by sites
      if (sites && sites.length > 0 && !sites.includes(domain)) continue;
      filteredDayData[domain] = dayData[domain];
    }
    
    if (Object.keys(filteredDayData).length > 0) {
      filteredTimeData[dateKey] = filteredDayData;
    }
  }
  
  const exportData = {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    name: 'Selective Export',
    filters: { startDate, endDate, sites },
    data: {
      timeData: filteredTimeData
    }
  };
  
  if (includeConfig) {
    exportData.data.config = await getConfig();
  }
  
  return exportData;
}

