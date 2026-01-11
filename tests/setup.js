// Test setup file
import { vi } from 'vitest';

// Mock browser APIs
global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys, callback) => callback({})),
      set: vi.fn((data, callback) => callback && callback()),
      remove: vi.fn((keys, callback) => callback && callback()),
      clear: vi.fn((callback) => callback && callback())
    }
  },
  runtime: {
    lastError: null,
    getURL: vi.fn((path) => `chrome-extension://test-id/${path}`),
    sendMessage: vi.fn((message, callback) => callback && callback({})),
    onMessage: {
      addListener: vi.fn()
    },
    openOptionsPage: vi.fn()
  },
  tabs: {
    query: vi.fn((query, callback) => callback && callback([])),
    sendMessage: vi.fn((tabId, message, callback) => callback && callback({}))
  },
  notifications: {
    create: vi.fn((options, callback) => callback && callback('test-notification-id')),
    clear: vi.fn(),
    onButtonClicked: {
      addListener: vi.fn()
    },
    getPermissionLevel: vi.fn((callback) => callback && callback('granted'))
  }
};

// Mock browser API for Firefox compatibility
global.browser = global.chrome;

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([])
  })
);

// Mock URL
global.URL = class URL {
  constructor(url) {
    try {
      const parsed = new (require('url').URL)(url);
      this.hostname = parsed.hostname;
      this.pathname = parsed.pathname;
      this.search = parsed.search;
      this.href = parsed.href;
    } catch (e) {
      throw new Error('Invalid URL');
    }
  }
};

// Mock requestIdleCallback
global.requestIdleCallback = vi.fn((callback) => {
  setTimeout(callback, 0);
  return 1;
});

// Mock performance
global.performance = {
  now: vi.fn(() => Date.now())
};

// Mock Intl
global.Intl = {
  DateTimeFormat: () => ({
    resolvedOptions: () => ({
      timeZone: 'America/New_York'
    }),
    format: (date) => date.toLocaleDateString()
  }),
  NumberFormat: (locale, options) => ({
    format: (num) => num.toString()
  })
};

// Console helpers
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

