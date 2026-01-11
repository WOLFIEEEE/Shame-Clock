// Performance optimization utilities
import { getStorageValue, setStorageValue } from './storage.js';

/**
 * Simple in-memory cache with TTL
 */
class MemoryCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  /**
   * Get cached value
   * @param {string} key
   * @returns {any|undefined}
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }
  
  /**
   * Set cached value
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = null) {
    // Evict oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      value,
      expires: ttl ? Date.now() + ttl : null,
      timestamp: Date.now()
    });
  }
  
  /**
   * Delete cached value
   * @param {string} key
   */
  delete(key) {
    this.cache.delete(key);
  }
  
  /**
   * Clear all cached values
   */
  clear() {
    this.cache.clear();
  }
  
  /**
   * Get cache size
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }
}

// Global cache instance
export const globalCache = new MemoryCache();

/**
 * Debounce function
 * @param {Function} func
 * @param {number} wait
 * @param {boolean} immediate
 * @returns {Function}
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout;
  
  return function executedFunction(...args) {
    const context = this;
    
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(context, args);
  };
}

/**
 * Throttle function
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  
  return function executedFunction(...args) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoize function with cache
 * @param {Function} func
 * @param {Function} keyResolver - Function to generate cache key from args
 * @returns {Function}
 */
export function memoize(func, keyResolver = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  
  return function(...args) {
    const key = keyResolver(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func.apply(this, args);
    cache.set(key, result);
    
    return result;
  };
}

/**
 * Memoize async function with cache
 * @param {Function} func
 * @param {number} ttl - Time to live in ms
 * @param {Function} keyResolver
 * @returns {Function}
 */
export function memoizeAsync(func, ttl = 60000, keyResolver = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  
  return async function(...args) {
    const key = keyResolver(...args);
    const cached = cache.get(key);
    
    if (cached && Date.now() < cached.expires) {
      return cached.value;
    }
    
    const result = await func.apply(this, args);
    cache.set(key, {
      value: result,
      expires: Date.now() + ttl
    });
    
    return result;
  };
}

/**
 * Batch storage writes
 */
class BatchedStorageWriter {
  constructor(flushInterval = 1000) {
    this.pending = new Map();
    this.flushInterval = flushInterval;
    this.flushTimer = null;
  }
  
  /**
   * Queue a write
   * @param {string} key
   * @param {any} value
   */
  write(key, value) {
    this.pending.set(key, value);
    this.scheduleFlush();
  }
  
  /**
   * Schedule flush
   */
  scheduleFlush() {
    if (this.flushTimer) return;
    
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.flushInterval);
  }
  
  /**
   * Flush pending writes
   */
  async flush() {
    if (this.pending.size === 0) return;
    
    const toWrite = new Map(this.pending);
    this.pending.clear();
    this.flushTimer = null;
    
    try {
      const writes = [];
      for (const [key, value] of toWrite) {
        writes.push(setStorageValue(key, value));
      }
      await Promise.all(writes);
    } catch (error) {
      console.error('Error flushing batched writes:', error);
      // Re-queue failed writes
      for (const [key, value] of toWrite) {
        this.pending.set(key, value);
      }
    }
  }
  
  /**
   * Force immediate flush
   */
  async forceFlush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }
}

// Global batched writer
export const batchedWriter = new BatchedStorageWriter();

/**
 * Lazy load a module
 * @param {Function} importFn
 * @returns {Function}
 */
export function lazyLoad(importFn) {
  let module = null;
  let loading = false;
  const queue = [];
  
  return async function() {
    if (module) return module;
    
    if (loading) {
      return new Promise(resolve => {
        queue.push(resolve);
      });
    }
    
    loading = true;
    
    try {
      module = await importFn();
      queue.forEach(resolve => resolve(module));
      return module;
    } finally {
      loading = false;
    }
  };
}

/**
 * Run function when idle
 * @param {Function} func
 * @param {number} timeout
 * @returns {Promise}
 */
export function runWhenIdle(func, timeout = 1000) {
  return new Promise(resolve => {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        resolve(func());
      }, { timeout });
    } else {
      setTimeout(() => {
        resolve(func());
      }, 0);
    }
  });
}

/**
 * Chunk array processing
 * @param {Array} array
 * @param {Function} processor
 * @param {number} chunkSize
 * @param {number} delay
 * @returns {Promise<Array>}
 */
export async function processInChunks(array, processor, chunkSize = 10, delay = 0) {
  const results = [];
  
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map(processor));
    results.push(...chunkResults);
    
    if (delay > 0 && i + chunkSize < array.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}

/**
 * Performance monitoring
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }
  
  /**
   * Start timing
   * @param {string} name
   */
  start(name) {
    this.metrics.set(name, {
      start: performance.now(),
      end: null
    });
  }
  
  /**
   * End timing
   * @param {string} name
   * @returns {number} - Duration in ms
   */
  end(name) {
    const metric = this.metrics.get(name);
    if (!metric) return 0;
    
    metric.end = performance.now();
    const duration = metric.end - metric.start;
    
    console.debug(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }
  
  /**
   * Measure async function
   * @param {string} name
   * @param {Function} func
   * @returns {Promise}
   */
  async measure(name, func) {
    this.start(name);
    try {
      return await func();
    } finally {
      this.end(name);
    }
  }
  
  /**
   * Get all metrics
   * @returns {Object}
   */
  getMetrics() {
    const result = {};
    for (const [name, metric] of this.metrics) {
      if (metric.end) {
        result[name] = metric.end - metric.start;
      }
    }
    return result;
  }
}

// Global performance monitor
export const perfMonitor = new PerformanceMonitor();

/**
 * Object pool for reusing objects
 */
export class ObjectPool {
  constructor(factory, reset, initialSize = 10) {
    this.factory = factory;
    this.reset = reset;
    this.pool = [];
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }
  
  /**
   * Get object from pool
   * @returns {any}
   */
  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.factory();
  }
  
  /**
   * Return object to pool
   * @param {any} obj
   */
  release(obj) {
    this.reset(obj);
    this.pool.push(obj);
  }
}

