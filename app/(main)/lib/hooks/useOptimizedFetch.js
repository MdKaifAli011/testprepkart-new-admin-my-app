"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ERROR_MESSAGES, CACHE_CONFIG } from "@/constants";

// Cache limits
const MAX_CACHE_SIZE = 50;

/**
 * Optimized fetch hook with request deduplication and caching
 */
export function useOptimizedFetch(url, options = {}) {
  const {
    enabled = true,
    cacheKey = url,
    cacheTime = CACHE_CONFIG.MEDIUM,
    refetchInterval = null,
  } = options;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cache storage
  const cacheRef = useRef({});
  
  // Request deduplication
  const pendingRequestsRef = useRef({});
  
  // Abort controllers for pending requests
  const abortControllerRef = useRef(null);

  // Cleanup expired and excess cache entries (LRU eviction)
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const entries = Object.entries(cacheRef.current);
    
    // Remove expired entries
    entries.forEach(([key, value]) => {
      if (now - value.timestamp > cacheTime) {
        delete cacheRef.current[key];
      }
    });
    
    // If still over limit, remove oldest entries (LRU)
    const remainingEntries = Object.entries(cacheRef.current);
    if (remainingEntries.length > MAX_CACHE_SIZE) {
      const sorted = remainingEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = sorted.slice(0, remainingEntries.length - MAX_CACHE_SIZE);
      toDelete.forEach(([key]) => delete cacheRef.current[key]);
    }
  }, [cacheTime]);

  const fetchData = useCallback(async () => {
    // Cleanup cache before checking
    cleanupCache();
    
    // Check cache
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      if (Date.now() - cached.timestamp < cacheTime) {
        setData(cached.data);
        setIsLoading(false);
        return;
      }
    }

    // Check if request is already pending
    if (pendingRequestsRef.current[cacheKey]) {
      return pendingRequestsRef.current[cacheKey];
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    // Create new request
    const requestPromise = fetch(url, { signal })
      .then((response) => {
        if (signal.aborted) {
          throw new Error("Request aborted");
        }
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        if (signal.aborted) return;
        
        // Cleanup cache before adding new entry
        cleanupCache();
        
        // Cache the result
        cacheRef.current[cacheKey] = {
          data: result,
          timestamp: Date.now(),
        };
        
        setData(result);
        setIsLoading(false);
        setError(null);
        
        // Clean up pending request
        delete pendingRequestsRef.current[cacheKey];
        
        return result;
      })
      .catch((err) => {
        if (signal.aborted) {
          // Request was cancelled, don't update state
          return;
        }
        setError(err.message || ERROR_MESSAGES.FETCH_FAILED);
        setIsLoading(false);
        delete pendingRequestsRef.current[cacheKey];
        throw err;
      });

    // Store pending request
    pendingRequestsRef.current[cacheKey] = requestPromise;
    
    return requestPromise;
  }, [url, cacheKey, cacheTime, cleanupCache]);

  useEffect(() => {
    if (!enabled) return;

    // Periodic cache cleanup
    const cleanupInterval = setInterval(cleanupCache, cacheTime / 2);
    
    fetchData();

    // Set up refetch interval if provided
    let intervalId = null;
    if (refetchInterval) {
      intervalId = setInterval(() => {
        // Clear cache to force refetch
        delete cacheRef.current[cacheKey];
        fetchData();
      }, refetchInterval);
    }

    return () => {
      // Cleanup intervals
      clearInterval(cleanupInterval);
      if (intervalId) {
        clearInterval(intervalId);
      }
      // Abort pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Cleanup pending requests
      pendingRequestsRef.current = {};
    };
  }, [enabled, fetchData, refetchInterval, cacheKey, cleanupCache, cacheTime]);

  const refetch = useCallback(() => {
    delete cacheRef.current[cacheKey];
    setIsLoading(true);
    return fetchData();
  }, [fetchData, cacheKey]);

  return { data, isLoading, error, refetch };
}


