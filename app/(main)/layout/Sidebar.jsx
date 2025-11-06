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
import { createSlug } from "../lib/api";
import { useExamData } from "../context/ExamDataContext";

const Sidebar = ({ isOpen = false, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);
  const sidebarRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Use ExamDataContext instead of local state
  const {
    exams,
    examDataCache,
    loadingExams,
    selectedExamId,
    setSelectedExamId,
    loadExamData,
    getExamBySlug,
    getExamData,
    isExamDataLoading,
  } = useExamData();

  const [examDropdownOpen, setExamDropdownOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Memoize path segments to prevent unnecessary re-renders
  const pathSegments = useMemo(() => pathname.toLowerCase().split("/").filter(Boolean), [pathname]);
  const currentExamSlug = useMemo(() => pathSegments[0], [pathSegments]);
  const pathKeys = useMemo(() => {
    const keys = pathSegments.slice(1);
    return {
      subjectKey: keys[0],
      unitKey: keys[1],
      chapterKey: keys[2],
      topicKey: keys[3],
    };
  }, [pathSegments]);
  
  const { subjectKey, unitKey, chapterKey, topicKey } = pathKeys;
  
  // Memoize exam slug to prevent unnecessary re-renders
  const memoizedExamSlug = useMemo(() => currentExamSlug, [currentExamSlug]);

  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedUnits, setExpandedUnits] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});

  // Memoize toggle function to prevent unnecessary re-renders
  const toggle = useCallback((setFn, key) => {
    setFn((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Memoize goTo function to prevent unnecessary re-renders
  const goTo = useCallback((path) => {
    router.push(path);
  }, [router]);

  // Debounced search handler
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(value);
    }, 300);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Filter function to check if item matches search query
  const matchesSearch = useCallback((text) => {
    if (!debouncedSearchQuery.trim()) return true;
    return text?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
  }, [debouncedSearchQuery]);

  // Get current exam data from context
  const subjectsWithData = useMemo(() => {
    if (!selectedExamId) return {};
    return getExamData(selectedExamId) || {};
  }, [selectedExamId, getExamData]);

  // Filter subjects data based on search query
  const filteredSubjectsData = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return subjectsWithData;

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
  }, [subjectsWithData, debouncedSearchQuery, matchesSearch]);

  // Auto-expand items when searching
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
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
  }, [debouncedSearchQuery, filteredSubjectsData]);

  // Update expansion states based on current path (without reloading data)
  const updateExpansionStates = useCallback((data, currentSubjectKey, currentUnitKey, currentChapterKey) => {
    const dataToUse = data || subjectsWithData;
    if (!dataToUse || Object.keys(dataToUse).length === 0) return;

    const newSubs = {},
      newUnits = {},
      newChaps = {};

    // If there's a subjectKey in the path, expand based on path
    if (currentSubjectKey) {
      Object.entries(dataToUse).forEach(([sKey, sVal]) => {
        if (sKey === currentSubjectKey) {
          newSubs[sKey] = true;
          Object.entries(sVal.units || {}).forEach(([uKey, uVal]) => {
            if (uKey === currentUnitKey) {
              newUnits[uKey] = true;
              Object.entries(uVal.chapters || {}).forEach(([cKey]) => {
                if (cKey === currentChapterKey) {
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
  }, [subjectsWithData]); // Dependencies include subjectsWithData

  // Check if currently loading exam data
  const isLoading = useMemo(() => {
    // Don't show loading if exams list is still loading or no exam selected
    if (loadingExams || !selectedExamId) return false;
    return isExamDataLoading(selectedExamId);
  }, [selectedExamId, isExamDataLoading, loadingExams]);

  // Load exam data when exam slug changes - using context
  // Only runs when exam slug changes or exams list becomes available
  useEffect(() => {
    // Early return if no exam slug
    if (!memoizedExamSlug) {
      setSelectedExam(null);
      setSelectedExamId(null);
      return;
    }

    // Wait for exams list to be loaded before trying to find exam
    if (loadingExams || exams.length === 0) {
      return; // Wait for exams to load
    }

    // Get exam from context
    const foundExam = getExamBySlug(memoizedExamSlug);
    
    if (foundExam) {
      const examId = foundExam._id;
      
      // Check if this is the same exam we already have selected
      if (selectedExamId === examId) {
        // Same exam - just update expansion states if data is available
        const examData = getExamData(examId);
        if (examData && Object.keys(examData).length > 0) {
          // Update selectedExam if not set
          if (!selectedExam || selectedExam._id !== examId) {
            setSelectedExam(foundExam);
          }
          updateExpansionStates(examData, subjectKey, unitKey, chapterKey);
        }
        return; // No need to reload
      }
      
      // Different exam or first time - update state
      setSelectedExam(foundExam);
      setSelectedExamId(examId);
      
      // Check if data is already loaded for this exam
      const examData = getExamData(examId);
      
      if (examData && Object.keys(examData).length > 0) {
        // Data already loaded - just update expansion states
        updateExpansionStates(examData, subjectKey, unitKey, chapterKey);
      } else {
        // Data not loaded - load it via context (only if not already loading)
        if (!isExamDataLoading(examId)) {
          loadExamData(examId);
        }
      }
    } else {
      setSelectedExam(null);
      setSelectedExamId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedExamSlug, exams.length, loadingExams, getExamBySlug, getExamData, loadExamData, isExamDataLoading, selectedExamId]);

  // Update expansion states when path changes (navigation within same exam)
  // This should NOT trigger data reloading or loading state, just update UI states
  useEffect(() => {
    // Only update if:
    // 1. Exam is selected and loaded
    // 2. Data is already loaded for this exam
    // 3. We have a valid exam slug
    // 4. Not currently loading
    // 5. Exams list is loaded (not loading)
    if (
      selectedExam &&
      selectedExamId === selectedExam._id &&
      Object.keys(subjectsWithData).length > 0 &&
      memoizedExamSlug &&
      !isLoading &&
      !loadingExams // Don't update if exams list is still loading
    ) {
      // Just update expansion states, no data fetching, no loading state
      // This ensures smooth navigation without showing loading
      updateExpansionStates(subjectsWithData, subjectKey, unitKey, chapterKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectKey, unitKey, chapterKey, topicKey, memoizedExamSlug, subjectsWithData, isLoading, loadingExams]);

  // Memoize handleExamChange to prevent unnecessary re-renders
  const handleExamChange = useCallback(async (exam) => {
    setExamDropdownOpen(false);
    
    // Set selected exam and exam ID
    setSelectedExam(exam);
    setSelectedExamId(exam._id);
    
    // Check if data is already loaded
    const examData = getExamData(exam._id);
    if (!examData || Object.keys(examData).length === 0) {
      // Load exam data via context
      loadExamData(exam._id);
    }
    
    const examSlug = createSlug(exam.name);
    goTo(`/${examSlug}`);
    
    // Close sidebar on mobile after navigation
    if (onClose && typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose();
    }
  }, [getExamData, loadExamData, goTo, onClose]);

  // Memoize handleNavigation to prevent unnecessary re-renders
  const handleNavigation = useCallback((path) => {
    goTo(path);
    if (onClose && typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose();
    }
  }, [goTo, onClose]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!examDropdownOpen) return;
    const close = (e) =>
      !dropdownRef.current?.contains(e.target) && setExamDropdownOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [examDropdownOpen]);

  // Mobile swipe to close and escape key
  useEffect(() => {
    if (!isOpen) return;

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!touchStartX || !touchStartY) return;
      
      const touchEndX = e.touches[0].clientX;
      const touchEndY = e.touches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // If horizontal swipe is more significant than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Swipe left to close
        if (deltaX < -50 && onClose) {
          onClose();
        }
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    const sidebarEl = sidebarRef.current;
    if (sidebarEl) {
      sidebarEl.addEventListener("touchstart", handleTouchStart, { passive: true });
      sidebarEl.addEventListener("touchmove", handleTouchMove, { passive: true });
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      if (sidebarEl) {
        sidebarEl.removeEventListener("touchstart", handleTouchStart);
        sidebarEl.removeEventListener("touchmove", handleTouchMove);
      }
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Improved loading skeleton - only show if:
  // 1. Actually loading exam data AND no data loaded yet
  // 2. OR exams list is loading (first time)
  // But NOT if data is already cached
  const shouldShowLoading = (isLoading && Object.keys(subjectsWithData).length === 0) || 
                             (loadingExams && exams.length === 0 && !memoizedExamSlug);
  
  if (shouldShowLoading) {
    return (
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 w-72 bg-white border-r border-gray-200 z-50 lg:z-auto transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:flex flex-col overflow-y-auto shadow-sm`}
        aria-label="Loading navigation"
      >
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-12 bg-gray-200 rounded-xl"></div>
          <div className="h-10 bg-gray-100 rounded-lg"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-10 bg-gray-200 rounded-lg"></div>
              <div className="h-8 bg-gray-100 rounded ml-6"></div>
              <div className="h-8 bg-gray-100 rounded ml-12"></div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        ref={sidebarRef}
        className={`fixed lg:static top-0 left-0 bottom-0 w-72 bg-white border-r border-gray-200 z-50 lg:z-auto transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:flex flex-col overflow-y-auto shadow-sm`}
        aria-label="Navigation sidebar"
        role="navigation"
      >
        <div className="p-4 space-y-4 h-full">
          {/* Mobile Header with Close Button */}
          <div className="flex items-center justify-between mb-4 lg:hidden pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FaCalendar className="text-indigo-600 text-lg" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">
                Navigation Menu
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-expanded={examDropdownOpen}
              aria-haspopup="listbox"
              aria-label="Select exam"
            >
              <div className="flex items-center gap-3 truncate">
                <FaCalendar className="text-blue-600 text-sm" aria-hidden="true" />
                <span className="text-[15px] font-semibold text-gray-900 truncate">
                  {selectedExam?.name || "Select Exam"}
                </span>
              </div>
              <FaChevronDown
                className={`text-blue-600 text-xs transition-transform duration-200 ${
                  examDropdownOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
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
                  role="listbox"
                >
                  {exams.map((exam) => (
                    <button
                      key={exam._id}
                      onClick={() => handleExamChange(exam)}
                      className={`w-full text-left px-4 py-2.5 text-[14px] font-medium transition-colors ${
                        selectedExam?._id === exam._id
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      } focus:outline-none focus:bg-blue-50`}
                      role="option"
                      aria-selected={selectedExam?._id === exam._id}
                    >
                      {exam.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Input with Debouncing */}
          {selectedExam && Object.keys(subjectsWithData).length > 0 && (
            <div className="px-4 pb-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search subjects, units, chapters..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 transition-all shadow-sm"
                  aria-label="Search navigation"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setDebouncedSearchQuery("");
                      if (searchTimeoutRef.current) {
                        clearTimeout(searchTimeoutRef.current);
                      }
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:text-gray-700"
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
                        className={`flex-1 text-left px-4 py-2.5 text-[15px] font-semibold truncate transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                          isActive
                            ? "text-white"
                            : "text-gray-800 hover:text-blue-600"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {sub.name}
                      </button>
                      <button
                        onClick={() => toggle(setExpandedSubjects, subKey)}
                        className={`p-1.5 rounded transition-colors ${
                          isActive ? "hover:bg-blue-700" : "hover:bg-gray-100"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        aria-label={`Toggle ${sub.name}`}
                        aria-expanded={isExpanded}
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
                                        className={`flex-1 text-left px-3 py-2 text-[14px] font-medium rounded transition-colors truncate focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                                          isUnitActive
                                            ? "text-white font-semibold"
                                            : "text-gray-700 hover:text-blue-600"
                                        }`}
                                        aria-current={isUnitActive ? "page" : undefined}
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
                                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                          aria-label={`Toggle ${unit.name}`}
                                          aria-expanded={isUnitExpanded}
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
                                                      className={`flex-1 text-left px-3 py-1.5 text-[13px] rounded transition-colors truncate focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                                                        isChapterActive
                                                          ? "text-white font-semibold"
                                                          : "text-gray-600 hover:text-blue-600"
                                                      }`}
                                                      aria-current={isChapterActive ? "page" : undefined}
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
                                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                        aria-label={`Toggle ${chapter.name}`}
                                                        aria-expanded={isChapExpanded}
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
                                                                  className={`w-full text-left px-3 py-1.5 text-[12px] rounded transition-all duration-200 truncate focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                                                                    isTopicActive
                                                                      ? "bg-blue-600 text-white font-semibold border-l-2 border-blue-700 shadow-sm"
                                                                      : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                                                                  }`}
                                                                  aria-current={isTopicActive ? "page" : undefined}
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
            debouncedSearchQuery.trim() ? (
            <div className="text-sm text-gray-500 text-center py-6 px-4">
              No results found for "{debouncedSearchQuery}"
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-6 px-4">
              {selectedExam ? "No subjects available" : "Select an exam"}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
