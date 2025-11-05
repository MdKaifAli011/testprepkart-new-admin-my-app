import { generateMetadata as generateSEO } from "@/utils/seo";
import { createSlug } from "@/utils/slug";
import { logger } from "@/utils/logger";

export async function generateMetadata({ params }) {
  const { exam: examSlug, subject: subjectSlug, unit: unitSlug, chapter: chapterSlug, topic: topicSlug, subtopic: subtopicSlug } = await params;

  try {
    // Try to fetch data, but don't fail if it doesn't work
    let exam = null;
    let subject = null;
    let unit = null;
    let chapter = null;
    let topic = null;
    let subtopic = null;

    try {
      const { fetchExamById, fetchSubjectById, fetchUnitById, fetchChapterById, fetchTopicById, fetchSubTopicById } = await import("../../../../../../lib/api");
      [exam, subject, unit, chapter, topic, subtopic] = await Promise.all([
        fetchExamById(examSlug).catch(() => null),
        fetchSubjectById(subjectSlug).catch(() => null),
        fetchUnitById(unitSlug).catch(() => null),
        fetchChapterById(chapterSlug).catch(() => null),
        fetchTopicById(topicSlug).catch(() => null),
        fetchSubTopicById(subtopicSlug).catch(() => null),
      ]);
    } catch (fetchError) {
      // Silently fail - we'll use defaults
      logger.warn("Could not fetch data for metadata:", fetchError.message);
    }

    if (!subtopic) {
      return generateSEO({}, { type: "subtopic", name: subtopicSlug || "SubTopic" });
    }

    // Use SEO fields from admin: title, metaDescription, keywords
    const seoData = {
      title: subtopic.title || (subtopic.name && subject?.name && exam?.name ? `${subtopic.name} - ${subject.name} - ${exam.name}` : subtopic.name || "SubTopic"),
      metaDescription:
        subtopic.metaDescription ||
        (subtopic.name && subject?.name && exam?.name
          ? `Learn ${subtopic.name} in ${subject.name} for ${exam.name} exam. Get step-by-step explanations, examples, and practice exercises.`
          : `Learn ${subtopic.name || "SubTopic"} with step-by-step explanations.`),
      keywords: subtopic.keywords || (subtopic.name && subject?.name && exam?.name ? `${subtopic.name}, ${subject.name}, ${exam.name}` : subtopic.name || "SubTopic"),
    };

    return generateSEO(seoData, {
      type: "subtopic",
      name: subtopic.name,
      path: `/${createSlug(exam?.name || "")}/${createSlug(subject?.name || "")}/${createSlug(unit?.name || "")}/${createSlug(chapter?.name || "")}/${createSlug(topic?.name || "")}/${createSlug(subtopic.name)}`,
    });
  } catch (error) {
    // Always return valid metadata even on error
    logger.warn("Error generating metadata:", error.message);
    return generateSEO({}, { type: "subtopic", name: subtopicSlug || "SubTopic" });
  }
}

export default function SubTopicLayout({ children }) {
  return <>{children}</>;
}

