// Goal setting and progress tracking system
import { getStorageValue, setStorageValue, getTimeData } from './storage.js';

const GOALS_KEY = 'userGoals';

/**
 * Goal types
 */
export const GoalType = {
  DAILY_LIMIT: 'daily_limit',      // Max time per day across all sites
  SITE_LIMIT: 'site_limit',        // Max time per day on specific site
  WEEKLY_LIMIT: 'weekly_limit',    // Max time per week
  REDUCTION: 'reduction',          // Reduce time by X% from previous period
  STREAK: 'streak'                 // Maintain limit for X consecutive days
};

/**
 * Default goals configuration
 */
const DEFAULT_GOALS = {
  enabled: true,
  goals: [],
  history: [],
  streaks: {},
  achievements: []
};

/**
 * Get goals configuration
 * @returns {Promise<Object>}
 */
export async function getGoals() {
  const goals = await getStorageValue(GOALS_KEY);
  return goals || { ...DEFAULT_GOALS };
}

/**
 * Save goals configuration
 * @param {Object} goals
 * @returns {Promise<void>}
 */
export async function saveGoals(goals) {
  return setStorageValue(GOALS_KEY, goals);
}

/**
 * Add a new goal
 * @param {Object} goal
 * @returns {Promise<Object>}
 */
export async function addGoal(goal) {
  const goals = await getGoals();
  
  const newGoal = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    type: goal.type || GoalType.DAILY_LIMIT,
    target: goal.target || 60, // Minutes
    domain: goal.domain || null, // null = all tracked sites
    name: goal.name || 'Daily Limit',
    enabled: true,
    createdAt: new Date().toISOString(),
    notifyAt: goal.notifyAt || [50, 80, 100], // Percentages to notify at
    ...goal
  };
  
  goals.goals.push(newGoal);
  await saveGoals(goals);
  
  return newGoal;
}

/**
 * Update an existing goal
 * @param {string} goalId
 * @param {Object} updates
 * @returns {Promise<Object|null>}
 */
export async function updateGoal(goalId, updates) {
  const goals = await getGoals();
  const index = goals.goals.findIndex(g => g.id === goalId);
  
  if (index === -1) return null;
  
  goals.goals[index] = { ...goals.goals[index], ...updates };
  await saveGoals(goals);
  
  return goals.goals[index];
}

/**
 * Delete a goal
 * @param {string} goalId
 * @returns {Promise<boolean>}
 */
export async function deleteGoal(goalId) {
  const goals = await getGoals();
  const initialLength = goals.goals.length;
  goals.goals = goals.goals.filter(g => g.id !== goalId);
  
  if (goals.goals.length !== initialLength) {
    await saveGoals(goals);
    return true;
  }
  return false;
}

/**
 * Get progress for a specific goal
 * @param {Object} goal
 * @returns {Promise<Object>}
 */
export async function getGoalProgress(goal) {
  const timeData = await getTimeData();
  const today = new Date().toISOString().split('T')[0];
  const todayData = timeData[today] || {};
  
  let currentTime = 0;
  
  if (goal.type === GoalType.DAILY_LIMIT || goal.type === GoalType.REDUCTION) {
    // Sum all tracked time for today
    if (goal.domain) {
      currentTime = todayData[goal.domain] || 0;
    } else {
      currentTime = Object.values(todayData).reduce((sum, time) => sum + time, 0);
    }
  } else if (goal.type === GoalType.SITE_LIMIT) {
    currentTime = todayData[goal.domain] || 0;
  } else if (goal.type === GoalType.WEEKLY_LIMIT) {
    // Sum last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    for (const dateKey in timeData) {
      if (new Date(dateKey) >= weekAgo) {
        const dayData = timeData[dateKey];
        if (goal.domain) {
          currentTime += dayData[goal.domain] || 0;
        } else {
          currentTime += Object.values(dayData).reduce((sum, time) => sum + time, 0);
        }
      }
    }
  }
  
  const targetMs = goal.target * 60 * 1000; // Convert minutes to ms
  const percentage = Math.min(100, (currentTime / targetMs) * 100);
  const remaining = Math.max(0, targetMs - currentTime);
  const exceeded = currentTime > targetMs;
  
  return {
    goalId: goal.id,
    goalName: goal.name,
    currentTime,
    targetTime: targetMs,
    percentage: Math.round(percentage * 10) / 10,
    remaining,
    exceeded,
    formatted: {
      current: formatDuration(currentTime),
      target: formatDuration(targetMs),
      remaining: formatDuration(remaining)
    }
  };
}

/**
 * Get progress for all active goals
 * @returns {Promise<Array>}
 */
export async function getAllGoalProgress() {
  const goals = await getGoals();
  const progress = [];
  
  for (const goal of goals.goals) {
    if (goal.enabled) {
      progress.push(await getGoalProgress(goal));
    }
  }
  
  return progress;
}

/**
 * Check if any goals have been met/exceeded
 * @returns {Promise<Array>}
 */
export async function checkGoalNotifications() {
  const goals = await getGoals();
  const notifications = [];
  
  for (const goal of goals.goals) {
    if (!goal.enabled) continue;
    
    const progress = await getGoalProgress(goal);
    const notifyAt = goal.notifyAt || [50, 80, 100];
    
    // Check if we need to notify at any threshold
    for (const threshold of notifyAt) {
      const notificationKey = `${goal.id}_${threshold}_${new Date().toISOString().split('T')[0]}`;
      const alreadyNotified = goals.history.includes(notificationKey);
      
      if (!alreadyNotified && progress.percentage >= threshold) {
        notifications.push({
          goalId: goal.id,
          goalName: goal.name,
          threshold,
          progress: progress.percentage,
          exceeded: progress.exceeded,
          message: getGoalNotificationMessage(goal, progress, threshold)
        });
        
        // Mark as notified
        goals.history.push(notificationKey);
      }
    }
  }
  
  // Clean old history entries (keep last 100)
  if (goals.history.length > 100) {
    goals.history = goals.history.slice(-100);
  }
  
  await saveGoals(goals);
  return notifications;
}

/**
 * Get notification message for goal progress
 * @param {Object} goal
 * @param {Object} progress
 * @param {number} threshold
 * @returns {string}
 */
function getGoalNotificationMessage(goal, progress, threshold) {
  if (threshold === 100 && progress.exceeded) {
    return `You've exceeded your ${goal.name} goal! Time to take a break.`;
  } else if (threshold === 100) {
    return `You've reached your ${goal.name} limit of ${goal.target} minutes.`;
  } else if (threshold >= 80) {
    return `Warning: You're at ${Math.round(progress.percentage)}% of your ${goal.name} limit.`;
  } else {
    return `Heads up: You've used ${Math.round(progress.percentage)}% of your ${goal.name} limit.`;
  }
}

/**
 * Update streak for a goal
 * @param {string} goalId
 * @param {boolean} metGoal
 * @returns {Promise<number>}
 */
export async function updateStreak(goalId, metGoal) {
  const goals = await getGoals();
  const today = new Date().toISOString().split('T')[0];
  
  if (!goals.streaks[goalId]) {
    goals.streaks[goalId] = {
      current: 0,
      best: 0,
      lastUpdated: null
    };
  }
  
  const streak = goals.streaks[goalId];
  
  // Only update once per day
  if (streak.lastUpdated === today) {
    return streak.current;
  }
  
  if (metGoal) {
    streak.current++;
    streak.best = Math.max(streak.best, streak.current);
  } else {
    streak.current = 0;
  }
  
  streak.lastUpdated = today;
  await saveGoals(goals);
  
  return streak.current;
}

/**
 * Get streak for a goal
 * @param {string} goalId
 * @returns {Promise<Object>}
 */
export async function getStreak(goalId) {
  const goals = await getGoals();
  return goals.streaks[goalId] || { current: 0, best: 0, lastUpdated: null };
}

/**
 * Add an achievement
 * @param {Object} achievement
 * @returns {Promise<void>}
 */
export async function addAchievement(achievement) {
  const goals = await getGoals();
  
  // Check if achievement already exists
  if (!goals.achievements.find(a => a.id === achievement.id)) {
    goals.achievements.push({
      ...achievement,
      earnedAt: new Date().toISOString()
    });
    await saveGoals(goals);
  }
}

/**
 * Get all achievements
 * @returns {Promise<Array>}
 */
export async function getAchievements() {
  const goals = await getGoals();
  return goals.achievements || [];
}

/**
 * Format duration in milliseconds to human readable string
 * @param {number} ms
 * @returns {string}
 */
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

/**
 * Get default goals for new users
 * @returns {Array}
 */
export function getDefaultGoalSuggestions() {
  return [
    {
      type: GoalType.DAILY_LIMIT,
      target: 60,
      name: 'Daily Distraction Limit',
      description: 'Limit total distraction time to 1 hour per day'
    },
    {
      type: GoalType.SITE_LIMIT,
      target: 30,
      name: 'Social Media Limit',
      description: 'Limit time on any single site to 30 minutes'
    },
    {
      type: GoalType.WEEKLY_LIMIT,
      target: 300,
      name: 'Weekly Goal',
      description: 'Keep total weekly distraction time under 5 hours'
    }
  ];
}

