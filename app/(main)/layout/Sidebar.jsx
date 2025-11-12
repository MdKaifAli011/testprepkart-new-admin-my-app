"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { FaSearch, FaChevronRight } from "react-icons/fa";
import {
  fetchExams,
  fetchSubjectsByExam,
  fetchUnitsBySubject,
  fetchChaptersByUnit,
  fetchTopicsByChapter,
  createSlug,
  findByIdOrSlug,
} from "../lib/api";

const buildNode = (item) => ({
  id: item?._id ?? "",
  name: item?.name ?? "",
  order: item?.orderNumber ?? 0,
  slug: item?.name ? createSlug(item.name) : "",
});

const filterTreeByQuery = (tree, query) => {
  if (!query) return tree;

  const match = (text) => text.toLowerCase().includes(query);

  return tree
    .map((subject) => {
      const subjectMatches = match(subject.name);
      const filteredUnits = (subject.units || [])
        .map((unit) => {
          const unitMatches = subjectMatches || match(unit.name);
          const filteredChapters = (unit.chapters || [])
            .map((chapter) => {
              const chapterMatches = unitMatches || match(chapter.name);
              const filteredTopics = (chapter.topics || []).filter(
                (topic) => chapterMatches || match(topic.name)
              );

              if (chapterMatches || filteredTopics.length > 0) {
                return {
                  ...chapter,
                  topics: filteredTopics,
                };
              }
              return null;
            })
            .filter(Boolean);

          if (unitMatches || filteredChapters.length > 0) {
            return {
              ...unit,
              chapters: filteredChapters,
            };
          }
          return null;
        })
        .filter(Boolean);

      if (subjectMatches || filteredUnits.length > 0) {
        return {
          ...subject,
          units: filteredUnits,
        };
      }
      return null;
    })
    .filter(Boolean);
};

const Sidebar = ({ isOpen = false, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [exams, setExams] = useState([]);
  const [activeExamId, setActiveExamId] = useState(null);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const hasLoadedExamsRef = useRef(false);
  const treeCacheRef = useRef(new Map());
  const treeLoadingRef = useRef(new Set());

  const pathSegments = useMemo(
    () => pathname.split("/").filter(Boolean),
    [pathname]
  );

  const examSlugFromPath = pathSegments[0] || "";
  const subjectSlugFromPath = pathSegments[1] || "";
  const unitSlugFromPath = pathSegments[2] || "";
  const chapterSlugFromPath = pathSegments[3] || "";
  const topicSlugFromPath = pathSegments[4] || "";

  const activeExam = useMemo(
    () => exams.find((exam) => exam._id === activeExamId) || null,
    [exams, activeExamId]
  );

  const activeExamSlug = activeExam ? createSlug(activeExam.name) : "";

  const closeOnMobile = useCallback(() => {
    if (onClose && typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose();
    }
  }, [onClose]);

  const navigateTo = useCallback(
    (segments = []) => {
      if (!activeExamSlug) return;
      const path = `/${[activeExamSlug, ...segments]
        .filter(Boolean)
        .join("/")}`;
      router.push(path);
      closeOnMobile();
    },
    [activeExamSlug, router, closeOnMobile]
  );

  const loadExams = useCallback(async () => {
    if (hasLoadedExamsRef.current) return;
    hasLoadedExamsRef.current = true;
    try {
      const response = await fetchExams({ limit: 100 });
      setExams(response);
    } catch (err) {
      setError("Unable to load exams.");
    }
  }, []);

  const loadTree = useCallback(async (examId) => {
    if (!examId) {
      setTree([]);
      return;
    }

    if (treeCacheRef.current.has(examId)) {
      setTree(treeCacheRef.current.get(examId));
      setLoading(false);
      return;
    }

    if (treeLoadingRef.current.has(examId)) {
      return;
    }

    treeLoadingRef.current.add(examId);
    setLoading(true);
    setError("");

    try {
      const subjects = await fetchSubjectsByExam(examId);
      const orderedSubjects = (subjects || [])
        .filter((subject) => subject?.name)
        .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));

      const subjectNodes = [];

      for (const subject of orderedSubjects) {
        const subjectNode = {
          ...buildNode(subject),
          units: [],
        };

        const units = await fetchUnitsBySubject(subject._id, examId);
        const orderedUnits = (units || [])
          .filter((unit) => unit?.name)
          .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));

        for (const unit of orderedUnits) {
          const unitNode = {
            ...buildNode(unit),
            chapters: [],
          };

          const chapters = await fetchChaptersByUnit(unit._id);
          const orderedChapters = (chapters || [])
            .filter((chapter) => chapter?.name)
            .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));

          for (const chapter of orderedChapters) {
            const chapterNode = {
              ...buildNode(chapter),
              topics: [],
            };

            const topics = await fetchTopicsByChapter(chapter._id);
            const orderedTopics = (topics || [])
              .filter((topic) => topic?.name)
              .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0))
              .map((topic) => buildNode(topic));

            chapterNode.topics = orderedTopics;
            unitNode.chapters.push(chapterNode);
          }

          subjectNode.units.push(unitNode);
        }

        subjectNodes.push(subjectNode);
      }

      treeCacheRef.current.set(examId, subjectNodes);
      setTree(subjectNodes);
    } catch (err) {
      setError("Unable to load sidebar content.");
      setTree([]);
    } finally {
      setLoading(false);
      treeLoadingRef.current.delete(examId);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  useEffect(() => {
    if (exams.length === 0) return;

    const matchedExam =
      findByIdOrSlug(exams, examSlugFromPath) || exams[0] || null;

    if (matchedExam && matchedExam._id !== activeExamId) {
      setActiveExamId(matchedExam._id);
    }
  }, [exams, examSlugFromPath, activeExamId]);

  useEffect(() => {
    if (!activeExamId) {
      setTree([]);
      setLoading(false);
      return;
    }

    loadTree(activeExamId);
  }, [activeExamId, loadTree]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredTree = useMemo(
    () => filterTreeByQuery(tree, normalizedQuery),
    [tree, normalizedQuery]
  );

  const renderLoading = () => (
    <div className="px-4 py-6 space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-4 rounded bg-gray-200 animate-pulse"
        ></div>
      ))}
    </div>
  );

  const renderEmpty = () => (
    <div className="px-4 py-6 text-sm text-gray-500">
      {activeExam
        ? "No navigation data available for this exam."
        : "Select an exam to view its content."}
    </div>
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:flex lg:flex-col`}
        role="navigation"
        aria-label="Exam navigation sidebar"
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <div className="flex items-center justify-between gap-3">
              {onClose && (
                <button
                  className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 transition hover:border-gray-300 hover:bg-gray-100 active:scale-[0.98] lg:hidden"
                  onClick={onClose}
                >
                  Close
                </button>
              )}
            </div>
            {exams.length > 0 && (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Exam
                </label>
                <select
                  value={activeExamId || ""}
                  onChange={(event) => {
                    const nextExamId = event.target.value || "";
                    if (!nextExamId) return;
                    setActiveExamId(nextExamId);
                    const nextExam =
                      exams.find((exam) => exam._id === nextExamId) || null;
                    if (nextExam) {
                      const slug = createSlug(nextExam.name);
                      router.push(`/${slug}`);
                      closeOnMobile();
                    }
                  }}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Select an exam
                  </option>
                  {exams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {tree.length > 0 && (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Search
                </label>
                <div className="relative">
                  <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Find subjects, units, chapters, topics"
                    className="w-full rounded-md border border-gray-200 bg-white px-9 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && renderLoading()}
            {!loading && error && (
              <div className="px-4 py-6 text-sm text-red-600">{error}</div>
            )}
            {!loading && !error && filteredTree.length === 0 && renderEmpty()}

            {!loading && !error && filteredTree.length > 0 && (
              <div className="px-3 py-4">
                <ul className="space-y-2">
                  {filteredTree.map((subject) => {
                    const isSubjectActive =
                      subject.slug && subject.slug === subjectSlugFromPath;
                    return (
                      <li
                        key={subject.id}
                        className="rounded-lg border border-gray-200 bg-white shadow-sm"
                      >
                        <button
                          onClick={() => navigateTo([subject.slug])}
                          className={`flex w-full items-center justify-between gap-3 rounded-t-lg px-3 py-2 text-left text-sm font-semibold transition ${
                            isSubjectActive
                              ? "bg-blue-600 text-white shadow-inner"
                              : "text-gray-800 hover:bg-gray-100"
                          }`}
                        >
                          <span className="truncate">{subject.name}</span>
                          <FaChevronRight
                            className={`h-3 w-3 flex-shrink-0 ${
                              isSubjectActive ? "text-white" : "text-gray-400"
                            }`}
                          />
                        </button>

                        {subject.units.length > 0 && (
                          <ul className="space-y-1 border-t border-gray-200 bg-gray-50 px-3 py-2">
                            {subject.units.map((unit) => {
                              const isUnitActive =
                                isSubjectActive &&
                                unit.slug === unitSlugFromPath;
                              return (
                                <li
                                  key={unit.id}
                                  className="rounded-md border border-transparent transition hover:border-gray-200"
                                >
                                  <button
                                    onClick={() =>
                                      navigateTo([subject.slug, unit.slug])
                                    }
                                    className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                                      isUnitActive
                                        ? "bg-blue-100 text-blue-700 font-semibold"
                                        : "text-gray-700 hover:bg-white"
                                    }`}
                                  >
                                    {unit.name}
                                  </button>

                                  {unit.chapters.length > 0 && (
                                    <ul className="mt-1 space-y-1 border-l border-gray-200 pl-3">
                                      {unit.chapters.map((chapter) => {
                                        const isChapterActive =
                                          isUnitActive &&
                                          chapter.slug === chapterSlugFromPath;
                                        return (
                                          <li key={chapter.id}>
                                            <button
                                              onClick={() =>
                                                navigateTo([
                                                  subject.slug,
                                                  unit.slug,
                                                  chapter.slug,
                                                ])
                                              }
                                              className={`w-full rounded px-3 py-2 text-left text-xs transition-colors ${
                                                isChapterActive
                                                  ? "bg-blue-50 text-blue-700 font-semibold"
                                                  : "text-gray-600 hover:bg-gray-100"
                                              }`}
                                            >
                                              {chapter.name}
                                            </button>

                                            {chapter.topics.length > 0 && (
                                              <ul className="mt-1 space-y-1 border-l border-gray-200 pl-3">
                                                {chapter.topics.map((topic) => {
                                                  const isTopicActive =
                                                    isChapterActive &&
                                                    topic.slug ===
                                                      topicSlugFromPath;
                                                  return (
                                                    <li key={topic.id}>
                                                      <button
                                                        onClick={() =>
                                                          navigateTo([
                                                            subject.slug,
                                                            unit.slug,
                                                            chapter.slug,
                                                            topic.slug,
                                                          ])
                                                        }
                                                        className={`w-full rounded px-3 py-1.5 text-left text-xs transition-colors ${
                                                          isTopicActive
                                                            ? "bg-blue-600 text-white font-semibold"
                                                            : "text-gray-600 hover:bg-gray-100"
                                                        }`}
                                                      >
                                                        {topic.name}
                                                      </button>
                                                    </li>
                                                  );
                                                })}
                                              </ul>
                                            )}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
