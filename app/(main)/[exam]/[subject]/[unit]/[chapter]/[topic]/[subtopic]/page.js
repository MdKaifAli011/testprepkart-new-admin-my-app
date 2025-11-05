"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "../../../../../../layout/MainLayout";
import { useParams, notFound, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaBook,
  FaFileAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import LoadingState from "../../../../../../components/LoadingState";
import ErrorState from "../../../../../../components/ErrorState";
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
  fetchTopicById,
  fetchSubTopicsByTopic,
  fetchSubTopicById,
  createSlug,
  findByIdOrSlug,
} from "../../../../../../lib/api";

const TABS = ["Overview", "Discussion Forum", "Practice Test", "Performance"];

const SubTopicPage = () => {
  const {
    exam: examId,
    subject: subjectSlug,
    unit: unitSlug,
    chapter: chapterSlug,
    topic: topicSlug,
    subtopic: subtopicSlug,
  } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(TABS[0]);

  // Data states
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [unit, setUnit] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [topic, setTopic] = useState(null);
  const [subTopic, setSubTopic] = useState(null);
  const [allSubTopics, setAllSubTopics] = useState([]);
  const [currentSubTopicIndex, setCurrentSubTopicIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch exam, subject, unit, chapter, topic, and subtopic
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

        // Find chapter by slug
        const foundChapter = findByIdOrSlug(fetchedChapters, chapterSlug);
        if (!foundChapter) {
          notFound();
          return;
        }
        
        // Fetch full chapter data including content
        const fullChapterData = await fetchChapterById(foundChapter._id);
        setChapter(fullChapterData || foundChapter);

        // Fetch topics for this chapter
        const fetchedTopics = await fetchTopicsByChapter(foundChapter._id);

        // Find topic by slug
        const foundTopic = findByIdOrSlug(fetchedTopics, topicSlug);
        if (!foundTopic) {
          notFound();
          return;
        }
        
        // Fetch full topic data including content
        const fullTopicData = await fetchTopicById(foundTopic._id);
        setTopic(fullTopicData || foundTopic);

        // Fetch subtopics for this topic
        const fetchedSubTopics = await fetchSubTopicsByTopic(foundTopic._id);
        setAllSubTopics(fetchedSubTopics);

        // Find subtopic by slug
        const foundSubTopic = findByIdOrSlug(fetchedSubTopics, subtopicSlug);
        if (!foundSubTopic) {
          notFound();
          return;
        }
        
        // Fetch full subtopic data including content
        const fullSubTopicData = await fetchSubTopicById(foundSubTopic._id);
        setSubTopic(fullSubTopicData || foundSubTopic);

        // Find current subtopic index for navigation
        const index = fetchedSubTopics.findIndex(
          (st) =>
            st._id === foundSubTopic._id ||
            createSlug(st.name) === subtopicSlug ||
            st.name?.toLowerCase() === subtopicSlug.toLowerCase()
        );
        setCurrentSubTopicIndex(index);
      } catch (err) {
        // Error handled by setError
        setError("Failed to load subtopic data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (
      examId &&
      subjectSlug &&
      unitSlug &&
      chapterSlug &&
      topicSlug &&
      subtopicSlug
    ) {
      loadData();
    }
  }, [examId, subjectSlug, unitSlug, chapterSlug, topicSlug, subtopicSlug]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (
    error ||
    !exam ||
    !subject ||
    !unit ||
    !chapter ||
    !topic ||
    !subTopic
  ) {
    return <ErrorState message={error || ERROR_MESSAGES.SUBTOPIC_NOT_FOUND} />;
  }

  const examSlug = createSlug(exam.name);
  const subjectSlugValue = createSlug(subject.name);
  const unitSlugValue = createSlug(unit.name);
  const chapterSlugValue = createSlug(chapter.name);
  const topicSlugValue = createSlug(topic.name);

  // Navigation helpers
  const prevSubTopic =
    currentSubTopicIndex > 0 ? allSubTopics[currentSubTopicIndex - 1] : null;
  const nextSubTopic =
    currentSubTopicIndex < allSubTopics.length - 1
      ? allSubTopics[currentSubTopicIndex + 1]
      : null;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <section className="bg-gradient-to-b from-purple-50/40 via-white to-purple-50/30 border border-purple-100 rounded-xl p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FaFileAlt className="text-2xl text-indigo-600" />
                <div>
                  <h1 className="text-2xl font-bold text-indigo-900">
                    {subTopic.name}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {exam.name} &gt; {subject.name} &gt; {unit.name} &gt;{" "}
                    {chapter.name} &gt; {topic.name} &gt; {subTopic.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Sub Topic Progress</p>
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
                    {subTopic?.content ? (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: subTopic.content,
                        }}
                      />
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Sub Topic Overview
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Study materials and resources for {subTopic.name} in{" "}
                          {topic.name} for {chapter.name} in {subject.name} for{" "}
                          {exam.name}.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-500 italic">
                            Sub topic content and study materials will be available
                            soon.
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
                      Ask questions and discuss {subTopic.name} with fellow
                      students.
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
                      Take practice tests for {subTopic.name}.
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
                      Track your performance in {subTopic.name}.
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

        {/* Navigation */}
        <section className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <Link
              href={`/${examSlug}/${subjectSlugValue}/${unitSlugValue}/${chapterSlugValue}/${topicSlugValue}`}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              <FaChevronLeft className="text-xs" />
              <span>Back to {topic.name}</span>
            </Link>

            <div className="flex items-center gap-4">
              {prevSubTopic && (
                <Link
                  href={`/${examSlug}/${subjectSlugValue}/${unitSlugValue}/${chapterSlugValue}/${topicSlugValue}/${createSlug(prevSubTopic.name)}`}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  <FaChevronLeft className="text-xs" />
                  <span className="hidden sm:inline">Previous</span>
                </Link>
              )}
              {nextSubTopic && (
                <Link
                  href={`/${examSlug}/${subjectSlugValue}/${unitSlugValue}/${chapterSlugValue}/${topicSlugValue}/${createSlug(nextSubTopic.name)}`}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
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

export default SubTopicPage;

