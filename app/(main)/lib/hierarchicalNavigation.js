/**
 * Complete Hierarchical Navigation System
 * Handles Next/Previous navigation across all 6 levels:
 * Exam → Subject → Unit → Chapter → Topic → Subtopic
 *
 * This utility provides functions to calculate the next/previous item
 * in the hierarchy, automatically traversing up levels when needed.
 */

import {
  fetchExams,
  fetchSubjectsByExam,
  fetchUnitsBySubject,
  fetchChaptersByUnit,
  fetchTopicsByChapter,
  fetchSubTopicsByTopic,
  createSlug,
} from "./api";

/**
 * Get the first item in a hierarchy path
 * Used to navigate to the first item when moving up a level
 */
async function getFirstItemInPath({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  chapterId,
  chapterSlug,
  topicId,
  topicSlug,
}) {
  // Priority: Subtopic > Topic > Chapter > Unit > Subject
  if (topicId) {
    try {
      const subtopics = await fetchSubTopicsByTopic(topicId);
      if (subtopics.length > 0) {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${createSlug(
            subtopics[0].name
          )}`,
          label: subtopics[0].name,
          type: "subtopic",
        };
      }
    } catch (error) {
      // Continue to next option
    }
  }

  if (chapterId) {
    try {
      const topics = await fetchTopicsByChapter(chapterId);
      if (topics.length > 0) {
        const firstTopic = topics[0];
        const firstTopicSlug = createSlug(firstTopic.name);
        const subtopics = await fetchSubTopicsByTopic(firstTopic._id);
        if (subtopics.length > 0) {
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${firstTopicSlug}/${createSlug(
              subtopics[0].name
            )}`,
            label: `${firstTopic.name} > ${subtopics[0].name}`,
            type: "subtopic",
          };
        } else {
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${firstTopicSlug}`,
            label: firstTopic.name,
            type: "topic",
          };
        }
      }
    } catch (error) {
      // Continue to next option
    }
  }

  if (unitId) {
    try {
      const chapters = await fetchChaptersByUnit(unitId);
      if (chapters.length > 0) {
        const firstChapter = chapters[0];
        const firstChapterSlug = createSlug(firstChapter.name);
        const topics = await fetchTopicsByChapter(firstChapter._id);
        if (topics.length > 0) {
          const firstTopic = topics[0];
          const firstTopicSlug = createSlug(firstTopic.name);
          const subtopics = await fetchSubTopicsByTopic(firstTopic._id);
          if (subtopics.length > 0) {
            return {
              url: `/${examSlug}/${subjectSlug}/${unitSlug}/${firstChapterSlug}/${firstTopicSlug}/${createSlug(
                subtopics[0].name
              )}`,
              label: `${firstChapter.name} > ${firstTopic.name} > ${subtopics[0].name}`,
              type: "subtopic",
            };
          } else {
            return {
              url: `/${examSlug}/${subjectSlug}/${unitSlug}/${firstChapterSlug}/${firstTopicSlug}`,
              label: `${firstChapter.name} > ${firstTopic.name}`,
              type: "topic",
            };
          }
        } else {
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${firstChapterSlug}`,
            label: firstChapter.name,
            type: "chapter",
          };
        }
      }
    } catch (error) {
      // Continue to next option
    }
  }

  if (subjectId && examId) {
    try {
      const units = await fetchUnitsBySubject(subjectId, examId);
      if (units.length > 0) {
        const firstUnit = units[0];
        const firstUnitSlug = createSlug(firstUnit.name);
        return {
          url: `/${examSlug}/${subjectSlug}/${firstUnitSlug}`,
          label: firstUnit.name,
          type: "unit",
        };
      }
    } catch (error) {
      // Continue to next option
    }
  }

  if (examId) {
    try {
      const subjects = await fetchSubjectsByExam(examId);
      if (subjects.length > 0) {
        const firstSubject = subjects[0];
        const firstSubjectSlug = createSlug(firstSubject.name);
        return {
          url: `/${examSlug}/${firstSubjectSlug}`,
          label: firstSubject.name,
          type: "subject",
        };
      }
    } catch (error) {
      // Continue to next option
    }
  }

  return null;
}

/**
 * Get next navigation for Subtopic level
 */
export async function getNextSubtopic({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  chapterId,
  chapterSlug,
  topicId,
  topicSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try next subtopic in same topic
  if (currentIndex !== undefined && currentIndex < allItems.length - 1) {
    const next = allItems[currentIndex + 1];
    return {
      url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${createSlug(
        next.name
      )}`,
      label: next.name,
      type: "subtopic",
    };
  }

  // 2. Try next topic in same chapter
  try {
    const topics = await fetchTopicsByChapter(chapterId);
    const topicIndex = topics.findIndex((t) => t._id === topicId);
    if (topicIndex < topics.length - 1) {
      const nextTopic = topics[topicIndex + 1];
      const nextTopicSlug = createSlug(nextTopic.name);
      const subtopics = await fetchSubTopicsByTopic(nextTopic._id);
      if (subtopics.length > 0) {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${nextTopicSlug}/${createSlug(
            subtopics[0].name
          )}`,
          label: `${nextTopic.name} > ${subtopics[0].name}`,
          type: "subtopic",
        };
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${nextTopicSlug}`,
          label: nextTopic.name,
          type: "topic",
        };
      }
    }
  } catch (error) {
    console.error("Error fetching next topic:", error);
  }

  // 3. Try next topic in same chapter (STEP BY STEP - go to topic page, not subtopic)
  try {
    const topics = await fetchTopicsByChapter(chapterId);
    const topicIndex = topics.findIndex((t) => t._id === topicId);
    if (topicIndex < topics.length - 1) {
      const nextTopic = topics[topicIndex + 1];
      const nextTopicSlug = createSlug(nextTopic.name);
      // Check if next topic has subtopics
      try {
        const nextTopicSubtopics = await fetchSubTopicsByTopic(nextTopic._id);
        if (nextTopicSubtopics.length > 0) {
          // Next topic has subtopics, go to first subtopic
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${nextTopicSlug}/${createSlug(
              nextTopicSubtopics[0].name
            )}`,
            label: `${nextTopic.name} > ${nextTopicSubtopics[0].name}`,
            type: "subtopic",
          };
        }
      } catch (error) {
        // Continue without subtopics
      }
      // Next topic has no subtopics, go to topic page
      return {
        url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${nextTopicSlug}`,
        label: nextTopic.name,
        type: "topic",
      };
    }
  } catch (error) {
    console.error("Error fetching next topic:", error);
  }

  // 4. Try next chapter in same unit (STEP BY STEP - go to chapter/topic, not subtopic)
  try {
    const chapters = await fetchChaptersByUnit(unitId);
    const chapterIndex = chapters.findIndex((c) => c._id === chapterId);
    if (chapterIndex < chapters.length - 1) {
      const nextChapter = chapters[chapterIndex + 1];
      const nextChapterSlug = createSlug(nextChapter.name);
      // Check if next chapter has topics
      try {
        const nextChapterTopics = await fetchTopicsByChapter(nextChapter._id);
        if (nextChapterTopics.length > 0) {
          const firstTopic = nextChapterTopics[0];
          const firstTopicSlug = createSlug(firstTopic.name);
          // Check if first topic has subtopics
          try {
            const firstTopicSubtopics = await fetchSubTopicsByTopic(
              firstTopic._id
            );
            if (firstTopicSubtopics.length > 0) {
              return {
                url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextChapterSlug}/${firstTopicSlug}/${createSlug(
                  firstTopicSubtopics[0].name
                )}`,
                label: `${nextChapter.name} > ${firstTopic.name} > ${firstTopicSubtopics[0].name}`,
                type: "subtopic",
              };
            }
          } catch (error) {
            // Continue without subtopics
          }
          // First topic has no subtopics, go to topic page
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextChapterSlug}/${firstTopicSlug}`,
            label: `${nextChapter.name} > ${firstTopic.name}`,
            type: "topic",
          };
        }
      } catch (error) {
        // Continue without topics
      }
      // No topics in next chapter, go to chapter page
      return {
        url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextChapterSlug}`,
        label: nextChapter.name,
        type: "chapter",
      };
    }
  } catch (error) {
    console.error("Error fetching next chapter:", error);
  }

  // 5. Try next unit in same subject (STEP BY STEP - go to unit/chapter, not subtopic)
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    const unitIndex = units.findIndex((u) => u._id === unitId);
    if (unitIndex < units.length - 1) {
      const nextUnit = units[unitIndex + 1];
      const nextUnitSlug = createSlug(nextUnit.name);
      // Check if next unit has chapters
      try {
        const nextUnitChapters = await fetchChaptersByUnit(nextUnit._id);
        if (nextUnitChapters.length > 0) {
          const firstChapter = nextUnitChapters[0];
          const firstChapterSlug = createSlug(firstChapter.name);
          // Check if first chapter has topics
          try {
            const firstChapterTopics = await fetchTopicsByChapter(
              firstChapter._id
            );
            if (firstChapterTopics.length > 0) {
              const firstTopic = firstChapterTopics[0];
              const firstTopicSlug = createSlug(firstTopic.name);
              // Check if first topic has subtopics
              try {
                const firstTopicSubtopics = await fetchSubTopicsByTopic(
                  firstTopic._id
                );
                if (firstTopicSubtopics.length > 0) {
                  return {
                    url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}/${firstChapterSlug}/${firstTopicSlug}/${createSlug(
                      firstTopicSubtopics[0].name
                    )}`,
                    label: `${nextUnit.name} > ${firstChapter.name} > ${firstTopic.name} > ${firstTopicSubtopics[0].name}`,
                    type: "subtopic",
                  };
                }
              } catch (error) {
                // Continue without subtopics
              }
              // First topic has no subtopics, go to topic page
              return {
                url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}/${firstChapterSlug}/${firstTopicSlug}`,
                label: `${nextUnit.name} > ${firstChapter.name} > ${firstTopic.name}`,
                type: "topic",
              };
            }
          } catch (error) {
            // Continue without topics
          }
          // No topics in first chapter, go to chapter page
          return {
            url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}/${firstChapterSlug}`,
            label: `${nextUnit.name} > ${firstChapter.name}`,
            type: "chapter",
          };
        }
      } catch (error) {
        // Continue without chapters
      }
      // No chapters in next unit, go to unit page
      return {
        url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}`,
        label: nextUnit.name,
        type: "unit",
      };
    }
  } catch (error) {
    console.error("Error fetching next unit:", error);
  }

  // 6. Try next subject in same exam (STEP BY STEP - go to subject/unit, not subtopic)
  try {
    const subjects = await fetchSubjectsByExam(examId);
    const subjectIndex = subjects.findIndex((s) => s._id === subjectId);
    if (subjectIndex < subjects.length - 1) {
      const nextSubject = subjects[subjectIndex + 1];
      const nextSubjectSlug = createSlug(nextSubject.name);
      // Check if next subject has units
      try {
        const nextSubjectUnits = await fetchUnitsBySubject(
          nextSubject._id,
          examId
        );
        if (nextSubjectUnits.length > 0) {
          const firstUnit = nextSubjectUnits[0];
          const firstUnitSlug = createSlug(firstUnit.name);
          // Check if first unit has chapters
          try {
            const firstUnitChapters = await fetchChaptersByUnit(firstUnit._id);
            if (firstUnitChapters.length > 0) {
              const firstChapter = firstUnitChapters[0];
              const firstChapterSlug = createSlug(firstChapter.name);
              // Check if first chapter has topics
              try {
                const firstChapterTopics = await fetchTopicsByChapter(
                  firstChapter._id
                );
                if (firstChapterTopics.length > 0) {
                  const firstTopic = firstChapterTopics[0];
                  const firstTopicSlug = createSlug(firstTopic.name);
                  // Check if first topic has subtopics
                  try {
                    const firstTopicSubtopics = await fetchSubTopicsByTopic(
                      firstTopic._id
                    );
                    if (firstTopicSubtopics.length > 0) {
                      return {
                        url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}/${firstTopicSlug}/${createSlug(
                          firstTopicSubtopics[0].name
                        )}`,
                        label: `${nextSubject.name} > ${firstUnit.name} > ${firstChapter.name} > ${firstTopic.name} > ${firstTopicSubtopics[0].name}`,
                        type: "subtopic",
                      };
                    }
                  } catch (error) {
                    // Continue without subtopics
                  }
                  // First topic has no subtopics, go to topic page
                  return {
                    url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}/${firstTopicSlug}`,
                    label: `${nextSubject.name} > ${firstUnit.name} > ${firstChapter.name} > ${firstTopic.name}`,
                    type: "topic",
                  };
                }
              } catch (error) {
                // Continue without topics
              }
              // No topics in first chapter, go to chapter page
              return {
                url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}`,
                label: `${nextSubject.name} > ${firstUnit.name} > ${firstChapter.name}`,
                type: "chapter",
              };
            }
          } catch (error) {
            // Continue without chapters
          }
          // No chapters in first unit, go to unit page
          return {
            url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}`,
            label: `${nextSubject.name} > ${firstUnit.name}`,
            type: "unit",
          };
        }
      } catch (error) {
        // Continue without units
      }
      // No units in next subject, go to subject page
      return {
        url: `/${examSlug}/${nextSubjectSlug}`,
        label: nextSubject.name,
        type: "subject",
      };
    }
  } catch (error) {
    console.error("Error fetching next subject:", error);
  }

  // 7. Try next exam (STEP BY STEP - go to exam/subject, not subtopic)
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIndex = exams.findIndex((e) => e._id === examId);
    if (examIndex < exams.length - 1) {
      const nextExam = exams[examIndex + 1];
      const nextExamSlug = createSlug(nextExam.name);
      // Check if next exam has subjects
      try {
        const nextExamSubjects = await fetchSubjectsByExam(nextExam._id);
        if (nextExamSubjects.length > 0) {
          const firstSubject = nextExamSubjects[0];
          const firstSubjectSlug = createSlug(firstSubject.name);
          // Check if first subject has units
          try {
            const firstSubjectUnits = await fetchUnitsBySubject(
              firstSubject._id,
              nextExam._id
            );
            if (firstSubjectUnits.length > 0) {
              const firstUnit = firstSubjectUnits[0];
              const firstUnitSlug = createSlug(firstUnit.name);
              // Check if first unit has chapters
              try {
                const firstUnitChapters = await fetchChaptersByUnit(
                  firstUnit._id
                );
                if (firstUnitChapters.length > 0) {
                  const firstChapter = firstUnitChapters[0];
                  const firstChapterSlug = createSlug(firstChapter.name);
                  // Check if first chapter has topics
                  try {
                    const firstChapterTopics = await fetchTopicsByChapter(
                      firstChapter._id
                    );
                    if (firstChapterTopics.length > 0) {
                      const firstTopic = firstChapterTopics[0];
                      const firstTopicSlug = createSlug(firstTopic.name);
                      // Check if first topic has subtopics
                      try {
                        const firstTopicSubtopics = await fetchSubTopicsByTopic(
                          firstTopic._id
                        );
                        if (firstTopicSubtopics.length > 0) {
                          return {
                            url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}/${firstTopicSlug}/${createSlug(
                              firstTopicSubtopics[0].name
                            )}`,
                            label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name} > ${firstChapter.name} > ${firstTopic.name} > ${firstTopicSubtopics[0].name}`,
                            type: "subtopic",
                          };
                        }
                      } catch (error) {
                        // Continue without subtopics
                      }
                      // First topic has no subtopics, go to topic page
                      return {
                        url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}/${firstTopicSlug}`,
                        label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name} > ${firstChapter.name} > ${firstTopic.name}`,
                        type: "topic",
                      };
                    }
                  } catch (error) {
                    // Continue without topics
                  }
                  // No topics in first chapter, go to chapter page
                  return {
                    url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}`,
                    label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name} > ${firstChapter.name}`,
                    type: "chapter",
                  };
                }
              } catch (error) {
                // Continue without chapters
              }
              // No chapters in first unit, go to unit page
              return {
                url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}`,
                label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name}`,
                type: "unit",
              };
            }
          } catch (error) {
            // Continue without units
          }
          // No units in first subject, go to subject page
          return {
            url: `/${nextExamSlug}/${firstSubjectSlug}`,
            label: `${nextExam.name} > ${firstSubject.name}`,
            type: "subject",
          };
        }
      } catch (error) {
        // Continue without subjects
      }
      // No subjects in next exam, go to exam page
      return {
        url: `/${nextExamSlug}`,
        label: nextExam.name,
        type: "exam",
      };
    }
  } catch (error) {
    console.error("Error fetching next exam:", error);
  }

  return null;
}

/**
 * Get previous navigation for Subtopic level
 */
export async function getPreviousSubtopic({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  chapterId,
  chapterSlug,
  topicId,
  topicSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try previous subtopic in same topic
  if (currentIndex !== undefined && currentIndex > 0) {
    const prev = allItems[currentIndex - 1];
    return {
      url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${createSlug(
        prev.name
      )}`,
      label: prev.name,
      type: "subtopic",
    };
  }

  // 2. Try previous topic in same chapter
  try {
    const topics = await fetchTopicsByChapter(chapterId);
    const topicIndex = topics.findIndex((t) => t._id === topicId);
    if (topicIndex > 0) {
      const prevTopic = topics[topicIndex - 1];
      const prevTopicSlug = createSlug(prevTopic.name);
      const subtopics = await fetchSubTopicsByTopic(prevTopic._id);
      if (subtopics.length > 0) {
        // Get last subtopic of previous topic
        const lastSubtopic = subtopics[subtopics.length - 1];
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${prevTopicSlug}/${createSlug(
            lastSubtopic.name
          )}`,
          label: `${prevTopic.name} > ${lastSubtopic.name}`,
          type: "subtopic",
        };
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${prevTopicSlug}`,
          label: prevTopic.name,
          type: "topic",
        };
      }
    }
  } catch (error) {
    console.error("Error fetching previous topic:", error);
  }

  // 3. Try previous chapter in same unit
  try {
    const chapters = await fetchChaptersByUnit(unitId);
    const chapterIndex = chapters.findIndex((c) => c._id === chapterId);
    if (chapterIndex > 0) {
      const prevChapter = chapters[chapterIndex - 1];
      const prevChapterSlug = createSlug(prevChapter.name);
      // Get last item in previous chapter
      const topics = await fetchTopicsByChapter(prevChapter._id);
      if (topics.length > 0) {
        const lastTopic = topics[topics.length - 1];
        const lastTopicSlug = createSlug(lastTopic.name);
        const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
        if (subtopics.length > 0) {
          const lastSubtopic = subtopics[subtopics.length - 1];
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevChapterSlug}/${lastTopicSlug}/${createSlug(
              lastSubtopic.name
            )}`,
            label: `${prevChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
            type: "subtopic",
          };
        } else {
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevChapterSlug}/${lastTopicSlug}`,
            label: `${prevChapter.name} > ${lastTopic.name}`,
            type: "topic",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevChapterSlug}`,
          label: prevChapter.name,
          type: "chapter",
        };
      }
    }
  } catch (error) {
    console.error("Error fetching previous chapter:", error);
  }

  // Continue with unit, subject, exam (similar logic)
  // For brevity, returning null for now - can be extended
  // 3. Try previous unit
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    const unitIndex = units.findIndex((u) => u._id === unitId);
    if (unitIndex > 0) {
      const prevUnit = units[unitIndex - 1];
      const prevUnitSlug = createSlug(prevUnit.name);
      // Get last item in previous unit
      const chapters = await fetchChaptersByUnit(prevUnit._id);
      if (chapters.length > 0) {
        const lastChapter = chapters[chapters.length - 1];
        const lastChapterSlug = createSlug(lastChapter.name);
        const topics = await fetchTopicsByChapter(lastChapter._id);
        if (topics.length > 0) {
          const lastTopic = topics[topics.length - 1];
          const lastTopicSlug = createSlug(lastTopic.name);
          const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
          if (subtopics.length > 0) {
            const lastSubtopic = subtopics[subtopics.length - 1];
            return {
              url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${createSlug(
                lastSubtopic.name
              )}`,
              label: `${prevUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
              type: "subtopic",
            };
          } else {
            return {
              url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}/${lastTopicSlug}`,
              label: `${prevUnit.name} > ${lastChapter.name} > ${lastTopic.name}`,
              type: "topic",
            };
          }
        } else {
          return {
            url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}`,
            label: `${prevUnit.name} > ${lastChapter.name}`,
            type: "chapter",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}`,
          label: prevUnit.name,
          type: "unit",
        };
      }
    }
  } catch (error) {
    console.error("Error fetching previous unit:", error);
  }

  // 4. Try previous subject
  try {
    const subjects = await fetchSubjectsByExam(examId);
    const subjectIndex = subjects.findIndex((s) => s._id === subjectId);
    if (subjectIndex > 0) {
      const prevSubject = subjects[subjectIndex - 1];
      const prevSubjectSlug = createSlug(prevSubject.name);
      // Get last item in previous subject
      const units = await fetchUnitsBySubject(prevSubject._id, examId);
      if (units.length > 0) {
        const lastUnit = units[units.length - 1];
        const lastUnitSlug = createSlug(lastUnit.name);
        return {
          url: `/${examSlug}/${prevSubjectSlug}/${lastUnitSlug}`,
          label: `${prevSubject.name} > ${lastUnit.name}`,
          type: "unit",
        };
      } else {
        return {
          url: `/${examSlug}/${prevSubjectSlug}`,
          label: prevSubject.name,
          type: "subject",
        };
      }
    }
  } catch (error) {
    console.error("Error fetching previous subject:", error);
  }

  // 5. Try previous exam
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIndex = exams.findIndex((e) => e._id === examId);
    if (examIndex > 0) {
      const prevExam = exams[examIndex - 1];
      const prevExamSlug = createSlug(prevExam.name);
      // Get last item in previous exam
      const subjects = await fetchSubjectsByExam(prevExam._id);
      if (subjects.length > 0) {
        const lastSubject = subjects[subjects.length - 1];
        const lastSubjectSlug = createSlug(lastSubject.name);
        return {
          url: `/${prevExamSlug}/${lastSubjectSlug}`,
          label: `${prevExam.name} > ${lastSubject.name}`,
          type: "subject",
        };
      } else {
        return {
          url: `/${prevExamSlug}`,
          label: prevExam.name,
          type: "exam",
        };
      }
    }
  } catch (error) {
    console.error("Error fetching previous exam:", error);
  }

  return null;
}

/**
 * Get next navigation for Topic level
 */
export async function getNextTopic({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  chapterId,
  chapterSlug,
  topicId,
  topicSlug,
  currentIndex,
  allItems,
}) {
  // 1. First check if current topic has subtopics - if yes, go to first subtopic
  try {
    const currentTopicSubtopics = await fetchSubTopicsByTopic(topicId);
    if (currentTopicSubtopics.length > 0) {
      return {
        url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${createSlug(
          currentTopicSubtopics[0].name
        )}`,
        label: `${allItems[currentIndex]?.name || "Topic"} > ${
          currentTopicSubtopics[0].name
        }`,
        type: "subtopic",
      };
    }
  } catch (error) {
    // Continue to next topic - no subtopics in current topic
  }

  // 2. If no subtopics in current topic, go to next topic in same chapter
  if (currentIndex !== undefined && currentIndex < allItems.length - 1) {
    const next = allItems[currentIndex + 1];
    const nextSlug = createSlug(next.name);
    // Check if next topic has subtopics
    try {
      const subtopics = await fetchSubTopicsByTopic(next._id);
      if (subtopics.length > 0) {
        // Next topic has subtopics, go to first subtopic
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${nextSlug}/${createSlug(
            subtopics[0].name
          )}`,
          label: `${next.name} > ${subtopics[0].name}`,
          type: "subtopic",
        };
      }
    } catch (error) {
      // Continue without subtopics
    }
    // Next topic has no subtopics, go to topic page
    return {
      url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${nextSlug}`,
      label: next.name,
      type: "topic",
    };
  }

  // 2. Try next chapter (STEP BY STEP - only go to chapter/topic, not deeper)
  try {
    const chapters = await fetchChaptersByUnit(unitId);
    const chapterIndex = chapters.findIndex((c) => c._id === chapterId);
    if (chapterIndex < chapters.length - 1) {
      const nextChapter = chapters[chapterIndex + 1];
      const nextChapterSlug = createSlug(nextChapter.name);
      // Check if next chapter has topics
      try {
        const nextChapterTopics = await fetchTopicsByChapter(nextChapter._id);
        if (nextChapterTopics.length > 0) {
          const firstTopic = nextChapterTopics[0];
          const firstTopicSlug = createSlug(firstTopic.name);
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextChapterSlug}/${firstTopicSlug}`,
            label: `${nextChapter.name} > ${firstTopic.name}`,
            type: "topic",
          };
        }
      } catch (error) {
        // Continue without topics
      }
      // No topics in next chapter, just go to chapter page
      return {
        url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextChapterSlug}`,
        label: nextChapter.name,
        type: "chapter",
      };
    }
  } catch (error) {
    console.error("Error fetching next chapter:", error);
  }

  // 3. Try next unit in same subject (STEP BY STEP - only go to unit/chapter, not deeper)
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    const unitIndex = units.findIndex((u) => u._id === unitId);
    if (unitIndex < units.length - 1) {
      const nextUnit = units[unitIndex + 1];
      const nextUnitSlug = createSlug(nextUnit.name);
      // Check if next unit has chapters
      try {
        const nextUnitChapters = await fetchChaptersByUnit(nextUnit._id);
        if (nextUnitChapters.length > 0) {
          const firstChapter = nextUnitChapters[0];
          const firstChapterSlug = createSlug(firstChapter.name);
          return {
            url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}/${firstChapterSlug}`,
            label: `${nextUnit.name} > ${firstChapter.name}`,
            type: "chapter",
          };
        }
      } catch (error) {
        // Continue without chapters
      }
      // No chapters in next unit, just go to unit page
      return {
        url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}`,
        label: nextUnit.name,
        type: "unit",
      };
    }
  } catch (error) {
    console.error("Error fetching next unit:", error);
  }

  // 4. Try next subject in same exam (STEP BY STEP - only go to subject/unit, not deeper)
  try {
    const subjects = await fetchSubjectsByExam(examId);
    const subjectIndex = subjects.findIndex((s) => s._id === subjectId);
    if (subjectIndex < subjects.length - 1) {
      const nextSubject = subjects[subjectIndex + 1];
      const nextSubjectSlug = createSlug(nextSubject.name);
      // Check if next subject has units
      try {
        const nextSubjectUnits = await fetchUnitsBySubject(
          nextSubject._id,
          examId
        );
        if (nextSubjectUnits.length > 0) {
          const firstUnit = nextSubjectUnits[0];
          const firstUnitSlug = createSlug(firstUnit.name);
          // Check if first unit has chapters
          try {
            const firstUnitChapters = await fetchChaptersByUnit(firstUnit._id);
            if (firstUnitChapters.length > 0) {
              const firstChapter = firstUnitChapters[0];
              const firstChapterSlug = createSlug(firstChapter.name);
              return {
                url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}`,
                label: `${nextSubject.name} > ${firstUnit.name} > ${firstChapter.name}`,
                type: "chapter",
              };
            }
          } catch (error) {
            // Continue without chapters
          }
          return {
            url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}`,
            label: `${nextSubject.name} > ${firstUnit.name}`,
            type: "unit",
          };
        }
      } catch (error) {
        // Continue without units
      }
      // No units in next subject, just go to subject page
      return {
        url: `/${examSlug}/${nextSubjectSlug}`,
        label: nextSubject.name,
        type: "subject",
      };
    }
  } catch (error) {
    console.error("Error fetching next subject:", error);
  }

  // 5. Try next exam (STEP BY STEP - only go to exam/subject, not deeper)
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIndex = exams.findIndex((e) => e._id === examId);
    if (examIndex < exams.length - 1) {
      const nextExam = exams[examIndex + 1];
      const nextExamSlug = createSlug(nextExam.name);
      // Check if next exam has subjects
      try {
        const nextExamSubjects = await fetchSubjectsByExam(nextExam._id);
        if (nextExamSubjects.length > 0) {
          const firstSubject = nextExamSubjects[0];
          const firstSubjectSlug = createSlug(firstSubject.name);
          // Check if first subject has units
          try {
            const firstSubjectUnits = await fetchUnitsBySubject(
              firstSubject._id,
              nextExam._id
            );
            if (firstSubjectUnits.length > 0) {
              const firstUnit = firstSubjectUnits[0];
              const firstUnitSlug = createSlug(firstUnit.name);
              return {
                url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}`,
                label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name}`,
                type: "unit",
              };
            }
          } catch (error) {
            // Continue without units
          }
          return {
            url: `/${nextExamSlug}/${firstSubjectSlug}`,
            label: `${nextExam.name} > ${firstSubject.name}`,
            type: "subject",
          };
        }
      } catch (error) {
        // Continue without subjects
      }
      // No subjects in next exam, just go to exam page
      return {
        url: `/${nextExamSlug}`,
        label: nextExam.name,
        type: "exam",
      };
    }
  } catch (error) {
    console.error("Error fetching next exam:", error);
  }

  return null;
}

/**
 * Get previous navigation for Topic level
 */
export async function getPreviousTopic({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  chapterId,
  chapterSlug,
  topicId,
  topicSlug,
  currentIndex,
  allItems,
}) {
  // 1. First check if current topic has subtopics - if yes, go to last subtopic
  try {
    const currentTopicSubtopics = await fetchSubTopicsByTopic(topicId);
    if (currentTopicSubtopics.length > 0) {
      const lastSubtopic =
        currentTopicSubtopics[currentTopicSubtopics.length - 1];
      return {
        url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${topicSlug}/${createSlug(
          lastSubtopic.name
        )}`,
        label: `${allItems[currentIndex]?.name || "Topic"} > ${
          lastSubtopic.name
        }`,
        type: "subtopic",
      };
    }
  } catch (error) {
    // Continue to previous topic
  }

  // 2. If no subtopics in current topic, try previous topic in same chapter
  if (currentIndex !== undefined && currentIndex > 0) {
    const prev = allItems[currentIndex - 1];
    const prevSlug = createSlug(prev.name);
    try {
      const subtopics = await fetchSubTopicsByTopic(prev._id);
      if (subtopics.length > 0) {
        // Get last subtopic
        const lastSubtopic = subtopics[subtopics.length - 1];
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${prevSlug}/${createSlug(
            lastSubtopic.name
          )}`,
          label: `${prev.name} > ${lastSubtopic.name}`,
          type: "subtopic",
        };
      }
    } catch (error) {
      // Continue without subtopics
    }
    return {
      url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${prevSlug}`,
      label: prev.name,
      type: "topic",
    };
  }

  // 2. Try previous chapter
  try {
    const chapters = await fetchChaptersByUnit(unitId);
    const chapterIndex = chapters.findIndex((c) => c._id === chapterId);
    if (chapterIndex > 0) {
      const prevChapter = chapters[chapterIndex - 1];
      const prevChapterSlug = createSlug(prevChapter.name);
      // Get last item in previous chapter
      const topics = await fetchTopicsByChapter(prevChapter._id);
      if (topics.length > 0) {
        const lastTopic = topics[topics.length - 1];
        const lastTopicSlug = createSlug(lastTopic.name);
        const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
        if (subtopics.length > 0) {
          const lastSubtopic = subtopics[subtopics.length - 1];
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevChapterSlug}/${lastTopicSlug}/${createSlug(
              lastSubtopic.name
            )}`,
            label: `${prevChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
            type: "subtopic",
          };
        } else {
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevChapterSlug}/${lastTopicSlug}`,
            label: `${prevChapter.name} > ${lastTopic.name}`,
            type: "topic",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevChapterSlug}`,
          label: prevChapter.name,
          type: "chapter",
        };
      }
    }
  } catch (error) {
    console.error("Error fetching previous chapter:", error);
  }

  // Continue with unit, subject, exam (similar logic)
  return null;
}

/**
 * Get previous navigation for Chapter level
 */
export async function getPreviousChapter({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  chapterId,
  chapterSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try previous chapter in same unit
  if (currentIndex !== undefined && currentIndex > 0) {
    const prev = allItems[currentIndex - 1];
    const prevSlug = createSlug(prev.name);
    // Get last item in previous chapter
    try {
      const topics = await fetchTopicsByChapter(prev._id);
      if (topics.length > 0) {
        const lastTopic = topics[topics.length - 1];
        const lastTopicSlug = createSlug(lastTopic.name);
        const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
        if (subtopics.length > 0) {
          const lastSubtopic = subtopics[subtopics.length - 1];
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevSlug}/${lastTopicSlug}/${createSlug(
              lastSubtopic.name
            )}`,
            label: `${prev.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
            type: "subtopic",
          };
        } else {
          return {
            url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevSlug}/${lastTopicSlug}`,
            label: `${prev.name} > ${lastTopic.name}`,
            type: "topic",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${prevSlug}`,
          label: prev.name,
          type: "chapter",
        };
      }
    } catch (error) {
      console.error("Error fetching previous chapter items:", error);
    }
  }

  // 2. Try previous unit
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    const unitIndex = units.findIndex((u) => u._id === unitId);
    if (unitIndex > 0) {
      const prevUnit = units[unitIndex - 1];
      const prevUnitSlug = createSlug(prevUnit.name);
      // Get last item in previous unit
      const chapters = await fetchChaptersByUnit(prevUnit._id);
      if (chapters.length > 0) {
        const lastChapter = chapters[chapters.length - 1];
        const lastChapterSlug = createSlug(lastChapter.name);
        const topics = await fetchTopicsByChapter(lastChapter._id);
        if (topics.length > 0) {
          const lastTopic = topics[topics.length - 1];
          const lastTopicSlug = createSlug(lastTopic.name);
          const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
          if (subtopics.length > 0) {
            const lastSubtopic = subtopics[subtopics.length - 1];
            return {
              url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${createSlug(
                lastSubtopic.name
              )}`,
              label: `${prevUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
              type: "subtopic",
            };
          } else {
            return {
              url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}/${lastTopicSlug}`,
              label: `${prevUnit.name} > ${lastChapter.name} > ${lastTopic.name}`,
              type: "topic",
            };
          }
        } else {
          return {
            url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}/${lastChapterSlug}`,
            label: `${prevUnit.name} > ${lastChapter.name}`,
            type: "chapter",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${prevUnitSlug}`,
          label: prevUnit.name,
          type: "unit",
        };
      }
    }
  } catch (error) {
    console.error("Error fetching previous unit:", error);
  }

  return null;
}

/**
 * Get next navigation for Chapter level
 */
export async function getNextChapter({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  chapterId,
  chapterSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try first topic in this chapter (STEP BY STEP - only go to topic, not subtopic)
  try {
    const topics = await fetchTopicsByChapter(chapterId);
    if (topics.length > 0) {
      const firstTopic = topics[0];
      const firstTopicSlug = createSlug(firstTopic.name);
      // Only go to topic page, not deeper to subtopic
      return {
        url: `/${examSlug}/${subjectSlug}/${unitSlug}/${chapterSlug}/${firstTopicSlug}`,
        label: firstTopic.name,
        type: "topic",
      };
    }
  } catch (error) {
    console.error("Error fetching topics:", error);
  }

  // 2. If no topics in this chapter, go to next chapter (STEP BY STEP)
  if (currentIndex !== undefined && currentIndex < allItems.length - 1) {
    const next = allItems[currentIndex + 1];
    const nextSlug = createSlug(next.name);
    // Check if next chapter has topics
    try {
      const nextChapterTopics = await fetchTopicsByChapter(next._id);
      if (nextChapterTopics.length > 0) {
        const firstTopic = nextChapterTopics[0];
        const firstTopicSlug = createSlug(firstTopic.name);
        return {
          url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextSlug}/${firstTopicSlug}`,
          label: `${next.name} > ${firstTopic.name}`,
          type: "topic",
        };
      }
    } catch (error) {
      // Continue without topics
    }
    // No topics in next chapter, just go to chapter page
    return {
      url: `/${examSlug}/${subjectSlug}/${unitSlug}/${nextSlug}`,
      label: next.name,
      type: "chapter",
    };
  }

  // 3. Try next unit in same subject (STEP BY STEP - only go to unit/chapter, not deeper)
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    const unitIndex = units.findIndex((u) => u._id === unitId);
    if (unitIndex < units.length - 1) {
      const nextUnit = units[unitIndex + 1];
      const nextUnitSlug = createSlug(nextUnit.name);
      // Check if next unit has chapters
      try {
        const nextUnitChapters = await fetchChaptersByUnit(nextUnit._id);
        if (nextUnitChapters.length > 0) {
          const firstChapter = nextUnitChapters[0];
          const firstChapterSlug = createSlug(firstChapter.name);
          return {
            url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}/${firstChapterSlug}`,
            label: `${nextUnit.name} > ${firstChapter.name}`,
            type: "chapter",
          };
        }
      } catch (error) {
        // Continue without chapters
      }
      // No chapters in next unit, just go to unit page
      return {
        url: `/${examSlug}/${subjectSlug}/${nextUnitSlug}`,
        label: nextUnit.name,
        type: "unit",
      };
    }
  } catch (error) {
    console.error("Error fetching next unit:", error);
  }

  // 4. Try next subject in same exam (STEP BY STEP - only go to subject/unit, not deeper)
  try {
    const subjects = await fetchSubjectsByExam(examId);
    const subjectIndex = subjects.findIndex((s) => s._id === subjectId);
    if (subjectIndex < subjects.length - 1) {
      const nextSubject = subjects[subjectIndex + 1];
      const nextSubjectSlug = createSlug(nextSubject.name);
      // Check if next subject has units
      try {
        const nextSubjectUnits = await fetchUnitsBySubject(
          nextSubject._id,
          examId
        );
        if (nextSubjectUnits.length > 0) {
          const firstUnit = nextSubjectUnits[0];
          const firstUnitSlug = createSlug(firstUnit.name);
          // Check if first unit has chapters
          try {
            const firstUnitChapters = await fetchChaptersByUnit(firstUnit._id);
            if (firstUnitChapters.length > 0) {
              const firstChapter = firstUnitChapters[0];
              const firstChapterSlug = createSlug(firstChapter.name);
              return {
                url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}/${firstChapterSlug}`,
                label: `${nextSubject.name} > ${firstUnit.name} > ${firstChapter.name}`,
                type: "chapter",
              };
            }
          } catch (error) {
            // Continue without chapters
          }
          return {
            url: `/${examSlug}/${nextSubjectSlug}/${firstUnitSlug}`,
            label: `${nextSubject.name} > ${firstUnit.name}`,
            type: "unit",
          };
        }
      } catch (error) {
        // Continue without units
      }
      // No units in next subject, just go to subject page
      return {
        url: `/${examSlug}/${nextSubjectSlug}`,
        label: nextSubject.name,
        type: "subject",
      };
    }
  } catch (error) {
    console.error("Error fetching next subject:", error);
  }

  // 5. Try next exam (STEP BY STEP - only go to exam/subject, not deeper)
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIndex = exams.findIndex((e) => e._id === examId);
    if (examIndex < exams.length - 1) {
      const nextExam = exams[examIndex + 1];
      const nextExamSlug = createSlug(nextExam.name);
      // Check if next exam has subjects
      try {
        const nextExamSubjects = await fetchSubjectsByExam(nextExam._id);
        if (nextExamSubjects.length > 0) {
          const firstSubject = nextExamSubjects[0];
          const firstSubjectSlug = createSlug(firstSubject.name);
          // Check if first subject has units
          try {
            const firstSubjectUnits = await fetchUnitsBySubject(
              firstSubject._id,
              nextExam._id
            );
            if (firstSubjectUnits.length > 0) {
              const firstUnit = firstSubjectUnits[0];
              const firstUnitSlug = createSlug(firstUnit.name);
              return {
                url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}`,
                label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name}`,
                type: "unit",
              };
            }
          } catch (error) {
            // Continue without units
          }
          return {
            url: `/${nextExamSlug}/${firstSubjectSlug}`,
            label: `${nextExam.name} > ${firstSubject.name}`,
            type: "subject",
          };
        }
      } catch (error) {
        // Continue without subjects
      }
      // No subjects in next exam, just go to exam page
      return {
        url: `/${nextExamSlug}`,
        label: nextExam.name,
        type: "exam",
      };
    }
  } catch (error) {
    console.error("Error fetching next exam:", error);
  }

  return null;
}

/**
 * Get next navigation for Unit level
 */
export async function getNextUnit({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try first chapter in this unit (STEP BY STEP - only go to chapter, not subtopic)
  try {
    const chapters = await fetchChaptersByUnit(unitId);
    if (chapters.length > 0) {
      const firstChapter = chapters[0];
      const firstChapterSlug = createSlug(firstChapter.name);
      // Only go to chapter page, not deeper
      return {
        url: `/${examSlug}/${subjectSlug}/${unitSlug}/${firstChapterSlug}`,
        label: firstChapter.name,
        type: "chapter",
      };
    }
  } catch (error) {
    console.error("Error fetching chapters:", error);
  }

  // 2. Try next unit in same subject (STEP BY STEP - only go to unit, not deeper)
  if (currentIndex !== undefined && currentIndex < allItems.length - 1) {
    const next = allItems[currentIndex + 1];
    const nextSlug = createSlug(next.name);
    // Check if next unit has chapters
    try {
      const nextUnitChapters = await fetchChaptersByUnit(next._id);
      if (nextUnitChapters.length > 0) {
        const firstChapter = nextUnitChapters[0];
        const firstChapterSlug = createSlug(firstChapter.name);
        return {
          url: `/${examSlug}/${subjectSlug}/${nextSlug}/${firstChapterSlug}`,
          label: `${next.name} > ${firstChapter.name}`,
          type: "chapter",
        };
      }
    } catch (error) {
      // Continue without chapters
    }
    // No chapters in next unit, just go to unit page
    return {
      url: `/${examSlug}/${subjectSlug}/${nextSlug}`,
      label: next.name,
      type: "unit",
    };
  }

  // Continue with subject, exam...
  return null;
}

/**
 * Get next navigation for Subject level
 */
export async function getNextSubject({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try first unit in this subject (STEP BY STEP - only go to unit, not deeper)
  try {
    const units = await fetchUnitsBySubject(subjectId, examId);
    if (units.length > 0) {
      const firstUnit = units[0];
      const firstUnitSlug = createSlug(firstUnit.name);
      // Only go to unit page, not deeper
      return {
        url: `/${examSlug}/${subjectSlug}/${firstUnitSlug}`,
        label: firstUnit.name,
        type: "unit",
      };
    }
  } catch (error) {
    console.error("Error fetching units:", error);
  }

  // 2. Try next subject in same exam (STEP BY STEP - only go to subject/unit, not deeper)
  if (currentIndex !== undefined && currentIndex < allItems.length - 1) {
    const next = allItems[currentIndex + 1];
    const nextSlug = createSlug(next.name);
    // Check if next subject has units
    try {
      const nextSubjectUnits = await fetchUnitsBySubject(next._id, examId);
      if (nextSubjectUnits.length > 0) {
        const firstUnit = nextSubjectUnits[0];
        const firstUnitSlug = createSlug(firstUnit.name);
        return {
          url: `/${examSlug}/${nextSlug}/${firstUnitSlug}`,
          label: `${next.name} > ${firstUnit.name}`,
          type: "unit",
        };
      }
    } catch (error) {
      // Continue without units
    }
    // No units in next subject, just go to subject page
    return {
      url: `/${examSlug}/${nextSlug}`,
      label: next.name,
      type: "subject",
    };
  }

  // 3. Try next exam (STEP BY STEP - only go to exam/subject, not deeper)
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIndex = exams.findIndex((e) => e._id === examId);
    if (examIndex < exams.length - 1) {
      const nextExam = exams[examIndex + 1];
      const nextExamSlug = createSlug(nextExam.name);
      // Check if next exam has subjects
      try {
        const nextExamSubjects = await fetchSubjectsByExam(nextExam._id);
        if (nextExamSubjects.length > 0) {
          const firstSubject = nextExamSubjects[0];
          const firstSubjectSlug = createSlug(firstSubject.name);
          // Check if first subject has units
          try {
            const firstSubjectUnits = await fetchUnitsBySubject(
              firstSubject._id,
              nextExam._id
            );
            if (firstSubjectUnits.length > 0) {
              const firstUnit = firstSubjectUnits[0];
              const firstUnitSlug = createSlug(firstUnit.name);
              return {
                url: `/${nextExamSlug}/${firstSubjectSlug}/${firstUnitSlug}`,
                label: `${nextExam.name} > ${firstSubject.name} > ${firstUnit.name}`,
                type: "unit",
              };
            }
          } catch (error) {
            // Continue without units
          }
          return {
            url: `/${nextExamSlug}/${firstSubjectSlug}`,
            label: `${nextExam.name} > ${firstSubject.name}`,
            type: "subject",
          };
        }
      } catch (error) {
        // Continue without subjects
      }
      // No subjects in next exam, just go to exam page
      return {
        url: `/${nextExamSlug}`,
        label: nextExam.name,
        type: "exam",
      };
    }
  } catch (error) {
    console.error("Error fetching next exam:", error);
  }

  return null;
}

/**
 * Get previous navigation for Unit level
 */
export async function getPreviousUnit({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  unitId,
  unitSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try previous unit in same subject
  if (currentIndex !== undefined && currentIndex > 0) {
    const prev = allItems[currentIndex - 1];
    const prevSlug = createSlug(prev.name);
    // Get last item in previous unit
    try {
      const chapters = await fetchChaptersByUnit(prev._id);
      if (chapters.length > 0) {
        const lastChapter = chapters[chapters.length - 1];
        const lastChapterSlug = createSlug(lastChapter.name);
        const topics = await fetchTopicsByChapter(lastChapter._id);
        if (topics.length > 0) {
          const lastTopic = topics[topics.length - 1];
          const lastTopicSlug = createSlug(lastTopic.name);
          const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
          if (subtopics.length > 0) {
            const lastSubtopic = subtopics[subtopics.length - 1];
            return {
              url: `/${examSlug}/${subjectSlug}/${prevSlug}/${lastChapterSlug}/${lastTopicSlug}/${createSlug(
                lastSubtopic.name
              )}`,
              label: `${prev.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
              type: "subtopic",
            };
          } else {
            return {
              url: `/${examSlug}/${subjectSlug}/${prevSlug}/${lastChapterSlug}/${lastTopicSlug}`,
              label: `${prev.name} > ${lastChapter.name} > ${lastTopic.name}`,
              type: "topic",
            };
          }
        } else {
          return {
            url: `/${examSlug}/${subjectSlug}/${prevSlug}/${lastChapterSlug}`,
            label: `${prev.name} > ${lastChapter.name}`,
            type: "chapter",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${subjectSlug}/${prevSlug}`,
          label: prev.name,
          type: "unit",
        };
      }
    } catch (error) {
      console.error("Error fetching previous unit items:", error);
    }
  }

  // 2. Try previous subject
  try {
    const subjects = await fetchSubjectsByExam(examId);
    const subjectIndex = subjects.findIndex((s) => s._id === subjectId);
    if (subjectIndex > 0) {
      const prevSubject = subjects[subjectIndex - 1];
      const prevSubjectSlug = createSlug(prevSubject.name);
      // Get last item in previous subject
      const units = await fetchUnitsBySubject(prevSubject._id, examId);
      if (units.length > 0) {
        const lastUnit = units[units.length - 1];
        const lastUnitSlug = createSlug(lastUnit.name);
        return {
          url: `/${examSlug}/${prevSubjectSlug}/${lastUnitSlug}`,
          label: `${prevSubject.name} > ${lastUnit.name}`,
          type: "unit",
        };
      } else {
        return {
          url: `/${examSlug}/${prevSubjectSlug}`,
          label: prevSubject.name,
          type: "subject",
        };
      }
    }
  } catch (error) {
    console.error("Error fetching previous subject:", error);
  }

  return null;
}

/**
 * Get previous navigation for Subject level
 */
export async function getPreviousSubject({
  examId,
  examSlug,
  subjectId,
  subjectSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try previous subject in same exam
  if (currentIndex !== undefined && currentIndex > 0) {
    const prev = allItems[currentIndex - 1];
    const prevSlug = createSlug(prev.name);
    // Get last item in previous subject
    try {
      const units = await fetchUnitsBySubject(prev._id, examId);
      if (units.length > 0) {
        const lastUnit = units[units.length - 1];
        const lastUnitSlug = createSlug(lastUnit.name);
        const chapters = await fetchChaptersByUnit(lastUnit._id);
        if (chapters.length > 0) {
          const lastChapter = chapters[chapters.length - 1];
          const lastChapterSlug = createSlug(lastChapter.name);
          const topics = await fetchTopicsByChapter(lastChapter._id);
          if (topics.length > 0) {
            const lastTopic = topics[topics.length - 1];
            const lastTopicSlug = createSlug(lastTopic.name);
            const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
            if (subtopics.length > 0) {
              const lastSubtopic = subtopics[subtopics.length - 1];
              return {
                url: `/${examSlug}/${prevSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${createSlug(
                  lastSubtopic.name
                )}`,
                label: `${prev.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
                type: "subtopic",
              };
            } else {
              return {
                url: `/${examSlug}/${prevSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}`,
                label: `${prev.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name}`,
                type: "topic",
              };
            }
          } else {
            return {
              url: `/${examSlug}/${prevSlug}/${lastUnitSlug}/${lastChapterSlug}`,
              label: `${prev.name} > ${lastUnit.name} > ${lastChapter.name}`,
              type: "chapter",
            };
          }
        } else {
          return {
            url: `/${examSlug}/${prevSlug}/${lastUnitSlug}`,
            label: `${prev.name} > ${lastUnit.name}`,
            type: "unit",
          };
        }
      } else {
        return {
          url: `/${examSlug}/${prevSlug}`,
          label: prev.name,
          type: "subject",
        };
      }
    } catch (error) {
      console.error("Error fetching previous subject items:", error);
    }
  }

  // 2. Try previous exam
  try {
    const exams = await fetchExams({ limit: 100 });
    const examIndex = exams.findIndex((e) => e._id === examId);
    if (examIndex > 0) {
      const prevExam = exams[examIndex - 1];
      const prevExamSlug = createSlug(prevExam.name);
      // Get last item in previous exam
      const subjects = await fetchSubjectsByExam(prevExam._id);
      if (subjects.length > 0) {
        const lastSubject = subjects[subjects.length - 1];
        const lastSubjectSlug = createSlug(lastSubject.name);
        return {
          url: `/${prevExamSlug}/${lastSubjectSlug}`,
          label: `${prevExam.name} > ${lastSubject.name}`,
          type: "subject",
        };
      } else {
        return {
          url: `/${prevExamSlug}`,
          label: prevExam.name,
          type: "exam",
        };
      }
    }
  } catch (error) {
    console.error("Error fetching previous exam:", error);
  }

  return null;
}

/**
 * Get previous navigation for Exam level
 */
export async function getPreviousExam({
  examId,
  examSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try previous exam
  if (currentIndex !== undefined && currentIndex > 0) {
    const prev = allItems[currentIndex - 1];
    const prevSlug = createSlug(prev.name);
    // Get last item in previous exam
    try {
      const subjects = await fetchSubjectsByExam(prev._id);
      if (subjects.length > 0) {
        const lastSubject = subjects[subjects.length - 1];
        const lastSubjectSlug = createSlug(lastSubject.name);
        const units = await fetchUnitsBySubject(lastSubject._id, prev._id);
        if (units.length > 0) {
          const lastUnit = units[units.length - 1];
          const lastUnitSlug = createSlug(lastUnit.name);
          const chapters = await fetchChaptersByUnit(lastUnit._id);
          if (chapters.length > 0) {
            const lastChapter = chapters[chapters.length - 1];
            const lastChapterSlug = createSlug(lastChapter.name);
            const topics = await fetchTopicsByChapter(lastChapter._id);
            if (topics.length > 0) {
              const lastTopic = topics[topics.length - 1];
              const lastTopicSlug = createSlug(lastTopic.name);
              const subtopics = await fetchSubTopicsByTopic(lastTopic._id);
              if (subtopics.length > 0) {
                const lastSubtopic = subtopics[subtopics.length - 1];
                return {
                  url: `/${prevSlug}/${lastSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}/${createSlug(
                    lastSubtopic.name
                  )}`,
                  label: `${prev.name} > ${lastSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name} > ${lastSubtopic.name}`,
                  type: "subtopic",
                };
              } else {
                return {
                  url: `/${prevSlug}/${lastSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}/${lastTopicSlug}`,
                  label: `${prev.name} > ${lastSubject.name} > ${lastUnit.name} > ${lastChapter.name} > ${lastTopic.name}`,
                  type: "topic",
                };
              }
            } else {
              return {
                url: `/${prevSlug}/${lastSubjectSlug}/${lastUnitSlug}/${lastChapterSlug}`,
                label: `${prev.name} > ${lastSubject.name} > ${lastUnit.name} > ${lastChapter.name}`,
                type: "chapter",
              };
            }
          } else {
            return {
              url: `/${prevSlug}/${lastSubjectSlug}/${lastUnitSlug}`,
              label: `${prev.name} > ${lastSubject.name} > ${lastUnit.name}`,
              type: "unit",
            };
          }
        } else {
          return {
            url: `/${prevSlug}/${lastSubjectSlug}`,
            label: `${prev.name} > ${lastSubject.name}`,
            type: "subject",
          };
        }
      } else {
        return {
          url: `/${prevSlug}`,
          label: prev.name,
          type: "exam",
        };
      }
    } catch (error) {
      console.error("Error fetching previous exam items:", error);
    }
  }

  return null;
}

/**
 * Get next navigation for Exam level
 */
export async function getNextExam({
  examId,
  examSlug,
  currentIndex,
  allItems,
}) {
  // 1. Try first subject in this exam (STEP BY STEP - only go to subject, not deeper)
  try {
    const subjects = await fetchSubjectsByExam(examId);
    if (subjects.length > 0) {
      const firstSubject = subjects[0];
      const firstSubjectSlug = createSlug(firstSubject.name);
      // Only go to subject page, not deeper
      return {
        url: `/${examSlug}/${firstSubjectSlug}`,
        label: firstSubject.name,
        type: "subject",
      };
    }
  } catch (error) {
    console.error("Error fetching subjects:", error);
  }

  // 2. Try next exam (STEP BY STEP - only go to exam/subject, not deeper)
  if (currentIndex !== undefined && currentIndex < allItems.length - 1) {
    const next = allItems[currentIndex + 1];
    const nextSlug = createSlug(next.name);
    // Check if next exam has subjects
    try {
      const nextExamSubjects = await fetchSubjectsByExam(next._id);
      if (nextExamSubjects.length > 0) {
        const firstSubject = nextExamSubjects[0];
        const firstSubjectSlug = createSlug(firstSubject.name);
        return {
          url: `/${nextSlug}/${firstSubjectSlug}`,
          label: `${next.name} > ${firstSubject.name}`,
          type: "subject",
        };
      }
    } catch (error) {
      // Continue without subjects
    }
    // No subjects in next exam, just go to exam page
    return {
      url: `/${nextSlug}`,
      label: next.name,
      type: "exam",
    };
  }

  return null;
}
