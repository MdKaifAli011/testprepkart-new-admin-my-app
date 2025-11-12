"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import MainLayout from "../layout/MainLayout";
import { FaGraduationCap } from "react-icons/fa";
import ListItem from "../components/ListItem";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import {
  fetchExamById,
  fetchSubjectsByExam,
  createSlug,
  fetchExams,
} from "../lib/api";
import { useDataFetching } from "../lib/hooks/useDataFetching";
import { ERROR_MESSAGES, PLACEHOLDERS } from "@/constants";
import { getNextExam, getPreviousExam } from "../lib/hierarchicalNavigation";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const MATHJAX_SCRIPT_SRC = "/vendor/mathjax/MathJax.js?config=TeX-AMS_HTML";

const loadMathJax = () => {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.MathJax) return Promise.resolve(window.MathJax);

  if (!loadMathJax.promise) {
    loadMathJax.promise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        `script[src="${MATHJAX_SCRIPT_SRC}"]`
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(window.MathJax), {
          once: true,
        });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = MATHJAX_SCRIPT_SRC;
      script.async = true;
      script.addEventListener("load", () => resolve(window.MathJax), {
        once: true,
      });
      script.addEventListener("error", reject, { once: true });
      document.head.appendChild(script);
    });
  }

  return loadMathJax.promise;
};

const RichContent = ({ html }) => {
  const containerRef = useRef(null);

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
          console.error("MathJax typeset failed", error);
        }
      })
      .catch((error) => {
        console.error("Unable to load MathJax", error);
      });

    return () => {
      isMounted = false;
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className="rich-text-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

const TABS = ["Overview", "Discussion Forum", "Practice Test", "Performance"];

const ExamPage = () => {
  const { exam: examId } = useParams();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [nextNav, setNextNav] = useState(null);
  const [prevNav, setPrevNav] = useState(null);
  const [exams, setExams] = useState([]);
  const [currentExamIndex, setCurrentExamIndex] = useState(-1);

  // Optimized data fetching with caching
  const {
    data: exam,
    isLoading: examLoading,
    error: examError,
  } = useDataFetching(
    async () => {
      const fetchedExam = await fetchExamById(examId);
      if (!fetchedExam) {
        throw new Error(ERROR_MESSAGES.EXAM_NOT_FOUND);
      }
      return fetchedExam;
    },
    [examId],
    { cacheKey: `exam-${examId}`, enabled: !!examId }
  );

  const {
    data: subjects,
    isLoading: subjectsLoading,
    error: subjectsError,
  } = useDataFetching(
    async () => {
      if (!exam?._id) return [];
      return await fetchSubjectsByExam(exam._id || examId);
    },
    [exam?._id, examId],
    { cacheKey: `subjects-${exam?._id || examId}`, enabled: !!exam }
  );

  // Memoize exam slug to avoid recalculation - MUST be before any useEffect that uses it
  const examSlug = useMemo(() => {
    return exam ? createSlug(exam.name) : "";
  }, [exam]);

  // Calculate navigation
  useEffect(() => {
    const calculateNavigation = async () => {
      if (!exam?._id) return;

      try {
        // Fetch all exams to get index
        const allExams = await fetchExams({ limit: 100 });
        setExams(allExams);
        const examIndex = allExams.findIndex((e) => e._id === exam._id);
        setCurrentExamIndex(examIndex);

        // Calculate next navigation
        const next = await getNextExam({
          examId: exam._id,
          examSlug: examSlug,
          currentIndex: examIndex,
          allItems: allExams,
        });
        setNextNav(next);

        // Calculate previous navigation
        const prev = await getPreviousExam({
          examId: exam._id,
          examSlug: examSlug,
          currentIndex: examIndex,
          allItems: allExams,
        });
        setPrevNav(prev);
      } catch (error) {
        console.error("Error calculating navigation:", error);
      }
    };

    if (exam) {
      calculateNavigation();
    }
  }, [exam, examSlug]);

  const isLoading = examLoading || subjectsLoading;
  const error = examError || subjectsError;

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !exam) {
    return <ErrorState message={error || ERROR_MESSAGES.EXAM_NOT_FOUND} />;
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <section className="bg-linear-to-b from-purple-50/40 via-white to-purple-50/30 border border-purple-100 rounded-xl p-5 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-indigo-900">
                {exam.name} Exam Preparation
              </h1>
              <p className="text-sm text-gray-600">
                Prepare with expert guidance and resources for your {exam.name}{" "}
                exam.
              </p>
            </div>

            {/* Progress */}
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">My Preparation</p>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-700">0%</span>
                <div className="w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: "0%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="bg-white rounded-xl shadow-md border border-gray-100">
          {/* Tab Navigation */}
          <nav className="flex overflow-x-auto sm:overflow-visible border-b border-gray-200 bg-gray-50">
            <div className="flex min-w-max sm:min-w-0 w-full justify-start sm:justify-around">
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                      isActive
                        ? "text-blue-600 border-blue-600 bg-white"
                        : "text-gray-500 hover:text-gray-700 border-transparent"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Tab Content */}
          <div className="p-4 sm:p-6 text-gray-600 text-sm sm:text-base">
            {activeTab === "Overview" && (
              <div className="prose prose-sm sm:prose max-w-none">
                {exam?.content ? (
                  <RichContent html={exam.content} />
                ) : (
                  <div className="text-gray-500 italic">
                    <p>No content available for this exam.</p>
                    <p className="text-xs sm:text-sm mt-2">
                      Content can be added from the admin panel.
                    </p>
                  </div>
                )}
              </div>
            )}
            {activeTab === "Discussion Forum" && (
              <div>Discussion Forum content will appear here...</div>
            )}
            {activeTab === "Practice Test" && (
              <div>Practice Test content will appear here...</div>
            )}
            {activeTab === "Performance" && (
              <div>Performance content will appear here...</div>
            )}
          </div>
        </section>

        {/* Subjects Section */}
        <section className="bg-transparent">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
              <div className="flex items-start gap-2">
                <FaGraduationCap className="text-lg sm:text-xl text-indigo-600" />
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {exam.name} Subjects
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Explore subjects and track completion progress for this
                    exam.
                  </p>
                </div>
              </div>
              <div className="mt-3 hidden sm:grid sm:grid-cols-[minmax(0,1fr)_140px_180px] gap-6 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <span className="text-left">Subject</span>
                <span className="text-center">Status</span>
                <span className="text-center">Progress</span>
              </div>
            </div>

            {subjects && subjects.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {subjects.map((subject, index) => {
                  const subjectSlug = createSlug(subject.name);
                  return (
                    <ListItem
                      key={subject._id}
                      item={subject}
                      index={index}
                      href={`/${examSlug}/${subjectSlug}`}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="px-4 sm:px-6 py-10 text-center text-gray-500">
                {PLACEHOLDERS.NO_DATA}
              </div>
            )}
          </div>
        </section>

        {/* Navigation */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              <FaChevronLeft className="text-xs" />
              <span>Back to Home</span>
            </Link>

            <div className="flex items-center gap-4">
              {prevNav && (
                <Link
                  href={prevNav.url}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  title={prevNav.label}
                >
                  <FaChevronLeft className="text-xs" />
                  <span className="hidden sm:inline">Previous</span>
                </Link>
              )}
              {nextNav && (
                <Link
                  href={nextNav.url}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  title={nextNav.label}
                >
                  <span className="hidden sm:inline">Next</span>
                  <FaChevronRight className="text-xs" />
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default ExamPage;
