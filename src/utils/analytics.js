// Enhanced analytics system
import { getTimeData } from './storage.js';

/**
 * Time period types
 */
export const TimePeriod = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  LAST_30_DAYS: 'last_30_days',
  LAST_90_DAYS: 'last_90_days',
  THIS_YEAR: 'this_year',
  ALL_TIME: 'all_time',
  CUSTOM: 'custom'
};

/**
 * Get date range for a period
 * @param {string} period
 * @param {Date} customStart
 * @param {Date} customEnd
 * @returns {Object}
 */
export function getDateRange(period, customStart = null, customEnd = null) {
  const now = new Date();
  let start, end;
  
  switch (period) {
    case TimePeriod.TODAY:
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      break;
      
    case TimePeriod.YESTERDAY:
      start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      break;
      
    case TimePeriod.THIS_WEEK:
      start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      break;
      
    case TimePeriod.LAST_WEEK:
      start = new Date(now);
      start.setDate(start.getDate() - start.getDay() - 7);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
      
    case TimePeriod.THIS_MONTH:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now);
      break;
      
    case TimePeriod.LAST_MONTH:
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
      
    case TimePeriod.LAST_30_DAYS:
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      break;
      
    case TimePeriod.LAST_90_DAYS:
      start = new Date(now);
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      break;
      
    case TimePeriod.THIS_YEAR:
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now);
      break;
      
    case TimePeriod.ALL_TIME:
      start = new Date(0);
      end = new Date(now);
      break;
      
    case TimePeriod.CUSTOM:
      start = customStart || new Date(now);
      end = customEnd || new Date(now);
      break;
      
    default:
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
  }
  
  return { start, end };
}

/**
 * Get analytics for a time period
 * @param {string} period
 * @param {Date} customStart
 * @param {Date} customEnd
 * @returns {Promise<Object>}
 */
export async function getAnalytics(period = TimePeriod.TODAY, customStart = null, customEnd = null) {
  const timeData = await getTimeData();
  const { start, end } = getDateRange(period, customStart, customEnd);
  
  const startKey = start.toISOString().split('T')[0];
  const endKey = end.toISOString().split('T')[0];
  
  // Collect data for the period
  const periodData = {};
  let totalTime = 0;
  let daysWithData = 0;
  const siteStats = {};
  const dailyTotals = [];
  
  for (const dateKey in timeData) {
    if (dateKey >= startKey && dateKey <= endKey) {
      const dayData = timeData[dateKey];
      let dayTotal = 0;
      
      for (const domain in dayData) {
        const time = dayData[domain];
        dayTotal += time;
        totalTime += time;
        
        if (!siteStats[domain]) {
          siteStats[domain] = { domain, totalTime: 0, visits: 0, days: [] };
        }
        siteStats[domain].totalTime += time;
        siteStats[domain].visits++;
        siteStats[domain].days.push(dateKey);
      }
      
      if (dayTotal > 0) {
        daysWithData++;
        dailyTotals.push({ date: dateKey, total: dayTotal });
      }
      
      periodData[dateKey] = dayData;
    }
  }
  
  // Calculate statistics
  const sites = Object.values(siteStats).sort((a, b) => b.totalTime - a.totalTime);
  const avgPerDay = daysWithData > 0 ? totalTime / daysWithData : 0;
  const avgPerSite = sites.length > 0 ? totalTime / sites.length : 0;
  
  // Find peak day
  const peakDay = dailyTotals.length > 0 
    ? dailyTotals.reduce((max, day) => day.total > max.total ? day : max, dailyTotals[0])
    : null;
  
  // Find lowest day
  const lowestDay = dailyTotals.length > 0
    ? dailyTotals.reduce((min, day) => day.total < min.total ? day : min, dailyTotals[0])
    : null;
  
  return {
    period,
    dateRange: { start: startKey, end: endKey },
    totalTime,
    daysWithData,
    totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
    avgPerDay,
    avgPerSite,
    siteCount: sites.length,
    topSites: sites.slice(0, 10),
    peakDay,
    lowestDay,
    dailyTotals,
    formatted: {
      totalTime: formatDuration(totalTime),
      avgPerDay: formatDuration(avgPerDay),
      avgPerSite: formatDuration(avgPerSite)
    }
  };
}

/**
 * Compare two time periods
 * @param {string} period1
 * @param {string} period2
 * @returns {Promise<Object>}
 */
export async function comparePeriods(period1, period2) {
  const analytics1 = await getAnalytics(period1);
  const analytics2 = await getAnalytics(period2);
  
  const timeDiff = analytics1.totalTime - analytics2.totalTime;
  const percentChange = analytics2.totalTime > 0 
    ? ((timeDiff / analytics2.totalTime) * 100)
    : (analytics1.totalTime > 0 ? 100 : 0);
  
  return {
    current: analytics1,
    previous: analytics2,
    comparison: {
      timeDiff,
      percentChange: Math.round(percentChange * 10) / 10,
      improved: timeDiff < 0,
      avgDiff: analytics1.avgPerDay - analytics2.avgPerDay,
      siteDiff: analytics1.siteCount - analytics2.siteCount
    }
  };
}

/**
 * Get trend analysis
 * @param {number} days
 * @returns {Promise<Object>}
 */
export async function getTrendAnalysis(days = 30) {
  const timeData = await getTimeData();
  const now = new Date();
  const trends = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    const dayData = timeData[dateKey] || {};
    const dayTotal = Object.values(dayData).reduce((sum, t) => sum + t, 0);
    
    trends.push({
      date: dateKey,
      dayOfWeek: date.getDay(),
      total: dayTotal,
      sites: Object.keys(dayData).length
    });
  }
  
  // Calculate moving average (7-day)
  const movingAvg = [];
  for (let i = 6; i < trends.length; i++) {
    const window = trends.slice(i - 6, i + 1);
    const avg = window.reduce((sum, d) => sum + d.total, 0) / 7;
    movingAvg.push({ date: trends[i].date, avg });
  }
  
  // Determine overall trend
  const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
  const secondHalf = trends.slice(Math.floor(trends.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.total, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.total, 0) / secondHalf.length;
  
  const trendDirection = secondAvg < firstAvg ? 'improving' : secondAvg > firstAvg ? 'worsening' : 'stable';
  const trendPercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  
  return {
    daily: trends,
    movingAverage: movingAvg,
    trend: {
      direction: trendDirection,
      percentChange: Math.round(trendPercent * 10) / 10,
      firstHalfAvg: firstAvg,
      secondHalfAvg: secondAvg
    }
  };
}

/**
 * Get time-of-day breakdown
 * @param {string} period
 * @returns {Promise<Object>}
 */
export async function getTimeOfDayBreakdown(period = TimePeriod.LAST_30_DAYS) {
  // This would require storing more granular time data
  // For now, return a placeholder structure
  return {
    hourly: Array(24).fill(0).map((_, i) => ({
      hour: i,
      label: `${i}:00`,
      totalTime: 0,
      avgTime: 0
    })),
    peakHours: [],
    note: 'Hourly tracking requires enabling detailed time tracking in settings.'
  };
}

/**
 * Get heatmap data for calendar view
 * @param {number} months
 * @returns {Promise<Object>}
 */
export async function getHeatmapData(months = 3) {
  const timeData = await getTimeData();
  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - months);
  
  const heatmap = [];
  const weeks = [];
  let currentWeek = [];
  
  const currentDate = new Date(startDate);
  // Start from Sunday
  currentDate.setDate(currentDate.getDate() - currentDate.getDay());
  
  while (currentDate <= now) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const dayData = timeData[dateKey] || {};
    const dayTotal = Object.values(dayData).reduce((sum, t) => sum + t, 0);
    
    const intensity = getIntensityLevel(dayTotal);
    
    currentWeek.push({
      date: dateKey,
      total: dayTotal,
      intensity,
      dayOfWeek: currentDate.getDay()
    });
    
    if (currentDate.getDay() === 6) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  
  return {
    weeks,
    months,
    startDate: startDate.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0]
  };
}

/**
 * Get intensity level for heatmap (0-4)
 * @param {number} timeMs
 * @returns {number}
 */
function getIntensityLevel(timeMs) {
  const minutes = timeMs / 60000;
  if (minutes === 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 60) return 3;
  return 4;
}

/**
 * Export analytics to CSV
 * @param {string} period
 * @returns {Promise<string>}
 */
export async function exportToCSV(period = TimePeriod.LAST_30_DAYS) {
  const analytics = await getAnalytics(period);
  const timeData = await getTimeData();
  const { start, end } = getDateRange(period);
  
  const startKey = start.toISOString().split('T')[0];
  const endKey = end.toISOString().split('T')[0];
  
  // Build CSV content
  let csv = 'Date,Domain,Time (minutes),Time (formatted)\n';
  
  for (const dateKey in timeData) {
    if (dateKey >= startKey && dateKey <= endKey) {
      const dayData = timeData[dateKey];
      for (const domain in dayData) {
        const minutes = Math.round(dayData[domain] / 60000);
        csv += `${dateKey},${domain},${minutes},"${formatDuration(dayData[domain])}"\n`;
      }
    }
  }
  
  return csv;
}

/**
 * Export analytics to JSON
 * @param {string} period
 * @returns {Promise<Object>}
 */
export async function exportToJSON(period = TimePeriod.LAST_30_DAYS) {
  const analytics = await getAnalytics(period);
  const trend = await getTrendAnalysis(30);
  
  return {
    exportDate: new Date().toISOString(),
    period,
    analytics,
    trend,
    version: '1.0'
  };
}

/**
 * Format duration in milliseconds to human readable string
 * @param {number} ms
 * @returns {string}
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Get site insights
 * @param {string} domain
 * @returns {Promise<Object>}
 */
export async function getSiteInsights(domain) {
  const timeData = await getTimeData();
  const dailyData = [];
  let totalTime = 0;
  let visitDays = 0;
  let firstVisit = null;
  let lastVisit = null;
  
  for (const dateKey in timeData) {
    if (timeData[dateKey][domain]) {
      const time = timeData[dateKey][domain];
      totalTime += time;
      visitDays++;
      dailyData.push({ date: dateKey, time });
      
      if (!firstVisit || dateKey < firstVisit) firstVisit = dateKey;
      if (!lastVisit || dateKey > lastVisit) lastVisit = dateKey;
    }
  }
  
  const avgPerVisit = visitDays > 0 ? totalTime / visitDays : 0;
  
  return {
    domain,
    totalTime,
    visitDays,
    avgPerVisit,
    firstVisit,
    lastVisit,
    dailyData,
    formatted: {
      totalTime: formatDuration(totalTime),
      avgPerVisit: formatDuration(avgPerVisit)
    }
  };
}

