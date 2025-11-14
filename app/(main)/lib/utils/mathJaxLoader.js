/**
 * MathJax loader utility with proper cleanup
 */

const MATHJAX_SCRIPT_SRC = "/vendor/mathjax/MathJax.js?config=TeX-AMS_HTML";

let mathJaxPromise = null;
let mathJaxError = false;

const loadMathJax = () => {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.MathJax) return Promise.resolve(window.MathJax);
  
  // If previous load failed, allow retry by clearing the promise
  if (mathJaxError) {
    mathJaxPromise = null;
    mathJaxError = false;
  }

  if (!mathJaxPromise) {
    mathJaxPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        `script[src="${MATHJAX_SCRIPT_SRC}"]`
      );

      let loadHandler, errorHandler;

      if (existingScript) {
        loadHandler = () => {
          if (window.MathJax) {
            resolve(window.MathJax);
          } else {
            reject(new Error("MathJax loaded but not available on window"));
          }
        };
        errorHandler = (error) => {
          mathJaxError = true;
          mathJaxPromise = null;
          reject(error);
        };

        // Check if already loaded
        if (existingScript.getAttribute("data-loaded") === "true") {
          loadHandler();
          return;
        }

        existingScript.addEventListener("load", loadHandler, { once: true });
        existingScript.addEventListener("error", errorHandler, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = MATHJAX_SCRIPT_SRC;
      script.async = true;

      loadHandler = () => {
        script.setAttribute("data-loaded", "true");
        if (window.MathJax) {
          resolve(window.MathJax);
        } else {
          reject(new Error("MathJax loaded but not available on window"));
        }
      };
      errorHandler = (error) => {
        mathJaxError = true;
        mathJaxPromise = null;
        // Clean up script element on error
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        reject(error);
      };

      script.addEventListener("load", loadHandler, { once: true });
      script.addEventListener("error", errorHandler, { once: true });

      document.head.appendChild(script);

      // Cleanup on promise resolution/rejection
      Promise.race([
        new Promise((resolve) => {
          script.addEventListener("load", () => resolve(), { once: true });
        }),
        new Promise((resolve) => {
          script.addEventListener("error", () => resolve(), { once: true });
        }),
      ]).finally(() => {
        // Event listeners are removed automatically with { once: true }
        // But we can still remove them explicitly if needed
        try {
          script.removeEventListener("load", loadHandler);
          script.removeEventListener("error", errorHandler);
        } catch (e) {
          // Ignore errors from removing listeners
        }
      });
    });

    // Clear promise on error to allow retry
    mathJaxPromise.catch(() => {
      // Promise is already cleared in errorHandler
    });
  }

  return mathJaxPromise;
};

export default loadMathJax;
export { MATHJAX_SCRIPT_SRC };

