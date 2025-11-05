"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import MainLayout from "../layout/MainLayout";
import { FaGraduationCap } from "react-icons/fa";
import ListItem from "../components/ListItem";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import { fetchExamById, fetchSubjectsByExam, createSlug } from "../lib/api";
import { useDataFetching } from "../lib/hooks/useDataFetching";
import { ERROR_MESSAGES, PLACEHOLDERS } from "@/constants";

const TABS = ["Overview", "Discussion Forum", "Practice Test", "Performance"];

const ExamPage = () => {
  const { exam: examId } = useParams();
  const [activeTab, setActiveTab] = useState(TABS[0]);

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

  // Memoize exam slug to avoid recalculation - MUST be before any early returns
  const examSlug = useMemo(() => {
    return exam ? createSlug(exam.name) : "";
  }, [exam]);

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
        <section className="bg-gradient-to-b from-purple-50/40 via-white to-purple-50/30 border border-purple-100 rounded-xl p-5">
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
          <nav className="flex justify-around border-b border-gray-200 bg-gray-50">
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </nav>

          <div className="p-6 text-gray-600">
            {activeTab === "Overview" && (
              <div className="prose prose-sm max-w-none">
                {exam?.content ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: exam.content,
                    }}
                  />
                ) : (
                  <div className="text-gray-500 italic">
                    <p>No content available for this exam.</p>
                    <p className="text-sm mt-2">
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
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <FaGraduationCap className="text-xl text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {exam.name} Subjects
            </h2>
          </div>

          <div className="space-y-3">
            {subjects && subjects.length > 0 ? (
              subjects.map((subject, index) => {
                const subjectSlug = createSlug(subject.name);
                return (
                  <ListItem
                    key={subject._id}
                    item={subject}
                    index={index}
                    href={`/${examSlug}/${subjectSlug}`}
                  />
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                {PLACEHOLDERS.NO_DATA}
              </div>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default ExamPage;
