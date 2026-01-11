// Unit tests for site matcher utilities
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock browser API
const mockStorage = {
  local: {
    get: vi.fn(),
    set: vi.fn()
  }
};

const mockFetch = vi.fn();

global.chrome = {
  storage: mockStorage,
  runtime: {
    lastError: null,
    getURL: vi.fn((path) => `chrome-extension://test/${path}`)
  }
};

global.fetch = mockFetch;

describe('Site Matcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock default sites fetch
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve([
        { domain: 'youtube.com', name: 'YouTube', enabled: true },
        { domain: 'twitter.com', name: 'Twitter', enabled: true },
        { domain: 'facebook.com', name: 'Facebook', enabled: false }
      ])
    });
    
    // Mock user sites
    mockStorage.local.get.mockImplementation((keys, callback) => {
      callback({ userSites: ['reddit.com', 'instagram.com'] });
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from URL', async () => {
      const { extractDomain } = await import('../../src/utils/site-matcher.js');
      
      expect(extractDomain('https://www.youtube.com/watch?v=123')).toBe('youtube.com');
      expect(extractDomain('https://twitter.com/user')).toBe('twitter.com');
      expect(extractDomain('http://subdomain.example.com/path')).toBe('subdomain.example.com');
    });

    it('should handle invalid URLs gracefully', async () => {
      const { extractDomain } = await import('../../src/utils/site-matcher.js');
      
      expect(extractDomain('not-a-url')).toBeNull();
      expect(extractDomain('')).toBeNull();
      expect(extractDomain(null)).toBeNull();
    });
  });

  describe('matchesPattern', () => {
    it('should match exact domains', async () => {
      const { matchesPattern } = await import('../../src/utils/site-matcher.js');
      
      expect(matchesPattern('youtube.com', 'youtube.com')).toBe(true);
      expect(matchesPattern('youtube.com', 'twitter.com')).toBe(false);
    });

    it('should match subdomains with wildcard', async () => {
      const { matchesPattern } = await import('../../src/utils/site-matcher.js');
      
      expect(matchesPattern('www.youtube.com', '*.youtube.com')).toBe(true);
      expect(matchesPattern('m.youtube.com', '*.youtube.com')).toBe(true);
      expect(matchesPattern('youtube.com', '*.youtube.com')).toBe(false);
    });
  });

  describe('isTrackedSite', () => {
    it('should return true for enabled default sites', async () => {
      const { refreshSites, isTrackedSite } = await import('../../src/utils/site-matcher.js');
      
      await refreshSites();
      const result = await isTrackedSite('https://www.youtube.com/');
      
      expect(result).not.toBeNull();
    });

    it('should return true for user-added sites', async () => {
      const { refreshSites, isTrackedSite } = await import('../../src/utils/site-matcher.js');
      
      await refreshSites();
      const result = await isTrackedSite('https://reddit.com/r/test');
      
      expect(result).not.toBeNull();
    });

    it('should return null for disabled sites', async () => {
      const { refreshSites, isTrackedSite } = await import('../../src/utils/site-matcher.js');
      
      await refreshSites();
      const result = await isTrackedSite('https://facebook.com/');
      
      expect(result).toBeNull();
    });

    it('should return null for non-tracked sites', async () => {
      const { refreshSites, isTrackedSite } = await import('../../src/utils/site-matcher.js');
      
      await refreshSites();
      const result = await isTrackedSite('https://google.com/');
      
      expect(result).toBeNull();
    });
  });
});

