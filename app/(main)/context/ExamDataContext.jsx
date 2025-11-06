"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import {
  fetchExams,
  fetchSubjectsByExam,
  fetchUnitsBySubject,
  fetchChaptersByUnit,
  fetchTopicsByChapter,
  createSlug,
  findByIdOrSlug,
} from "../lib/api";
import { logger } from "@/utils/logger";

const ExamDataContext = createContext(null);

export const useExamData = () => {
  const context = useContext(ExamDataContext);
  if (!context) {
    throw new Error("useExamData must be used within ExamDataProvider");
  }
  return context;
};

export const ExamDataProvider = ({ children }) => {
  const [exams, setExams] = useState([]);
  const [examDataCache, setExamDataCache] = useState({}); // { examId: { subjects, units, chapters, topics } }
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingExamData, setLoadingExamData] = useState({}); // { examId: true/false }
  const [selectedExamId, setSelectedExamId] = useState(null);
  const loadingRef = useRef({}); // Track which exams are currently loading

  // Load all exams (only once)
  const loadExams = useCallback(async () => {
    if (exams.length > 0) return; // Already loaded
    setLoadingExams(true);
    try {
      const fetchedExams = await fetchExams();
      setExams(fetchedExams);
    } catch (error) {
      logger.error("Error loading exams:", error);
    } finally {
      setLoadingExams(false);
    }
  }, [exams.length]);

  // Load full exam data tree - optimized with parallel requests
  // Only loads once per exam, caches data for reuse
  const loadExamData = useCallback(
    async (examId) => {
      if (!examId) return;

      // Check if data is already loaded or currently loading
      if (examDataCache[examId] || loadingRef.current[examId]) {
        return; // Already loaded or loading
      }

      // Mark as loading
      loadingRef.current[examId] = true;
      setLoadingExamData((prev) => ({ ...prev, [examId]: true }));

      try {
        // Helper function to extract only needed fields for sidebar
        // Only store: _id, name, orderNumber (no content, status, SEO fields, etc.)
        const extractSidebarFields = (item) => ({
          _id: item._id,
          name: item.name,
          orderNumber: item.orderNumber || 0,
        });

        const subjects = await fetchSubjectsByExam(examId);
        const subjectData = {};

        // Parallel fetch for all subjects' units
        const subjectPromises = subjects.map(async (sub) => {
          const units = await fetchUnitsBySubject(sub._id, examId);
          return { sub, units };
        });

        const subjectResults = await Promise.all(subjectPromises);

        // First, initialize all subjects and units in the data structure
        // Only store fields needed for sidebar: _id, name, orderNumber
        subjectResults.forEach(({ sub, units }) => {
          const subSlug = createSlug(sub.name);
          if (!subjectData[subSlug]) {
            subjectData[subSlug] = {
              ...extractSidebarFields(sub),
              units: {},
            };
          }
          // Add all units, even if they don't have chapters yet
          units.forEach((unit) => {
            const unitSlug = createSlug(unit.name);
            if (!subjectData[subSlug].units[unitSlug]) {
              subjectData[subSlug].units[unitSlug] = {
                ...extractSidebarFields(unit),
                chapters: {},
              };
            }
          });
        });

        // Parallel fetch for all units' chapters
        const chapterPromises = subjectResults.flatMap(({ sub, units }) =>
          units.map(async (unit) => {
            const chapters = await fetchChaptersByUnit(unit._id);
            return { sub, unit, chapters };
          })
        );

        const chapterResults = await Promise.all(chapterPromises);

        // Parallel fetch for all chapters' topics
        const topicPromises = chapterResults.flatMap(
          ({ sub, unit, chapters }) =>
            chapters.map(async (chapter) => {
              const topics = await fetchTopicsByChapter(chapter._id);
              return { sub, unit, chapter, topics };
            })
        );

        const topicResults = await Promise.all(topicPromises);

        // Build data structure - add chapters and topics to existing units
        // Only store fields needed for sidebar: _id, name, orderNumber, slug
        topicResults.forEach(({ sub, unit, chapter, topics }) => {
          const subSlug = createSlug(sub.name);
          const unitSlug = createSlug(unit.name);
          const chapterSlug = createSlug(chapter.name);

          // Units should already exist from the initialization above
          if (!subjectData[subSlug]?.units[unitSlug]) {
            subjectData[subSlug].units[unitSlug] = {
              ...extractSidebarFields(unit),
              chapters: {},
            };
          }
          subjectData[subSlug].units[unitSlug].chapters[chapterSlug] = {
            ...extractSidebarFields(chapter),
            topics: topics.map((t) => ({
              _id: t._id,
              name: t.name,
              orderNumber: t.orderNumber || 0,
              slug: createSlug(t.name),
            })),
          };
        });

        // Cache the loaded data - this prevents reloading on navigation
        setExamDataCache((prev) => ({
          ...prev,
          [examId]: subjectData,
        }));
      } catch (error) {
        logger.error("Error loading exam data:", error);
      } finally {
        loadingRef.current[examId] = false;
        setLoadingExamData((prev) => ({ ...prev, [examId]: false }));
      }
    },
    [examDataCache]
  );

  // Get exam by slug or ID
  const getExamBySlug = useCallback(
    (slug) => {
      return findByIdOrSlug(exams, slug);
    },
    [exams]
  );

  // Get exam data by exam ID
  const getExamData = useCallback(
    (examId) => {
      return examDataCache[examId] || null;
    },
    [examDataCache]
  );

  // Check if exam data is loading
  const isExamDataLoading = useCallback(
    (examId) => {
      return loadingExamData[examId] === true;
    },
    [loadingExamData]
  );

  // Initialize - load exams on mount (immediately)
  useEffect(() => {
    // Load exams immediately on mount - don't wait
    loadExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  const value = {
    // State
    exams,
    examDataCache,
    loadingExams,
    selectedExamId,
    setSelectedExamId,
    
    // Functions
    loadExams,
    loadExamData,
    getExamBySlug,
    getExamData,
    isExamDataLoading,
  };

  return (
    <ExamDataContext.Provider value={value}>
      {children}
    </ExamDataContext.Provider>
  );
};

