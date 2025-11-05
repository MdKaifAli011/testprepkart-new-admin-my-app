"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "../../../layout/MainLayout";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaBook,
  FaGraduationCap,
  FaUsers,
  FaChartLine,
  FaTrophy,
  FaChevronRight,
} from "react-icons/fa";
import ListItem from "../../../components/ListItem";
import {
  fetchExamById,
  fetchSubjectsByExam,
  fetchSubjectById,
  fetchUnitsBySubject,
  fetchUnitById,
  fetchChaptersByUnit,
  createSlug,
  findByIdOrSlug,
} from "../../../lib/api";

const TABS = ["Overview", "Discussion Forum", "Practice Test", "Performance"];

const UnitPage = () => {
  const { exam: examId, subject: subjectSlug, unit: unitSlug } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(TABS[0]);

  // Data states
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [unit, setUnit] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch exam, subject, unit, and chapters
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch exam
        const fetchedExam = await fetchExamById(examId);
        if (!fetchedExam) {
          setError("Exam not found");
          return;
        }
        setExam(fetchedExam);

        // Fetch subjects for this exam
        const examIdValue = fetchedExam._id || examId;
        const fetchedSubjects = await fetchSubjectsByExam(examIdValue);

        // Find subject by slug
        const foundSubject = findByIdOrSlug(fetchedSubjects, subjectSlug);
        if (!foundSubject) {
          setError("Subject not found");
          return;
        }
        
        // Fetch full subject data including content
        const fullSubjectData = await fetchSubjectById(foundSubject._id);
        setSubject(fullSubjectData || foundSubject);

        // Fetch units for this subject
        const fetchedUnits = await fetchUnitsBySubject(
          foundSubject._id,
          examIdValue
        );

        // Find unit by slug
        const foundUnit = findByIdOrSlug(fetchedUnits, unitSlug);
        if (!foundUnit) {
          setError("Unit not found");
          return;
        }
        
        // Fetch full unit data including content
        const fullUnitData = await fetchUnitById(foundUnit._id);
        setUnit(fullUnitData || foundUnit);

        // Fetch chapters for this unit
        const fetchedChapters = await fetchChaptersByUnit(foundUnit._id);
        setChapters(fetchedChapters);
      } catch (err) {
        // Error handled by setError
        setError("Failed to load unit data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (examId && subjectSlug && unitSlug) {
      loadData();
    }
  }, [examId, subjectSlug, unitSlug]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !exam || !subject || !unit) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || "Unit not found"}
          </div>
        </div>
      </MainLayout>
    );
  }

  const examSlug = createSlug(exam.name);
  const subjectSlugValue = createSlug(subject.name);
  const unitSlugValue = createSlug(unit.name);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <section className="bg-gradient-to-b from-purple-50/40 via-white to-purple-50/30 border border-purple-100 rounded-xl p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FaBook className="text-2xl text-indigo-600" />
                <div>
                  <h1 className="text-2xl font-bold text-indigo-900">
                    {unit.name}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {exam.name} &gt; {subject.name} &gt; {unit.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Unit Progress</p>
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

          <div className="p-6 md:p-8 min-h-[200px]">
            <div className="text-gray-600 leading-relaxed">
              {
                {
                  Overview: (
                    <div className="space-y-4">
                      {unit?.content ? (
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: unit.content,
                          }}
                        />
                      ) : (
                        <>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Unit Overview
                          </h3>
                          <p className="text-gray-600">
                            Welcome to {unit.name} in {subject.name} for{" "}
                            {exam.name}. Here you&apos;ll find comprehensive
                            resources, study materials, and track your progress
                            across all chapters.
                          </p>
                        </>
                      )}

                      {/* Unit Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                          <FaBook className="text-blue-600 text-2xl mb-2" />
                          <h4 className="font-semibold text-gray-900 mb-1">
                            Chapters
                          </h4>
                          <p className="text-sm text-gray-600">
                            {chapters.length} Chapters
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                          <FaChartLine className="text-purple-600 text-2xl mb-2" />
                          <h4 className="font-semibold text-gray-900 mb-1">
                            Unit Overview
                          </h4>
                          <p className="text-sm text-gray-600">
                            Explore all chapters
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                          <FaTrophy className="text-green-600 text-2xl mb-2" />
                          <h4 className="font-semibold text-gray-900 mb-1">
                            Study Resources
                          </h4>
                          <p className="text-sm text-gray-600">
                            Access study materials
                          </p>
                        </div>
                      </div>
                    </div>
                  ),
                  "Discussion Forum": (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Discussion Forum
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Connect with fellow students studying {unit.name} for{" "}
                        {subject.name} in {exam.name}.
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-500 italic">
                          Discussion forum features will be available soon.
                        </p>
                      </div>
                    </div>
                  ),
                  "Practice Test": (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Practice Tests
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Take practice tests specifically designed for{" "}
                        {unit.name} topics.
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-500 italic">
                          Practice tests will be available soon.
                        </p>
                      </div>
                    </div>
                  ),
                  Performance: (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Performance Analytics
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Track your performance in {unit.name} across all
                        chapters.
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-500 italic">
                          Performance analytics will be available soon.
                        </p>
                      </div>
                    </div>
                  ),
                }[activeTab]
              }
            </div>
          </div>
        </section>

        {/* Chapters Section */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <FaBook className="text-xl text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {exam.name} &gt; {subject.name} &gt; {unit.name} Chapters
            </h2>
          </div>

          <div className="space-y-3">
            {chapters.length > 0 ? (
              chapters.map((chapter, index) => {
                const chapterSlug = createSlug(chapter.name);
                return (
                  <ListItem
                    key={chapter._id}
                    item={{
                      name: chapter.name,
                      weightage: chapter.weightage || "20%",
                      engagement: chapter.engagement || "2.2K",
                      isCompleted: chapter.isCompleted || false,
                      progress: chapter.progress || 0,
                    }}
                    index={index}
                    href={`/${examSlug}/${subjectSlugValue}/${unitSlugValue}/${chapterSlug}`}
                  />
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No chapters available for this unit.
              </div>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default UnitPage;

