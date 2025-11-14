"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ERROR_MESSAGES, CACHE_CONFIG } from "@/constants";
import { logger } from "@/utils/logger";

/**
 * Custom hook for optimized data fetching with caching and error handling
 */
export function useDataFetching(
  fetchFunction,
  dependencies = [],
  options = {}
) {
  const {
    enabled = true,
    cacheKey = null,
    cacheTime = CACHE_CONFIG.MEDIUM, // 5 minutes default
    refetchOnMount = true,
  } = options;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({});
  const abortControllerRef = useRef(null);
  const fetchFunctionRef = useRef(fetchFunction);

  // Cache limits
  const MAX_CACHE_SIZE = 50;

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

  // Update ref when fetchFunction changes
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);

  const fetchData = useCallback(async () => {
    // Cleanup cache before checking
    cleanupCache();
    
    // Check cache first
    if (cacheKey && cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      if (Date.now() - cached.timestamp < cacheTime) {
        setData(cached.data);
        setIsLoading(false);
        return;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      // Call fetchFunction - it may or may not accept a signal parameter
      // Use ref to avoid stale closure issues
      const currentFetchFunction = fetchFunctionRef.current;
      const result =
        currentFetchFunction.length > 0
          ? await currentFetchFunction(abortControllerRef.current.signal)
          : await currentFetchFunction();

      if (!abortControllerRef.current.signal.aborted) {
        setData(result);

        // Cleanup cache before adding new entry
        cleanupCache();
        
        // Cache the result
        if (cacheKey) {
          cacheRef.current[cacheKey] = {
            data: result,
            timestamp: Date.now(),
          };
        }
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        logger.error("Error fetching data:", err);
        setError(err.message || ERROR_MESSAGES.FETCH_FAILED);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, cacheTime, cleanupCache, ...dependencies]);

  useEffect(() => {
    if (enabled && refetchOnMount) {
      fetchData();
    }

    // Periodic cache cleanup
    const cleanupInterval = setInterval(cleanupCache, cacheTime / 2);

    return () => {
      clearInterval(cleanupInterval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refetchOnMount, cleanupCache, cacheTime, ...dependencies]);

  const refetch = useCallback(() => {
    if (cacheKey) {
      delete cacheRef.current[cacheKey];
    }
    fetchData();
  }, [fetchData, cacheKey]);

  return { data, isLoading, error, refetch };
}
