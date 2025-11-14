# Main App Group - Comprehensive Debugging Report

**Generated:** $(date)  
**Focus:** `app/(main)` directory  
**Status:** Critical Issues Identified

---

## Executive Summary

This report details debugging findings for the main application group (`app/(main)`). The analysis covers:
- Memory leaks and resource management
- Error handling and logging
- Performance optimization opportunities
- Code quality issues
- Potential race conditions

**Total Issues Found:** 23  
**Critical:** 4  
**High:** 8  
**Medium:** 7  
**Low:** 4

---

## Critical Issues (Priority 1)

### 1. `setTimeout` Without Cleanup in MainLayout.jsx

**Location:** `app/(main)/layout/MainLayout.jsx:30`

**Issue:**
```javascript
setTimeout(() => {
  if (!document.querySelector('[data-nav-menu-open="true"]')) {
    document.body.style.overflow = "";
  }
}, 0);
```

**Problem:** The `setTimeout` timer is not stored or cleaned up. If the component unmounts before the timeout fires, it could try to update state on an unmounted component.

**Impact:** Memory leak, potential state updates on unmounted components

**Fix:**
```javascript
useEffect(() => {
  let timeoutId = null;
  
  if (isSidebarOpen) {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    }
  } else {
    timeoutId = setTimeout(() => {
      if (!document.querySelector('[data-nav-menu-open="true"]')) {
        document.body.style.overflow = "";
      }
    }, 0);
  }

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (!isSidebarOpen) {
      document.body.style.overflow = "";
    }
  };
}, [isSidebarOpen]);
```

---

### 2. Unbounded Cache Growth in useOptimizedFetch

**Location:** `app/(main)/lib/hooks/useOptimizedFetch.js:21`

**Issue:**
```javascript
const cacheRef = useRef({});
// No cleanup mechanism for expired or unused cache entries
```

**Problem:** The cache object grows indefinitely. There's no TTL enforcement or LRU eviction strategy, leading to memory bloat over time.

**Impact:** Memory leak, degraded performance over time

**Fix:** Implement cache cleanup with LRU eviction:
```javascript
const MAX_CACHE_SIZE = 50;
const CACHE_TTL = cacheTime;

// Cleanup function
const cleanupCache = () => {
  const now = Date.now();
  const entries = Object.entries(cacheRef.current);
  
  // Remove expired entries
  entries.forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_TTL) {
      delete cacheRef.current[key];
    }
  });
  
  // If still over limit, remove oldest entries (LRU)
  if (Object.keys(cacheRef.current).length > MAX_CACHE_SIZE) {
    const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = sorted.slice(0, sorted.length - MAX_CACHE_SIZE);
    toDelete.forEach(([key]) => delete cacheRef.current[key]);
  }
};

// Call cleanup periodically or on cache set
useEffect(() => {
  const interval = setInterval(cleanupCache, CACHE_TTL / 2);
  return () => clearInterval(interval);
}, []);
```

---

### 3. Unbounded Cache Growth in useDataFetching

**Location:** `app/(main)/lib/hooks/useDataFetching.js:24`

**Issue:**
```javascript
const cacheRef = useRef({});
// No cleanup mechanism for expired or unused cache entries
```

**Problem:** Same as above - cache grows indefinitely without cleanup.

**Impact:** Memory leak, degraded performance

**Fix:** Apply the same cache cleanup strategy as above.

---

### 4. MathJax Script Event Listeners Not Cleaned Up

**Location:** Multiple files: `[exam]/page.js`, `[subject]/page.js`, etc.

**Issue:**
```javascript
existingScript.addEventListener("load", () => resolve(window.MathJax), {
  once: true,
});
existingScript.addEventListener("error", reject, { once: true });
```

**Problem:** While `once: true` helps, if the component unmounts before the event fires, the listener remains in memory. The `loadMathJax.promise` is also stored globally without cleanup.

**Impact:** Memory leak, potential race conditions

**Fix:** Store event handlers and clean them up:
```javascript
const loadMathJax = () => {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.MathJax) return Promise.resolve(window.MathJax);

  if (!loadMathJax.promise) {
    loadMathJax.promise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        `script[src="${MATHJAX_SCRIPT_SRC}"]`
      );

      let loadHandler, errorHandler;

      if (existingScript) {
        loadHandler = () => resolve(window.MathJax);
        errorHandler = reject;
        
        existingScript.addEventListener("load", loadHandler, { once: true });
        existingScript.addEventListener("error", errorHandler, { once: true });
        
        // Cleanup on promise resolution
        Promise.race([
          new Promise(resolve => existingScript.addEventListener("load", resolve, { once: true })),
          new Promise(resolve => existingScript.addEventListener("error", resolve, { once: true }))
        ]).finally(() => {
          existingScript.removeEventListener("load", loadHandler);
          existingScript.removeEventListener("error", errorHandler);
        });
        
        return;
      }

      const script = document.createElement("script");
      script.src = MATHJAX_SCRIPT_SRC;
      script.async = true;
      
      loadHandler = () => resolve(window.MathJax);
      errorHandler = reject;
      
      script.addEventListener("load", loadHandler, { once: true });
      script.addEventListener("error", errorHandler, { once: true });
      
      document.head.appendChild(script);
      
      // Cleanup after promise resolves
      Promise.race([
        new Promise(resolve => script.addEventListener("load", resolve, { once: true })),
        new Promise(resolve => script.addEventListener("error", resolve, { once: true }))
      ]).finally(() => {
        script.removeEventListener("load", loadHandler);
        script.removeEventListener("error", errorHandler);
      });
    });
  }

  return loadMathJax.promise;
};
```

---

## High Priority Issues (Priority 2)

### 5. Console Statements Instead of Logger

**Location:** Multiple files (59 instances found)

**Files Affected:**
- `app/(main)/layout/Sidebar.jsx` (20+ instances)
- `app/(main)/[exam]/page.js` (4 instances)
- `app/(main)/[exam]/[subject]/page.js` (2 instances)
- `app/(main)/[exam]/[subject]/[unit]/page.js` (2 instances)
- `app/(main)/[exam]/[subject]/[unit]/[chapter]/page.js` (2 instances)
- `app/(main)/[exam]/[subject]/[unit]/[chapter]/[topic]/page.js` (2 instances)
- `app/(main)/[exam]/[subject]/[unit]/[chapter]/[topic]/[subtopic]/page.js` (2 instances)
- `app/(main)/lib/hierarchicalNavigation.js` (25+ instances)

**Issue:** Using `console.log`, `console.error`, `console.warn` instead of the logger utility.

**Problem:**
- Logs appear in production
- No log level control
- Difficult to disable in production
- Inconsistent logging across codebase

**Impact:** Performance overhead, security concerns (leaking debug info), inconsistent logging

**Fix:** Replace all `console.*` statements with `logger.*`:
```javascript
// Instead of:
console.log("Debug message");
console.error("Error message");
console.warn("Warning message");

// Use:
import { logger } from "@/utils/logger";
logger.info("Debug message");
logger.error("Error message");
logger.warn("Warning message");
```

---

### 6. Missing Cleanup for Pending Requests in useOptimizedFetch

**Location:** `app/(main)/lib/hooks/useOptimizedFetch.js:24`

**Issue:**
```javascript
const pendingRequestsRef = useRef({});
// No cleanup on unmount
```

**Problem:** If component unmounts while requests are pending, the ref is never cleaned up. This can cause memory leaks if many components use this hook.

**Impact:** Memory leak

**Fix:**
```javascript
useEffect(() => {
  return () => {
    // Cleanup pending requests on unmount
    Object.values(pendingRequestsRef.current).forEach(promise => {
      // Cancel if possible (requires AbortController support)
    });
    pendingRequestsRef.current = {};
  };
}, []);
```

---

### 7. Missing AbortController Support in useOptimizedFetch

**Location:** `app/(main)/lib/hooks/useOptimizedFetch.js:43`

**Issue:**
```javascript
const requestPromise = fetch(url)
  // No AbortController support
```

**Problem:** Cannot cancel in-flight requests when component unmounts or dependencies change.

**Impact:** Wasted network resources, potential race conditions, state updates on unmounted components

**Fix:**
```javascript
const fetchData = useCallback(async () => {
  // ... existing cache checks ...

  // Create AbortController for this request
  const abortController = new AbortController();
  const signal = abortController.signal;

  // Store abort controller
  const abortControllerRef = useRef(null);
  abortControllerRef.current = abortController;

  const requestPromise = fetch(url, { signal })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    // ... rest of the code ...

  // Cleanup on unmount or new request
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, [url, cacheKey, cacheTime]);
```

---

### 8. Sidebar Console Statements for Debugging

**Location:** `app/(main)/layout/Sidebar.jsx` (Multiple lines)

**Issue:** Temporary debug logging statements added during debugging should be removed or converted to proper logger calls.

**Lines:**
- Line 170: `console.log("Sidebar: Fetched subjects...")`
- Line 176: `console.log("Sidebar: Ordered subjects...")`
- Line 179: `console.warn("Sidebar: No subjects found...")`
- Line 197: `console.log("Sidebar: Fetched units...")`
- Line 211: `console.log("Sidebar: Fetched chapters...")`
- Line 225: `console.log("Sidebar: Fetched topics...")`
- Line 266: `console.log("Sidebar: Built subject nodes...")`
- Line 269: `console.warn("Sidebar: No subject nodes built...")`

**Impact:** Performance overhead, clutter in console

**Fix:** Remove or convert to logger with appropriate log levels.

---

### 9. Error Swallowing in hierarchicalNavigation.js

**Location:** `app/(main)/lib/hierarchicalNavigation.js` (Multiple locations)

**Issue:**
```javascript
} catch (error) {
  // Continue to next option
}
```

**Problem:** Errors are silently swallowed with only console.error. No proper error handling or logging.

**Impact:** Difficult to debug issues, silent failures

**Fix:** Use logger and provide context:
```javascript
} catch (error) {
  logger.error("Error fetching next item:", {
    error: error.message,
    context: { examId, subjectId, /* ... */ }
  });
  // Continue to next option
}
```

---

### 10. Missing Error Boundaries in Page Components

**Location:** All page components in `[exam]`, `[subject]`, etc.

**Issue:** Page components don't have error boundaries, relying only on MainLayout's ErrorBoundary.

**Problem:** If an error occurs in nested components, it might not be caught properly.

**Impact:** Poor error handling, potential crashes

**Fix:** Add error boundaries at appropriate levels or ensure MainLayout's ErrorBoundary covers all cases.

---

### 11. Potential Race Condition in ExamPage Navigation

**Location:** `app/(main)/[exam]/page.js:179-215`

**Issue:**
```javascript
useEffect(() => {
  const calculateNavigation = async () => {
    // Multiple async operations without cancellation
    const allExams = await fetchExams({ limit: 100 });
    setExams(allExams);
    // ...
  };
  if (exam) {
    calculateNavigation();
  }
}, [exam, examSlug]);
```

**Problem:** If `exam` or `examSlug` changes quickly, multiple navigation calculations can run simultaneously, causing race conditions.

**Impact:** Incorrect navigation state, wasted API calls

**Fix:** Use AbortController or cleanup flag:
```javascript
useEffect(() => {
  let isCancelled = false;
  
  const calculateNavigation = async () => {
    if (!exam?._id) return;
    
    try {
      const allExams = await fetchExams({ limit: 100 });
      if (isCancelled) return;
      
      setExams(allExams);
      // ... rest of navigation calculation
    } catch (error) {
      if (!isCancelled) {
        logger.error("Error calculating navigation:", error);
      }
    }
  };

  if (exam) {
    calculateNavigation();
  }

  return () => {
    isCancelled = true;
  };
}, [exam, examSlug]);
```

---

### 12. No Request Deduplication in Sidebar API Calls

**Location:** `app/(main)/layout/Sidebar.jsx:169-258`

**Issue:** Multiple API calls can be triggered simultaneously for the same data (e.g., if user rapidly changes exams).

**Problem:** Wasted API calls, potential race conditions, unnecessary network traffic

**Impact:** Performance degradation, API rate limiting issues

**Fix:** Implement request deduplication using a cache/queue system similar to `useOptimizedFetch`.

---

## Medium Priority Issues (Priority 3)

### 13. Missing Cleanup for loadMathJax Promise

**Location:** Multiple page components

**Issue:** `loadMathJax.promise` is stored globally but never cleared, even if MathJax script fails to load.

**Impact:** Memory leak, prevents retry on failure

**Fix:** Clear promise on error and allow retry:
```javascript
loadMathJax.promise.catch(() => {
  delete loadMathJax.promise;
});
```

---

### 14. Unused memoizedExams in HomePage

**Location:** `app/(main)/page.js:128`

**Issue:**
```javascript
const memoizedExams = useMemo(() => exams, [exams]);
// Never used
```

**Impact:** Unnecessary computation

**Fix:** Remove if not needed, or use if it was intended for optimization.

---

### 15. Inconsistent Error Handling in Subject Page

**Location:** `app/(main)/[exam]/[subject]/page.js:141-226`

**Issue:** Error handling is inconsistent - some errors set state, others return early.

**Impact:** Inconsistent UX, difficult to debug

**Fix:** Standardize error handling pattern across all page components.

---

### 16. Missing Loading States in Some Async Operations

**Location:** Multiple page components

**Issue:** Some async operations (like fetching details) don't show loading states.

**Impact:** Poor UX, users don't know content is loading

**Fix:** Add loading states for all async operations.

---

### 17. No Debouncing for Sidebar Search

**Location:** `app/(main)/layout/Sidebar.jsx:384-400`

**Issue:** Search input triggers filtering on every keystroke without debouncing.

**Impact:** Performance issues with large trees

**Fix:** Add debouncing (300ms):
```javascript
const [searchQuery, setSearchQuery] = useState("");
const [debouncedQuery, setDebouncedQuery] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(searchQuery);
  }, 300);
  
  return () => clearTimeout(timer);
}, [searchQuery]);

// Use debouncedQuery in filterTreeByQuery
```

---

### 18. Missing Error Handling for MathJax Loading Failures

**Location:** All page components with RichContent

**Issue:** If MathJax fails to load, the error is logged but the component doesn't handle it gracefully.

**Impact:** Broken rendering for math equations

**Fix:** Show fallback content or error message:
```javascript
const [mathJaxError, setMathJaxError] = useState(false);

loadMathJax()
  .then((MathJax) => {
    // ... existing code
  })
  .catch((error) => {
    logger.error("Unable to load MathJax", error);
    setMathJaxError(true);
  });

// In render:
{mathJaxError && (
  <div className="text-yellow-600 text-sm">
    Note: Math equations may not render correctly. Please refresh the page.
  </div>
)}
```

---

### 19. Potential Memory Leak in Tree Cache

**Location:** `app/(main)/layout/Sidebar.jsx:91`

**Issue:**
```javascript
const treeCacheRef = useRef(new Map());
// No limit or cleanup mechanism
```

**Problem:** Tree cache grows indefinitely as users browse different exams.

**Impact:** Memory leak over time

**Fix:** Implement LRU cache with max size:
```javascript
const MAX_TREE_CACHE_SIZE = 10;

const cleanupTreeCache = () => {
  if (treeCacheRef.current.size > MAX_TREE_CACHE_SIZE) {
    // Remove oldest entry (first key)
    const firstKey = treeCacheRef.current.keys().next().value;
    treeCacheRef.current.delete(firstKey);
  }
};
```

---

## Low Priority Issues (Priority 4)

### 20. Inconsistent Naming: examId vs examSlug

**Location:** Multiple files

**Issue:** Mixed usage of `examId` (ID) and `examId` (slug) in variable names.

**Impact:** Confusion, potential bugs

**Fix:** Use consistent naming: `examId` for IDs, `examSlug` for slugs.

---

### 21. Magic Numbers in Components

**Location:** Multiple files

**Issue:** Hardcoded values like `1024` (viewport width), `300` (timeouts), etc.

**Impact:** Difficult to maintain, inconsistent behavior

**Fix:** Extract to constants:
```javascript
const MOBILE_BREAKPOINT = 1024;
const DEBOUNCE_DELAY = 300;
```

---

### 22. Missing PropTypes or TypeScript

**Location:** All components

**Issue:** No type checking for props.

**Impact:** Runtime errors, difficult to maintain

**Fix:** Add PropTypes or migrate to TypeScript.

---

### 23. Redundant API Calls in SubjectPage

**Location:** `app/(main)/[exam]/[subject]/page.js:156-194`

**Issue:** Fetches subjects, then fetches full subject data again.

**Impact:** Unnecessary network calls

**Fix:** Check if full data is already available before fetching.

---

## Performance Optimizations

### 1. Implement Virtual Scrolling for Large Lists

**Location:** `app/(main)/[exam]/page.js`, `[subject]/page.js`, etc.

**Suggestion:** Use virtual scrolling for lists with 100+ items to improve performance.

---

### 2. Lazy Load MathJax Only When Needed

**Location:** All page components

**Suggestion:** Only load MathJax if the content actually contains math equations.

---

### 3. Optimize Tree Filtering

**Location:** `app/(main)/layout/Sidebar.jsx:29-76`

**Suggestion:** Use more efficient filtering algorithm or memoize filtered results.

---

## Summary of Recommended Actions

### Immediate (Critical):
1. Fix `setTimeout` cleanup in MainLayout.jsx
2. Implement cache cleanup in useOptimizedFetch and useDataFetching
3. Fix MathJax event listener cleanup
4. Add AbortController support to useOptimizedFetch

### Short-term (High Priority):
5. Replace all console statements with logger
6. Implement request deduplication in Sidebar
7. Fix race conditions in navigation calculations
8. Add proper error handling in hierarchicalNavigation.js

### Medium-term (Medium Priority):
9. Add debouncing to search
10. Implement LRU cache for tree cache
11. Add loading states for all async operations
12. Standardize error handling patterns

### Long-term (Low Priority):
13. Add PropTypes or TypeScript
14. Extract magic numbers to constants
15. Optimize redundant API calls
16. Implement virtual scrolling for large lists

---

## Files Requiring Immediate Attention

1. `app/(main)/layout/MainLayout.jsx` - Critical memory leak
2. `app/(main)/lib/hooks/useOptimizedFetch.js` - Critical memory leak
3. `app/(main)/lib/hooks/useDataFetching.js` - Critical memory leak
4. `app/(main)/layout/Sidebar.jsx` - Multiple issues
5. `app/(main)/[exam]/page.js` - Race conditions, console statements
6. `app/(main)/lib/hierarchicalNavigation.js` - Error handling, console statements

---

## Testing Recommendations

1. **Memory Leak Testing:**
   - Monitor memory usage during extended browsing sessions
   - Test component unmounting scenarios
   - Verify cache cleanup is working

2. **Performance Testing:**
   - Test with large datasets (100+ exams, subjects, etc.)
   - Measure API call frequency
   - Test search performance with large trees

3. **Error Handling Testing:**
   - Test network failures
   - Test invalid data scenarios
   - Test rapid navigation changes

---

## Notes

- All console statements should be reviewed and either removed (debug statements) or converted to logger (important logs)
- Consider implementing a centralized error handling system
- Consider adding performance monitoring/analytics
- Review and optimize API call patterns to reduce redundant requests

---

**Report Generated By:** AI Debugging System  
**Next Review:** After implementing critical fixes

