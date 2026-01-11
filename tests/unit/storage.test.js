// Unit tests for storage utilities
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock browser API
const mockStorage = {
  local: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn()
  }
};

global.chrome = {
  storage: mockStorage,
  runtime: {
    lastError: null
  }
};

describe('Storage Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStorageValue', () => {
    it('should return null for non-existent keys', async () => {
      mockStorage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      // Import after mocks are set up
      const { getStorageValue } = await import('../../src/utils/storage.js');
      const result = await getStorageValue('nonExistentKey');
      
      expect(result).toBeNull();
      expect(mockStorage.local.get).toHaveBeenCalledWith('nonExistentKey', expect.any(Function));
    });

    it('should return stored value for existing keys', async () => {
      const testValue = { test: 'data' };
      mockStorage.local.get.mockImplementation((keys, callback) => {
        callback({ testKey: testValue });
      });

      const { getStorageValue } = await import('../../src/utils/storage.js');
      const result = await getStorageValue('testKey');
      
      expect(result).toEqual(testValue);
    });
  });

  describe('setStorageValue', () => {
    it('should store value correctly', async () => {
      mockStorage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      const { setStorageValue } = await import('../../src/utils/storage.js');
      await setStorageValue('testKey', { value: 123 });
      
      expect(mockStorage.local.set).toHaveBeenCalledWith(
        { testKey: { value: 123 } },
        expect.any(Function)
      );
    });
  });
});

describe('Config Management', () => {
  it('should return default config when none exists', async () => {
    mockStorage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    const { getConfig } = await import('../../src/utils/storage.js');
    const { DEFAULT_CONFIG } = await import('../../src/utils/config.js');
    
    const config = await getConfig();
    
    expect(config).toEqual(expect.objectContaining({
      popupEnabled: expect.any(Boolean)
    }));
  });
});

describe('Time Data Management', () => {
  it('should return empty object when no time data exists', async () => {
    mockStorage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    const { getTimeData } = await import('../../src/utils/storage.js');
    const timeData = await getTimeData();
    
    expect(timeData).toEqual({});
  });

  it('should save time data correctly', async () => {
    mockStorage.local.set.mockImplementation((data, callback) => {
      callback();
    });

    const { saveTimeData } = await import('../../src/utils/storage.js');
    const testData = {
      '2026-01-12': {
        'youtube.com': 60000
      }
    };
    
    await saveTimeData(testData);
    
    expect(mockStorage.local.set).toHaveBeenCalled();
  });
});

