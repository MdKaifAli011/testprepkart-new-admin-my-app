"use client";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaCalendar, FaChevronDown, FaChevronUp } from "react-icons/fa";
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

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  const [examDropdownOpen, setExamDropdownOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [exams, setExams] = useState([]);
  const [subjectsWithData, setSubjectsWithData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadedExamId, setLoadedExamId] = useState(null); // Track which exam data is loaded

  const pathSegments = pathname.toLowerCase().split("/").filter(Boolean);
  const currentExamSlug = pathSegments[0];
  const [subjectKey, unitKey, chapterKey, topicKey] = pathSegments.slice(1);

  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedUnits, setExpandedUnits] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});

  const toggle = (setFn, key) =>
    setFn((prev) => ({ ...prev, [key]: !prev[key] }));
  const goTo = (path) => router.push(path);

  // Update expansion states based on current path (without reloading data)
  const updateExpansionStates = useCallback(
    (data) => {
      const dataToUse = data || subjectsWithData;
      if (!dataToUse || Object.keys(dataToUse).length === 0) return;

      const newSubs = {},
        newUnits = {},
        newChaps = {};

      // If there's a subjectKey in the path, expand based on path
      if (subjectKey) {
        Object.entries(dataToUse).forEach(([sKey, sVal]) => {
          if (sKey === subjectKey) {
            newSubs[sKey] = true;
            Object.entries(sVal.units || {}).forEach(([uKey, uVal]) => {
              if (uKey === unitKey) {
                newUnits[uKey] = true;
                Object.entries(uVal.chapters || {}).forEach(([cKey]) => {
                  if (cKey === chapterKey) {
                    newChaps[cKey] = true;
                  }
                });
              }
            });
          }
        });
      } else {
        // If no subjectKey in path, auto-expand first subject and its first unit
        const subjectEntries = Object.entries(dataToUse);
        if (subjectEntries.length > 0) {
          const [firstSubjectKey, firstSubject] = subjectEntries[0];
          newSubs[firstSubjectKey] = true;

          // Also expand first unit of the first subject
          const unitEntries = Object.entries(firstSubject.units || {});
          if (unitEntries.length > 0) {
            const [firstUnitKey] = unitEntries[0];
            newUnits[firstUnitKey] = true;
          }
        }
      }

      setExpandedSubjects((prev) => ({ ...prev, ...newSubs }));
      setExpandedUnits((prev) => ({ ...prev, ...newUnits }));
      setExpandedChapters((prev) => ({ ...prev, ...newChaps }));
    },
    [subjectKey, unitKey, chapterKey, subjectsWithData]
  );

  // Load full exam data tree - optimized with parallel requests
  // Only loads if data is not already cached for this exam
  const loadExamData = useCallback(
    async (exam) => {
      if (!exam?._id) return;

      // Check if data is already loaded for this exam
      if (
        loadedExamId === exam._id &&
        Object.keys(subjectsWithData).length > 0
      ) {
        // Data already loaded, just update expansion states based on current path
        updateExpansionStates();
        return;
      }

      try {
        const examId = exam._id;
        const subjects = await fetchSubjectsByExam(examId);
        const subjectData = {};

        // Parallel fetch for all subjects' units
        const subjectPromises = subjects.map(async (sub) => {
          const units = await fetchUnitsBySubject(sub._id, examId);
          return { sub, units };
        });

        const subjectResults = await Promise.all(subjectPromises);

        // First, initialize all subjects and units in the data structure
        subjectResults.forEach(({ sub, units }) => {
          const subSlug = createSlug(sub.name);
          if (!subjectData[subSlug]) {
            subjectData[subSlug] = { name: sub.name, units: {} };
          }
          // Add all units, even if they don't have chapters yet
          units.forEach((unit) => {
            const unitSlug = createSlug(unit.name);
            if (!subjectData[subSlug].units[unitSlug]) {
              subjectData[subSlug].units[unitSlug] = {
                name: unit.name,
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
        topicResults.forEach(({ sub, unit, chapter, topics }) => {
          const subSlug = createSlug(sub.name);
          const unitSlug = createSlug(unit.name);
          const chapterSlug = createSlug(chapter.name);

          // Units should already exist from the initialization above
          if (!subjectData[subSlug]?.units[unitSlug]) {
            subjectData[subSlug].units[unitSlug] = {
              name: unit.name,
              chapters: {},
            };
          }
          subjectData[subSlug].units[unitSlug].chapters[chapterSlug] = {
            name: chapter.name,
            topics: topics.map((t) => ({
              name: t.name,
              slug: createSlug(t.name),
            })),
          };
        });

        // Cache the loaded data
        setSubjectsWithData(subjectData);
        setLoadedExamId(examId);

        // Update expansion states based on current path
        updateExpansionStates(subjectData);
      } catch (error) {
        logger.error("Error loading exam data:", error);
      }
    },
    [loadedExamId, subjectsWithData, updateExpansionStates]
  );

  // Load Exams - only when exam changes
  useEffect(() => {
    const loadExams = async () => {
      try {
        const fetchedExams = await fetchExams();
        setExams(fetchedExams);

        if (currentExamSlug) {
          const foundExam = findByIdOrSlug(fetchedExams, currentExamSlug);
          if (foundExam) {
            // Only load data if exam changed
            if (
              selectedExam?._id !== foundExam._id ||
              loadedExamId !== foundExam._id
            ) {
              setSelectedExam(foundExam);
              await loadExamData(foundExam);
            } else {
              // Same exam, just update expansion states for navigation
              setSelectedExam(foundExam);
              updateExpansionStates();
            }
          }
        }
      } catch (error) {
        logger.error("Error loading exams:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExamSlug]); // Only depend on exam slug to avoid unnecessary reloads

  // Update expansion states when path changes (navigation within same exam)
  useEffect(() => {
    if (
      selectedExam &&
      loadedExamId === selectedExam._id &&
      Object.keys(subjectsWithData).length > 0
    ) {
      updateExpansionStates();
    }
  }, [
    subjectKey,
    unitKey,
    chapterKey,
    selectedExam,
    loadedExamId,
    subjectsWithData,
    updateExpansionStates,
  ]);

  const handleExamChange = async (exam) => {
    setExamDropdownOpen(false);
    setSelectedExam(exam);
    const examSlug = createSlug(exam.name);
    goTo(`/${examSlug}`);
    // Clear previous exam data when switching exams
    if (exam._id !== loadedExamId) {
      setSubjectsWithData({});
      setLoadedExamId(null);
      await loadExamData(exam);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    if (!examDropdownOpen) return;
    const close = (e) =>
      !dropdownRef.current?.contains(e.target) && setExamDropdownOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [examDropdownOpen]);

  if (isLoading) {
    return (
      <aside className="w-72 bg-white border-r border-gray-200 hidden lg:block">
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-12 bg-gray-100 rounded-lg"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded"></div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 bg-white border-r border-gray-200 hidden lg:flex flex-col overflow-y-auto shadow-sm">
      <div className="p-4 space-y-4">
        {/* Exam Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setExamDropdownOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
          >
            <div className="flex items-center gap-3 truncate">
              <FaCalendar className="text-gray-600 text-sm" />
              <span className="text-[15px] font-medium text-gray-900 truncate">
                {selectedExam?.name || "Select Exam"}
              </span>
            </div>
            <FaChevronDown
              className={`text-gray-500 text-xs transition-transform duration-200 ${
                examDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {examDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 overflow-hidden"
              >
                {exams.map((exam) => (
                  <button
                    key={exam._id}
                    onClick={() => handleExamChange(exam)}
                    className={`w-full text-left px-4 py-2.5 text-[14px] font-medium transition-colors ${
                      selectedExam?._id === exam._id
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {exam.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subjects Section */}
        {selectedExam && Object.keys(subjectsWithData).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(subjectsWithData).map(([subKey, sub]) => {
              const isExpanded = expandedSubjects[subKey] ?? false;
              const isActive = subjectKey && subjectKey === subKey;

              return (
                <div key={subKey} className="rounded-lg overflow-hidden">
                  {/* Subject */}
                  <div
                    className={`flex items-center justify-between rounded-lg ${
                      isActive
                        ? "bg-blue-50 border-l-4 border-blue-600"
                        : "hover:bg-gray-50 border-l-4 border-transparent"
                    }`}
                  >
                    <button
                      onClick={() => {
                        const examSlug = createSlug(selectedExam.name);
                        goTo(`/${examSlug}/${subKey}`);
                        setExpandedSubjects((p) => ({ ...p, [subKey]: true }));
                      }}
                      title={sub.name}
                      className={`flex-1 text-left px-4 py-2.5 text-[15px] font-semibold truncate ${
                        isActive ? "text-blue-700" : "text-gray-800"
                      }`}
                    >
                      {sub.name}
                    </button>
                    <button
                      onClick={() => toggle(setExpandedSubjects, subKey)}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      aria-label="Toggle subject"
                    >
                      {isExpanded ? (
                        <FaChevronUp className="text-xs text-gray-500" />
                      ) : (
                        <FaChevronDown className="text-xs text-gray-500" />
                      )}
                    </button>
                  </div>

                  {/* Units */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-6 mt-1.5 space-y-0.5 border-l border-gray-200 pl-3">
                          {Object.entries(sub.units || {}).map(
                            ([unitKey, unit]) => {
                              const isUnitExpanded =
                                expandedUnits[unitKey] ?? false;
                              return (
                                <div key={unitKey}>
                                  <div className="flex items-center justify-between">
                                    <button
                                      onClick={() => {
                                        const examSlug = createSlug(
                                          selectedExam.name
                                        );
                                        goTo(
                                          `/${examSlug}/${subKey}/${unitKey}`
                                        );
                                      }}
                                      title={unit.name}
                                      className="flex-1 text-left px-3 py-2 text-[14px] font-medium text-gray-700 hover:bg-gray-50 rounded transition-colors truncate"
                                    >
                                      {unit.name}
                                    </button>
                                    {Object.keys(unit.chapters || {}).length >
                                      0 && (
                                      <button
                                        onClick={() =>
                                          toggle(setExpandedUnits, unitKey)
                                        }
                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        aria-label="Toggle unit"
                                      >
                                        {isUnitExpanded ? (
                                          <FaChevronUp className="text-[10px] text-gray-400" />
                                        ) : (
                                          <FaChevronDown className="text-[10px] text-gray-400" />
                                        )}
                                      </button>
                                    )}
                                  </div>

                                  {/* Chapters */}
                                  <AnimatePresence>
                                    {isUnitExpanded && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-200 pl-3">
                                          {Object.entries(
                                            unit.chapters || {}
                                          ).map(([chapterKey, chapter]) => {
                                            const isChapExpanded =
                                              expandedChapters[chapterKey] ??
                                              false;
                                            return (
                                              <div key={chapterKey}>
                                                <div className="flex items-center justify-between">
                                                  <button
                                                    onClick={() => {
                                                      const examSlug =
                                                        createSlug(
                                                          selectedExam.name
                                                        );
                                                      goTo(
                                                        `/${examSlug}/${subKey}/${unitKey}/${chapterKey}`
                                                      );
                                                    }}
                                                    title={chapter.name}
                                                    className="flex-1 text-left px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded transition-colors truncate"
                                                  >
                                                    {chapter.name}
                                                  </button>
                                                  {chapter.topics?.length >
                                                    0 && (
                                                    <button
                                                      onClick={() =>
                                                        toggle(
                                                          setExpandedChapters,
                                                          chapterKey
                                                        )
                                                      }
                                                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                      aria-label="Toggle chapter"
                                                    >
                                                      {isChapExpanded ? (
                                                        <FaChevronUp className="text-[10px] text-gray-400" />
                                                      ) : (
                                                        <FaChevronDown className="text-[10px] text-gray-400" />
                                                      )}
                                                    </button>
                                                  )}
                                                </div>

                                                {/* Topics */}
                                                <AnimatePresence>
                                                  {isChapExpanded && (
                                                    <motion.div
                                                      initial={{
                                                        opacity: 0,
                                                        height: 0,
                                                      }}
                                                      animate={{
                                                        opacity: 1,
                                                        height: "auto",
                                                      }}
                                                      exit={{
                                                        opacity: 0,
                                                        height: 0,
                                                      }}
                                                      transition={{
                                                        duration: 0.2,
                                                      }}
                                                      className="overflow-hidden"
                                                    >
                                                      <div className="ml-4 mt-1 space-y-0.5">
                                                        {chapter.topics.map(
                                                          (topic) => (
                                                            <button
                                                              key={topic.slug}
                                                              onClick={() =>
                                                                goTo(
                                                                  `/${createSlug(
                                                                    selectedExam.name
                                                                  )}/${subKey}/${unitKey}/${chapterKey}/${encodeURIComponent(
                                                                    topic.slug
                                                                  )}`
                                                                )
                                                              }
                                                              title={topic.name}
                                                              className="w-full text-left px-3 py-1.5 text-[12px] text-gray-600 hover:bg-gray-50 rounded transition-colors truncate"
                                                            >
                                                              {topic.name}
                                                            </button>
                                                          )
                                                        )}
                                                      </div>
                                                    </motion.div>
                                                  )}
                                                </AnimatePresence>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500 text-center py-6">
            {selectedExam ? "No subjects available" : "Select an exam"}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
