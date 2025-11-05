"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "../../../../layout/MainLayout";
import { useParams, notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { FaBook, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ListItem from "../../../../components/ListItem";
import LoadingState from "../../../../components/LoadingState";
import ErrorState from "../../../../components/ErrorState";
import { ERROR_MESSAGES } from "@/constants";
import {
  fetchExamById,
  fetchSubjectsByExam,
  fetchSubjectById,
  fetchUnitsBySubject,
  fetchUnitById,
  fetchChaptersByUnit,
  fetchChapterById,
  fetchTopicsByChapter,
  createSlug,
  findByIdOrSlug,
} from "../../../../lib/api";
import {
  getNextChapter,
  getPreviousChapter,
} from "../../../../lib/hierarchicalNavigation";

const TABS = ["Overview", "Discussion Forum", "Practice Test", "Performance"];

const ChapterPage = () => {
  const {
    exam: examId,
    subject: subjectSlug,
    unit: unitSlug,
    chapter: chapterSlug,
  } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(TABS[0]);

  // Data states
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [unit, setUnit] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [topics, setTopics] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextNav, setNextNav] = useState(null);
  const [prevNav, setPrevNav] = useState(null);

  // Fetch exam, subject, unit, chapter, and topics
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch exam
        const fetchedExam = await fetchExamById(examId);
        if (!fetchedExam) {
          notFound();
          return;
        }
        setExam(fetchedExam);

        // Fetch subjects for this exam
        const examIdValue = fetchedExam._id || examId;
        const fetchedSubjects = await fetchSubjectsByExam(examIdValue);

        // Find subject by slug
        const foundSubject = findByIdOrSlug(fetchedSubjects, subjectSlug);
        if (!foundSubject) {
          notFound();
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
          notFound();
          return;
        }
        
        // Fetch full unit data including content
        const fullUnitData = await fetchUnitById(foundUnit._id);
        setUnit(fullUnitData || foundUnit);

        // Fetch chapters for this unit
        const fetchedChapters = await fetchChaptersByUnit(foundUnit._id);
        setChapters(fetchedChapters);

        // Find chapter by slug
        const foundChapter = findByIdOrSlug(fetchedChapters, chapterSlug);
        if (!foundChapter) {
          notFound();
          return;
        }
        
        // Fetch full chapter data including content
        const fullChapterData = await fetchChapterById(foundChapter._id);
        setChapter(fullChapterData || foundChapter);

        // Find current chapter index for navigation
        const chapterIndex = fetchedChapters.findIndex(
          (c) =>
            c._id === foundChapter._id ||
            createSlug(c.name) === chapterSlug ||
            c.name?.toLowerCase() === chapterSlug.toLowerCase()
        );
        setCurrentChapterIndex(chapterIndex);

        // Fetch topics for this chapter
        const fetchedTopics = await fetchTopicsByChapter(foundChapter._id);
        setTopics(fetchedTopics);

        // Calculate hierarchical navigation
        const next = await getNextChapter({
          examId: examIdValue,
          examSlug: createSlug(fetchedExam.name),
          subjectId: foundSubject._id,
          subjectSlug: createSlug(foundSubject.name),
          unitId: foundUnit._id,
          unitSlug: createSlug(foundUnit.name),
          chapterId: foundChapter._id,
          chapterSlug: createSlug(foundChapter.name),
          currentIndex: chapterIndex,
          allItems: fetchedChapters,
        });
        setNextNav(next);

        const prev = await getPreviousChapter({
          examId: examIdValue,
          examSlug: createSlug(fetchedExam.name),
          subjectId: foundSubject._id,
          subjectSlug: createSlug(foundSubject.name),
          unitId: foundUnit._id,
          unitSlug: createSlug(foundUnit.name),
          chapterId: foundChapter._id,
          chapterSlug: createSlug(foundChapter.name),
          currentIndex: chapterIndex,
          allItems: fetchedChapters,
        });
        setPrevNav(prev);
      } catch (err) {
        // Error handled by setError
        setError("Failed to load chapter data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (examId && subjectSlug && unitSlug && chapterSlug) {
      loadData();
    }
  }, [examId, subjectSlug, unitSlug, chapterSlug]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !exam || !subject || !unit || !chapter) {
    return <ErrorState message={error || ERROR_MESSAGES.CHAPTER_NOT_FOUND} />;
  }

  const examSlug = createSlug(exam.name);
  const subjectSlugValue = createSlug(subject.name);
  const unitSlugValue = createSlug(unit.name);
  const chapterSlugValue = createSlug(chapter.name);

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
                    {chapter.name}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {exam.name} &gt; {subject.name} &gt; {unit.name} &gt;{" "}
                    {chapter.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Chapter Progress</p>
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
            {
              {
                Overview: (
                  <div>
                    {chapter?.content ? (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: chapter.content,
                        }}
                      />
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Chapter Overview
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Explore all topics in {chapter.name} for {subject.name}{" "}
                          in {exam.name}. Study materials and resources are
                          available for each topic.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-500 italic">
                            Chapter overview content will be available soon.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ),
                "Discussion Forum": (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Discussion Forum
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Connect with fellow students studying {chapter.name} for{" "}
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
                      Take practice tests for {chapter.name} topics.
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
                      Track your performance in {chapter.name}.
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
        </section>

        {/* Topics Section */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <FaBook className="text-xl text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {exam.name} &gt; {subject.name} &gt; {unit.name} &gt; {chapter.name} Topics
            </h2>
          </div>

          <div className="space-y-3">
            {topics.length > 0 ? (
              topics.map((topic, index) => {
                const topicSlug = createSlug(topic.name);
                return (
                  <ListItem
                    key={topic._id || index}
                    item={{
                      name: topic.name,
                      weightage: topic.weightage || "20%",
                      engagement: topic.engagement || "2.2K",
                      isCompleted: topic.isCompleted || false,
                      progress: topic.progress || 0,
                    }}
                    index={index}
                    href={`/${examSlug}/${subjectSlugValue}/${unitSlugValue}/${chapterSlugValue}/${topicSlug}`}
                  />
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No topics available for this chapter.
              </div>
            )}
          </div>
        </section>

        {/* Navigation */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <Link
              href={`/${examSlug}/${subjectSlugValue}/${unitSlugValue}`}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              <FaChevronLeft className="text-xs" />
              <span>Back to {unit.name}</span>
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

export default ChapterPage;

