// ============================================
// API Performance Optimization Utilities
// ============================================

import { getCachedResponse, setCachedResponse } from "./apiCache";
import { CACHE_CONFIG } from "@/constants";

/**
 * Optimized API call with caching and retry logic
 * @param {Function} apiCall - API call function
 * @param {string} cacheKey - Cache key
 * @param {Object} options - Options
 * @returns {Promise} API response
 */
export async function optimizedApiCall(apiCall, cacheKey, options = {}) {
  const {
    useCache = true,
    cacheTTL = CACHE_CONFIG.MEDIUM,
    retries = 0,
    retryDelay = 1000,
  } = options;

  // Check cache first
  if (useCache && cacheKey) {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Retry logic
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await apiCall();
      
      // Cache the result
      if (useCache && cacheKey) {
        setCachedResponse(cacheKey, result, cacheTTL);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

/**
 * Batch API calls with concurrency control
 * @param {Array<Function>} apiCalls - Array of API call functions
 * @param {number} concurrency - Maximum concurrent calls
 * @returns {Promise<Array>} Results array
 */
export async function batchApiCalls(apiCalls, concurrency = 5) {
  const results = [];
  const executing = [];

  for (const apiCall of apiCalls) {
    const promise = apiCall().then((result) => {
      executing.splice(executing.indexOf(promise), 1);
      return result;
    });

    results.push(promise);
    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

/**
 * Debounce API calls
 * @param {Function} apiCall - API call function
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounceApiCall(apiCall, delay = 300) {
  let timeoutId;
  let lastCallTime = 0;

  return async (...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);

      if (timeSinceLastCall >= delay) {
        lastCallTime = now;
        apiCall(...args)
          .then(resolve)
          .catch(reject);
      } else {
        timeoutId = setTimeout(async () => {
          lastCallTime = Date.now();
          try {
            const result = await apiCall(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay - timeSinceLastCall);
      }
    });
  };
}

