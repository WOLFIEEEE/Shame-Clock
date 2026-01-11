// Unit tests for goals system
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock storage
const mockStorage = {};
const mockStorageGet = vi.fn((key) => Promise.resolve(mockStorage[key]));
const mockStorageSet = vi.fn((key, value) => {
  mockStorage[key] = value;
  return Promise.resolve();
});

vi.mock('../../src/utils/storage.js', () => ({
  getStorageValue: mockStorageGet,
  setStorageValue: mockStorageSet,
  getTimeData: vi.fn(() => Promise.resolve({
    '2026-01-12': {
      'youtube.com': 30 * 60 * 1000, // 30 minutes
      'twitter.com': 15 * 60 * 1000  // 15 minutes
    }
  }))
}));

describe('Goals System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  });

  describe('GoalType', () => {
    it('should export correct goal types', async () => {
      const { GoalType } = await import('../../src/utils/goals.js');
      
      expect(GoalType.DAILY_LIMIT).toBe('daily_limit');
      expect(GoalType.SITE_LIMIT).toBe('site_limit');
      expect(GoalType.WEEKLY_LIMIT).toBe('weekly_limit');
    });
  });

  describe('addGoal', () => {
    it('should add a new goal with correct structure', async () => {
      mockStorageGet.mockResolvedValueOnce(null);
      
      const { addGoal, GoalType } = await import('../../src/utils/goals.js');
      
      const goal = await addGoal({
        type: GoalType.DAILY_LIMIT,
        target: 60,
        name: 'Test Goal'
      });
      
      expect(goal).toMatchObject({
        type: GoalType.DAILY_LIMIT,
        target: 60,
        name: 'Test Goal',
        enabled: true
      });
      expect(goal.id).toBeDefined();
      expect(goal.createdAt).toBeDefined();
    });
  });

  describe('getGoalProgress', () => {
    it('should calculate progress correctly for daily limit', async () => {
      mockStorageGet.mockResolvedValueOnce({
        enabled: true,
        goals: [{
          id: 'test1',
          type: 'daily_limit',
          target: 60, // 60 minutes
          name: 'Daily Limit',
          enabled: true,
          domain: null
        }]
      });
      
      const { getGoalProgress } = await import('../../src/utils/goals.js');
      
      const progress = await getGoalProgress({
        id: 'test1',
        type: 'daily_limit',
        target: 60,
        domain: null
      });
      
      // 45 minutes total (30 + 15) out of 60 = 75%
      expect(progress.percentage).toBe(75);
      expect(progress.exceeded).toBe(false);
    });

    it('should show exceeded when over limit', async () => {
      const { getGoalProgress } = await import('../../src/utils/goals.js');
      
      const progress = await getGoalProgress({
        id: 'test2',
        type: 'daily_limit',
        target: 30, // 30 minutes
        domain: null
      });
      
      // 45 minutes total out of 30 = 150%
      expect(progress.percentage).toBeGreaterThan(100);
      expect(progress.exceeded).toBe(true);
    });

    it('should calculate site-specific progress', async () => {
      const { getGoalProgress } = await import('../../src/utils/goals.js');
      
      const progress = await getGoalProgress({
        id: 'test3',
        type: 'site_limit',
        target: 60, // 60 minutes
        domain: 'youtube.com'
      });
      
      // 30 minutes on YouTube out of 60 = 50%
      expect(progress.percentage).toBe(50);
      expect(progress.exceeded).toBe(false);
    });
  });
});

