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

  const pathSegments = pathname.toLowerCase().split("/").filter(Boolean);
  const currentExamSlug = pathSegments[0];
  const [subjectKey, unitKey, chapterKey, topicKey] = pathSegments.slice(1);

  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedUnits, setExpandedUnits] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});

  const toggle = (setFn, key) =>
    setFn((prev) => ({ ...prev, [key]: !prev[key] }));
  const goTo = (path) => router.push(path);

  // Load Exams
  useEffect(() => {
    const loadExams = async () => {
      try {
        const fetchedExams = await fetchExams();
        setExams(fetchedExams);

        if (currentExamSlug) {
          const foundExam = findByIdOrSlug(fetchedExams, currentExamSlug);
          if (foundExam) {
            setSelectedExam(foundExam);
            loadExamData(foundExam);
          }
        }
      } catch (error) {
        logger.error("Error loading exams:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadExams();
  }, [currentExamSlug]);

  // Load full exam data tree - optimized with parallel requests
  const loadExamData = useCallback(
    async (exam) => {
      if (!exam?._id) return;

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

        setSubjectsWithData(subjectData);

        // Auto expand based on current path
        const newSubs = {},
          newUnits = {},
          newChaps = {};
        Object.entries(subjectData).forEach(([sKey, sVal]) => {
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

        setExpandedSubjects(newSubs);
        setExpandedUnits(newUnits);
        setExpandedChapters(newChaps);
      } catch (error) {
        logger.error("Error loading exam data:", error);
      }
    },
    [subjectKey, unitKey, chapterKey]
  );

  const handleExamChange = async (exam) => {
    setExamDropdownOpen(false);
    setSelectedExam(exam);
    const examSlug = createSlug(exam.name);
    goTo(`/${examSlug}`);
    await loadExamData(exam);
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
      <aside className="w-72 bg-white border-r border-gray-200 hidden lg:block shadow-sm">
        <div className="p-6 space-y-5 animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-200 rounded-md"></div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 bg-gradient-to-b from-white via-blue-50 to-indigo-50 border-r border-gray-200 hidden lg:flex flex-col overflow-y-auto shadow-lgscrollbar-hide">
      <div className="p-5 space-y-6">
        {/* Exam Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setExamDropdownOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-100 to-indigo-200 border border-indigo-300 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center gap-3 truncate">
              <FaCalendar className="text-indigo-700 text-base" />
              <span className="text-[16px] font-semibold text-gray-900 truncate">
                {selectedExam?.name || "Select Exam"}
              </span>
            </div>
            <FaChevronDown
              className={`text-indigo-700 text-sm transition-transform duration-200 ${
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
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-xl z-40 overflow-hidden"
              >
                {exams.map((exam) => (
                  <button
                    key={exam._id}
                    onClick={() => handleExamChange(exam)}
                    className={`w-full text-left px-5 py-2 text-[15px] font-medium hover:bg-indigo-50 transition ${
                      selectedExam?._id === exam._id
                        ? "bg-indigo-100 text-indigo-700 font-semibold"
                        : "text-gray-700"
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
                <div key={subKey} className="rounded-xl overflow-hidden">
                  {/* Subject */}
                  <div
                    className={`flex items-center justify-between rounded-xl ${
                      isActive
                        ? "bg-indigo-100 border-l-4 border-indigo-500"
                        : "hover:bg-indigo-50"
                    }`}
                  >
                    <button
                      onClick={() => {
                        const examSlug = createSlug(selectedExam.name);
                        goTo(`/${examSlug}/${subKey}`);
                        setExpandedSubjects((p) => ({ ...p, [subKey]: true }));
                      }}
                      title={sub.name}
                      className={`flex-1 text-left px-4 py-3 text-[16px] font-semibold text-indigo-800 truncate`}
                    >
                      {sub.name}
                    </button>
                    <button
                      onClick={() => toggle(setExpandedSubjects, subKey)}
                      className="p-2 hover:bg-white/60 rounded-lg"
                    >
                      {isExpanded ? (
                        <FaChevronUp className="text-xs text-gray-600" />
                      ) : (
                        <FaChevronDown className="text-xs text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Units */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.25 }}
                        className="ml-4 mt-2 space-y-1 border-l border-indigo-100 pl-3"
                      >
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
                                      goTo(`/${examSlug}/${subKey}/${unitKey}`);
                                    }}
                                    title={unit.name}
                                    className="flex-1 text-left px-3 py-2 text-[15px] font-medium text-purple-800 hover:bg-purple-50 rounded-lg truncate"
                                  >
                                    {unit.name}
                                  </button>
                                  {Object.keys(unit.chapters || {}).length >
                                    0 && (
                                    <button
                                      onClick={() =>
                                        toggle(setExpandedUnits, unitKey)
                                      }
                                      className="p-1 hover:bg-gray-100 rounded-md"
                                    >
                                      {isUnitExpanded ? (
                                        <FaChevronUp className="text-xs text-gray-500" />
                                      ) : (
                                        <FaChevronDown className="text-xs text-gray-500" />
                                      )}
                                    </button>
                                  )}
                                </div>

                                {/* Chapters */}
                                <AnimatePresence>
                                  {isUnitExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: -10 }}
                                      transition={{ duration: 0.25 }}
                                      className="ml-3 mt-1 space-y-1 border-l border-purple-100 pl-2"
                                    >
                                      {Object.entries(unit.chapters || {}).map(
                                        ([chapterKey, chapter]) => {
                                          const isChapExpanded =
                                            expandedChapters[chapterKey] ??
                                            false;
                                          return (
                                            <div key={chapterKey}>
                                              <div className="flex items-center justify-between">
                                                <button
                                                  onClick={() => {
                                                    const examSlug = createSlug(
                                                      selectedExam.name
                                                    );
                                                    goTo(
                                                      `/${examSlug}/${subKey}/${unitKey}/${chapterKey}`
                                                    );
                                                  }}
                                                  title={chapter.name}
                                                  className="flex-1 text-left px-3 py-1.5 text-[14px] text-indigo-700 hover:bg-indigo-50 rounded-md truncate"
                                                >
                                                  {chapter.name}
                                                </button>
                                                {chapter.topics?.length > 0 && (
                                                  <button
                                                    onClick={() =>
                                                      toggle(
                                                        setExpandedChapters,
                                                        chapterKey
                                                      )
                                                    }
                                                    className="p-1 hover:bg-gray-100 rounded-md"
                                                  >
                                                    {isChapExpanded ? (
                                                      <FaChevronUp className="text-xs text-gray-500" />
                                                    ) : (
                                                      <FaChevronDown className="text-xs text-gray-500" />
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
                                                      x: -10,
                                                    }}
                                                    animate={{
                                                      opacity: 1,
                                                      x: 0,
                                                    }}
                                                    exit={{
                                                      opacity: 0,
                                                      x: -10,
                                                    }}
                                                    transition={{
                                                      duration: 0.25,
                                                    }}
                                                    className="ml-3 mt-1 space-y-1"
                                                  >
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
                                                          className="w-full text-left px-3 py-1.5 text-[13px] text-gray-700 hover:bg-gray-50 rounded-md truncate"
                                                        >
                                                          {topic.name}
                                                        </button>
                                                      )
                                                    )}
                                                  </motion.div>
                                                )}
                                              </AnimatePresence>
                                            </div>
                                          );
                                        }
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          }
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500 text-center py-4">
            {selectedExam ? "No subjects available" : "Select an exam"}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
