// ============================================
// Production Logger Utility
// ============================================

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Production-ready logger that only logs in development
 */
export const logger = {
  error: (message, ...args) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, ...args);
    }
    // In production, you can send to error tracking service
    // Example: Sentry.captureException(new Error(message));
  },

  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  info: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  debug: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
};


