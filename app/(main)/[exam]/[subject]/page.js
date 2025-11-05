"use client";
import React, { useMemo, useState, useEffect } from "react";
import MainLayout from "../../layout/MainLayout";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaBook,
  FaGraduationCap,
  FaUsers,
  FaChartLine,
  FaTrophy,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import ListItem from "../../components/ListItem";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import { ERROR_MESSAGES } from "@/constants";
import {
  fetchExamById,
  fetchSubjectsByExam,
  fetchSubjectById,
  fetchUnitsBySubject,
  createSlug,
  findByIdOrSlug,
} from "../../lib/api";
import {
  getNextSubject,
  getPreviousSubject,
} from "../../lib/hierarchicalNavigation";

const TABS = ["Overview", "Discussion Forum", "Practice Test", "Performance"];

const SubjectPage = () => {
  const { exam: examId, subject: subjectSlug } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  
  // Data states
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [units, setUnits] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextNav, setNextNav] = useState(null);
  const [prevNav, setPrevNav] = useState(null);

  // Fetch exam, subject, and units
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
        setSubjects(fetchedSubjects);
        
        // Find subject by slug
        const foundSubject = findByIdOrSlug(fetchedSubjects, subjectSlug);
        if (!foundSubject) {
          setError("Subject not found");
          return;
        }
        
        // Fetch full subject data including content
        const fullSubjectData = await fetchSubjectById(foundSubject._id);
        setSubject(fullSubjectData || foundSubject);

        // Find current subject index for navigation
        const subjectIndex = fetchedSubjects.findIndex(
          (s) =>
            s._id === foundSubject._id ||
            createSlug(s.name) === subjectSlug ||
            s.name?.toLowerCase() === subjectSlug.toLowerCase()
        );
        setCurrentSubjectIndex(subjectIndex);
        
        // Fetch units for this subject
        const fetchedUnits = await fetchUnitsBySubject(
          foundSubject._id,
          examIdValue
        );
        setUnits(fetchedUnits);

        // Calculate hierarchical navigation
        const next = await getNextSubject({
          examId: examIdValue,
          examSlug: createSlug(fetchedExam.name),
          subjectId: foundSubject._id,
          subjectSlug: createSlug(foundSubject.name),
          currentIndex: subjectIndex,
          allItems: fetchedSubjects,
        });
        setNextNav(next);

        const prev = await getPreviousSubject({
          examId: examIdValue,
          examSlug: createSlug(fetchedExam.name),
          subjectId: foundSubject._id,
          subjectSlug: createSlug(foundSubject.name),
          currentIndex: subjectIndex,
          allItems: fetchedSubjects,
        });
        setPrevNav(prev);
      } catch (err) {
        setError("Failed to load subject data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (examId && subjectSlug) {
      loadData();
    }
  }, [examId, subjectSlug]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !exam || !subject) {
    return <ErrorState message={error || ERROR_MESSAGES.SUBJECT_NOT_FOUND} />;
  }

  const examSlug = createSlug(exam.name);
  const subjectSlugValue = createSlug(subject.name);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <section className="bg-gradient-to-b from-purple-50/40 via-white to-purple-50/30 border border-purple-100 rounded-xl p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FaGraduationCap className="text-2xl text-indigo-600" />
                <h1 className="text-2xl font-bold text-indigo-900">
                  {subject.name}
                </h1>
              </div>
              <p className="text-sm text-gray-600 ml-11">
                {exam.name} &gt; {subject.name}
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

          <div className="p-6 md:p-8 min-h-[200px]">
            <div className="text-gray-600 leading-relaxed">
              {
                {
                  Overview: (
                    <div className="space-y-4">
                      {subject?.content ? (
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: subject.content,
                          }}
                        />
                      ) : (
                        <>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Subject Overview
                          </h3>
                          <p className="text-gray-600">
                            Welcome to your {subject.name} preparation for{" "}
                            {exam.name}. Here you&apos;ll find comprehensive
                            resources, study materials, and track your progress
                            across all categories and topics.
                          </p>
                        </>
                      )}

                      {/* Subject Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                          <FaBook className="text-blue-600 text-2xl mb-2" />
                          <h4 className="font-semibold text-gray-900 mb-1">
                            Units
                          </h4>
                          <p className="text-sm text-gray-600">
                            {units.length} Units
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                          <FaChartLine className="text-purple-600 text-2xl mb-2" />
                          <h4 className="font-semibold text-gray-900 mb-1">
                            Subject Overview
                          </h4>
                          <p className="text-sm text-gray-600">
                            Explore all units
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
                        Connect with fellow students studying {subject.name} for{" "}
                        {exam.name}. Ask questions, share knowledge, and get help
                        from the community.
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-500 italic">
                          Discussion forum features will be available soon.
                          Start engaging with your peers!
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
                        {subject.name} topics. Test your knowledge and identify
                        areas for improvement.
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-500 italic">
                          Practice tests will be available soon. Start practicing
                          to excel in your {exam.name} preparation!
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
                        Track your performance in {subject.name} across all
                        categories and topics. Get insights into your strengths
                        and areas that need more focus.
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-500 italic">
                          Performance analytics dashboard will be available
                          soon. Monitor your progress and improve your scores!
                        </p>
                      </div>
                    </div>
                  ),
                }[activeTab]
              }
            </div>
          </div>
        </section>

        {/* Units Section */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <FaBook className="text-xl text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {exam.name} &gt; {subject.name} Units
            </h2>
          </div>

          <div className="space-y-3">
            {units.length > 0 ? (
              units.map((unit, index) => {
                const unitSlug = createSlug(unit.name);
                return (
                  <ListItem
                    key={unit._id}
                    item={{
                      name: unit.name,
                      weightage: unit.weightage || "20%",
                      engagement: unit.engagement || "2.2K",
                      isCompleted: unit.isCompleted || false,
                      progress: unit.progress || 0,
                    }}
                    index={index}
                    href={`/${examSlug}/${subjectSlugValue}/${unitSlug}`}
                  />
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No units available for this subject.
              </div>
            )}
          </div>
        </section>

        {/* Navigation */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <Link
              href={`/${examSlug}`}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              <FaChevronLeft className="text-xs" />
              <span>Back to {exam.name}</span>
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

export default SubjectPage;
