"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ERROR_MESSAGES, CACHE_CONFIG } from "@/constants";

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

  const fetchData = useCallback(async () => {
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

    // Create new request
    const requestPromise = fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
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
        setError(err.message || ERROR_MESSAGES.FETCH_FAILED);
        setIsLoading(false);
        delete pendingRequestsRef.current[cacheKey];
        throw err;
      });

    // Store pending request
    pendingRequestsRef.current[cacheKey] = requestPromise;
    
    return requestPromise;
  }, [url, cacheKey, cacheTime]);

  useEffect(() => {
    if (!enabled) return;

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
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, fetchData, refetchInterval, cacheKey]);

  const refetch = useCallback(() => {
    delete cacheRef.current[cacheKey];
    setIsLoading(true);
    return fetchData();
  }, [fetchData, cacheKey]);

  return { data, isLoading, error, refetch };
}


