/**
 * Memory Cache Layer
 * Implements LRU cache for high-performance data retrieval
 */

class Cache {
  constructor(maxSize = 1000, defaultTTL = 300000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL; // 5 minutes default
  }

  /**
   * Get item from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiry) {
      this.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  /**
   * Set item in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = this.defaultTTL) {
    // If key exists, remove it first
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // If cache is full, remove oldest items
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
      createdAt: Date.now()
    });
  }

  /**
   * Delete item from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;
    let totalTTL = 0;

    for (const item of this.cache.values()) {
      if (now > item.expiry) {
        expired++;
      } else {
        valid++;
        totalTTL += item.expiry - item.createdAt;
      }
    }

    return {
      size: this.cache.size,
      valid,
      expired,
      maxSize: this.maxSize,
      avgTTL: valid > 0 ? Math.round(totalTTL / valid) : 0
    };
  }

  /**
   * Generate cache key from multiple parameters
   * @param {...string} parts - Key parts
   * @returns {string} - Formatted cache key
   */
  static makeKey(...parts) {
    return parts.join(':');
  }
}

// Singleton cache instance
const cache = new Cache(1000, 300000);

module.exports = cache;
