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
import {
  FaCalendar,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
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

const Sidebar = ({ isOpen = false, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);
  const sidebarRef = useRef(null);

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
  const [searchQuery, setSearchQuery] = useState("");

  const toggle = (setFn, key) =>
    setFn((prev) => ({ ...prev, [key]: !prev[key] }));
  const goTo = (path) => router.push(path);

  // Filter function to check if item matches search query
  const matchesSearch = (text) => {
    if (!searchQuery.trim()) return true;
    return text?.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Filter subjects data based on search query
  const filteredSubjectsData = useMemo(() => {
    if (!searchQuery.trim()) return subjectsWithData;

    const filtered = {};
    Object.entries(subjectsWithData).forEach(([subKey, sub]) => {
      const subjectMatches = matchesSearch(sub.name);
      const filteredUnits = {};

      Object.entries(sub.units || {}).forEach(([unitKey, unit]) => {
        const unitMatches = matchesSearch(unit.name);
        const filteredChapters = {};

        Object.entries(unit.chapters || {}).forEach(([chapterKey, chapter]) => {
          const chapterMatches = matchesSearch(chapter.name);
          const filteredTopics =
            chapter.topics?.filter((topic) => matchesSearch(topic.name)) || [];

          if (
            chapterMatches ||
            filteredTopics.length > 0 ||
            subjectMatches ||
            unitMatches
          ) {
            filteredChapters[chapterKey] = {
              ...chapter,
              topics: filteredTopics,
            };
          }
        });

        if (
          unitMatches ||
          Object.keys(filteredChapters).length > 0 ||
          subjectMatches
        ) {
          filteredUnits[unitKey] = {
            ...unit,
            chapters: filteredChapters,
          };
        }
      });

      if (subjectMatches || Object.keys(filteredUnits).length > 0) {
        filtered[subKey] = {
          ...sub,
          units: filteredUnits,
        };
      }
    });

    return filtered;
  }, [subjectsWithData, searchQuery]);

  // Auto-expand items when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const newExpanded = {};
      Object.keys(filteredSubjectsData).forEach((subKey) => {
        newExpanded[subKey] = true;
        const subject = filteredSubjectsData[subKey];
        Object.keys(subject.units || {}).forEach((unitKey) => {
          setExpandedUnits((prev) => ({ ...prev, [unitKey]: true }));
          const unit = subject.units[unitKey];
          Object.keys(unit.chapters || {}).forEach((chapterKey) => {
            setExpandedChapters((prev) => ({ ...prev, [chapterKey]: true }));
          });
        });
      });
      setExpandedSubjects(newExpanded);
    }
  }, [searchQuery, filteredSubjectsData]);

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
    // Close sidebar on mobile after navigation
    if (onClose && typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose();
    }
  };

  // Close sidebar on navigation (mobile)
  const handleNavigation = (path) => {
    goTo(path);
    if (onClose && typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose();
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

  // Close sidebar on escape key (mobile)
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (isLoading) {
    return (
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 w-72 bg-white border-r border-gray-200 z-50 lg:z-auto transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:flex flex-col overflow-y-auto shadow-sm`}
      >
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
    <aside
      ref={sidebarRef}
      className={`fixed lg:static top-0 left-0 bottom-0  w-72 bg-white border-r border-gray-200 z-55 lg:z-auto transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } lg:flex flex-col overflow-y-auto shadow-sm`}
    >
      <div className="p-4 space-y-4 h-full">
        {/* Mobile Header with Close Button */}
        <div className="flex items-center  justify-between mb-4 lg:hidden pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FaCalendar className="text-indigo-600 text-lg" />
            <h2 className="text-lg font-semibold text-gray-900">
              Navigation Menu
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close navigation menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Exam Dropdown */}
        <div className="relative px-4 pb-4" ref={dropdownRef}>
          <button
            onClick={() => setExamDropdownOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 shadow-sm"
          >
            <div className="flex items-center gap-3 truncate">
              <FaCalendar className="text-blue-600 text-sm" />
              <span className="text-[15px] font-semibold text-gray-900 truncate">
                {selectedExam?.name || "Select Exam"}
              </span>
            </div>
            <FaChevronDown
              className={`text-blue-600 text-xs transition-transform duration-200 ${
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

        {/* Search Input */}
        {selectedExam && Object.keys(subjectsWithData).length > 0 && (
          <div className="px-4 pb-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search subjects, units, chapters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <FaTimes className="text-sm" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Subjects Section */}
        {selectedExam && Object.keys(filteredSubjectsData).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(filteredSubjectsData).map(([subKey, sub]) => {
              const isExpanded = expandedSubjects[subKey] ?? false;
              const isActive = subjectKey && subjectKey === subKey;

              return (
                <div key={subKey} className="rounded-lg overflow-hidden">
                  {/* Subject */}
                  <div
                    className={`flex items-center justify-between rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 border-l-4 border-blue-700 shadow-sm"
                        : "hover:bg-gray-50 border-l-4 border-transparent hover:border-blue-300"
                    }`}
                  >
                    <button
                      onClick={() => {
                        const examSlug = createSlug(selectedExam.name);
                        handleNavigation(`/${examSlug}/${subKey}`);
                        setExpandedSubjects((p) => ({ ...p, [subKey]: true }));
                      }}
                      title={sub.name}
                      className={`flex-1 text-left px-4 py-2.5 text-[15px] font-semibold truncate transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-gray-800 hover:text-blue-600"
                      }`}
                    >
                      {sub.name}
                    </button>
                    <button
                      onClick={() => toggle(setExpandedSubjects, subKey)}
                      className={`p-1.5 rounded transition-colors ${
                        isActive ? "hover:bg-blue-700" : "hover:bg-gray-100"
                      }`}
                      aria-label="Toggle subject"
                    >
                      {isExpanded ? (
                        <FaChevronUp
                          className={`text-xs ${
                            isActive ? "text-white" : "text-gray-500"
                          }`}
                        />
                      ) : (
                        <FaChevronDown
                          className={`text-xs ${
                            isActive ? "text-white" : "text-gray-500"
                          }`}
                        />
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
                        <div className="ml-6 mt-1.5 space-y-1 border-l-2 border-gray-200 pl-3">
                          {Object.entries(sub.units || {}).map(
                            ([unitKeyLoop, unit]) => {
                              const isUnitExpanded =
                                expandedUnits[unitKeyLoop] ?? false;
                              const isUnitActive =
                                subjectKey === subKey &&
                                unitKey === unitKeyLoop;
                              return (
                                <div key={unitKeyLoop}>
                                  <div
                                    className={`flex items-center justify-between rounded transition-all duration-200 ${
                                      isUnitActive
                                        ? "bg-blue-600 border-l-2 border-blue-700 shadow-sm"
                                        : "hover:bg-gray-50"
                                    }`}
                                  >
                                    <button
                                      onClick={() => {
                                        const examSlug = createSlug(
                                          selectedExam.name
                                        );
                                        handleNavigation(
                                          `/${examSlug}/${subKey}/${unitKeyLoop}`
                                        );
                                      }}
                                      title={unit.name}
                                      className={`flex-1 text-left px-3 py-2 text-[14px] font-medium rounded transition-colors truncate ${
                                        isUnitActive
                                          ? "text-white font-semibold"
                                          : "text-gray-700 hover:text-blue-600"
                                      }`}
                                    >
                                      {unit.name}
                                    </button>
                                    {Object.keys(unit.chapters || {}).length >
                                      0 && (
                                      <button
                                        onClick={() =>
                                          toggle(setExpandedUnits, unitKeyLoop)
                                        }
                                        className={`p-1 rounded transition-colors ${
                                          isUnitActive
                                            ? "hover:bg-blue-700"
                                            : "hover:bg-gray-100"
                                        }`}
                                        aria-label="Toggle unit"
                                      >
                                        {isUnitExpanded ? (
                                          <FaChevronUp
                                            className={`text-[10px] ${
                                              isUnitActive
                                                ? "text-white"
                                                : "text-gray-400"
                                            }`}
                                          />
                                        ) : (
                                          <FaChevronDown
                                            className={`text-[10px] ${
                                              isUnitActive
                                                ? "text-white"
                                                : "text-gray-400"
                                            }`}
                                          />
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
                                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                                          {Object.entries(
                                            unit.chapters || {}
                                          ).map(([chapterKeyLoop, chapter]) => {
                                            const isChapExpanded =
                                              expandedChapters[
                                                chapterKeyLoop
                                              ] ?? false;
                                            const isChapterActive =
                                              subjectKey === subKey &&
                                              unitKey === unitKeyLoop &&
                                              chapterKey === chapterKeyLoop;
                                            return (
                                              <div key={chapterKeyLoop}>
                                                <div
                                                  className={`flex items-center justify-between rounded transition-all duration-200 ${
                                                    isChapterActive
                                                      ? "bg-blue-600 border-l-2 border-blue-700 shadow-sm"
                                                      : "hover:bg-gray-50"
                                                  }`}
                                                >
                                                  <button
                                                    onClick={() => {
                                                      const examSlug =
                                                        createSlug(
                                                          selectedExam.name
                                                        );
                                                      handleNavigation(
                                                        `/${examSlug}/${subKey}/${unitKeyLoop}/${chapterKeyLoop}`
                                                      );
                                                    }}
                                                    title={chapter.name}
                                                    className={`flex-1 text-left px-3 py-1.5 text-[13px] rounded transition-colors truncate ${
                                                      isChapterActive
                                                        ? "text-white font-semibold"
                                                        : "text-gray-600 hover:text-blue-600"
                                                    }`}
                                                  >
                                                    {chapter.name}
                                                  </button>
                                                  {chapter.topics?.length >
                                                    0 && (
                                                    <button
                                                      onClick={() =>
                                                        toggle(
                                                          setExpandedChapters,
                                                          chapterKeyLoop
                                                        )
                                                      }
                                                      className={`p-1 rounded transition-colors ${
                                                        isChapterActive
                                                          ? "hover:bg-blue-700"
                                                          : "hover:bg-gray-100"
                                                      }`}
                                                      aria-label="Toggle chapter"
                                                    >
                                                      {isChapExpanded ? (
                                                        <FaChevronUp
                                                          className={`text-[10px] ${
                                                            isChapterActive
                                                              ? "text-white"
                                                              : "text-gray-400"
                                                          }`}
                                                        />
                                                      ) : (
                                                        <FaChevronDown
                                                          className={`text-[10px] ${
                                                            isChapterActive
                                                              ? "text-white"
                                                              : "text-gray-400"
                                                          }`}
                                                        />
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
                                                      <div className="ml-4 mt-1 space-y-1">
                                                        {chapter.topics.map(
                                                          (topic) => {
                                                            const decodedTopicSlug =
                                                              decodeURIComponent(
                                                                topic.slug
                                                              );
                                                            const topicSlugLower =
                                                              topic.slug?.toLowerCase();
                                                            const decodedSlugLower =
                                                              decodedTopicSlug?.toLowerCase();
                                                            const topicNameSlug =
                                                              createSlug(
                                                                topic.name
                                                              ).toLowerCase();
                                                            const currentTopicKeyLower =
                                                              topicKey?.toLowerCase();

                                                            const isTopicActive =
                                                              topicKey &&
                                                              (currentTopicKeyLower ===
                                                                topicSlugLower ||
                                                                currentTopicKeyLower ===
                                                                  decodedSlugLower ||
                                                                currentTopicKeyLower ===
                                                                  topicNameSlug) &&
                                                              subjectKey ===
                                                                subKey &&
                                                              unitKey ===
                                                                unitKeyLoop &&
                                                              chapterKey ===
                                                                chapterKeyLoop;
                                                            return (
                                                              <button
                                                                key={topic.slug}
                                                                onClick={() =>
                                                                  handleNavigation(
                                                                    `/${createSlug(
                                                                      selectedExam.name
                                                                    )}/${subKey}/${unitKeyLoop}/${chapterKeyLoop}/${encodeURIComponent(
                                                                      topic.slug
                                                                    )}`
                                                                  )
                                                                }
                                                                title={
                                                                  topic.name
                                                                }
                                                                className={`w-full text-left px-3 py-1.5 text-[12px] rounded transition-all duration-200 truncate ${
                                                                  isTopicActive
                                                                    ? "bg-blue-600 text-white font-semibold border-l-2 border-blue-700 shadow-sm"
                                                                    : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                                                                }`}
                                                              >
                                                                {topic.name}
                                                              </button>
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
        ) : selectedExam &&
          Object.keys(subjectsWithData).length > 0 &&
          searchQuery.trim() ? (
          <div className="text-sm text-gray-500 text-center py-6 px-4">
            No results found for "{searchQuery}"
          </div>
        ) : (
          <div className="text-sm text-gray-500 text-center py-6 px-4">
            {selectedExam ? "No subjects available" : "Select an exam"}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
