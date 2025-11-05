// ============================================
// API Response Caching Utility
// ============================================

import { CACHE_CONFIG } from "@/constants";

// In-memory cache store
const cacheStore = new Map();

/**
 * Get cached response
 * @param {string} key - Cache key
 * @returns {Object|null} Cached data or null
 */
export function getCachedResponse(key) {
  const cached = cacheStore.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    cacheStore.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Set cached response
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds
 */
export function setCachedResponse(key, data, ttl = CACHE_CONFIG.MEDIUM) {
  cacheStore.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Clear cache by key or all cache
 * @param {string|null} key - Cache key or null to clear all
 */
export function clearCache(key = null) {
  if (key) {
    cacheStore.delete(key);
  } else {
    cacheStore.clear();
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache() {
  const now = Date.now();
  for (const [key, cached] of cacheStore.entries()) {
    if (now - cached.timestamp > cached.ttl) {
      cacheStore.delete(key);
    }
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  return {
    size: cacheStore.size,
    keys: Array.from(cacheStore.keys()),
  };
}

// Auto-cleanup expired cache every 5 minutes
if (typeof window !== "undefined") {
  setInterval(clearExpiredCache, 5 * 60 * 1000);
}

