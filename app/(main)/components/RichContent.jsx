"use client";

import React, { useEffect, useRef, useState } from "react";
import loadMathJax from "../lib/utils/mathJaxLoader";
import { logger } from "@/utils/logger";

const RichContent = ({ html }) => {
  const containerRef = useRef(null);
  const [mathJaxError, setMathJaxError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!html || typeof window === "undefined") {
      return () => {
        isMounted = false;
      };
    }

    loadMathJax()
      .then((MathJax) => {
        if (!MathJax || !isMounted || !containerRef.current) return;
        setMathJaxError(false);

        try {
          if (typeof MathJax.typesetClear === "function") {
            MathJax.typesetClear([containerRef.current]);
          }

          if (typeof MathJax.texReset === "function") {
            MathJax.texReset();
          }

          if (typeof MathJax.typesetPromise === "function") {
            return MathJax.typesetPromise([containerRef.current]);
          }

          if (typeof MathJax.typeset === "function") {
            MathJax.typeset([containerRef.current]);
          }
        } catch (error) {
          logger.error("MathJax typeset failed", error);
        }
      })
      .catch((error) => {
        logger.error("Unable to load MathJax", error);
        if (isMounted) {
          setMathJaxError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [html]);

  return (
    <>
      {mathJaxError && (
        <div className="text-yellow-600 text-sm mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
          Note: Math equations may not render correctly. Please refresh the page.
        </div>
      )}
      <div
        ref={containerRef}
        className="rich-text-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
};

export default RichContent;

