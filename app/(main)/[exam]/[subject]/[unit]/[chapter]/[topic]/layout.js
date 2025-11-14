import { generateMetadata as generateSEO } from "@/utils/seo";
import { createSlug } from "@/utils/slug";
import { logger } from "@/utils/logger";

export async function generateMetadata({ params }) {
  const { exam: examSlug, subject: subjectSlug, unit: unitSlug, chapter: chapterSlug, topic: topicSlug } = await params;

    try {
      // Try to fetch data, but don't fail if it doesn't work
      let exam = null;
      let subject = null;
      let unit = null;
      let chapter = null;
      let topic = null;
      let topicDetails = null;

      try {
        const { fetchExamById, fetchSubjectById, fetchUnitById, fetchChapterById, fetchTopicById, fetchTopicDetailsById } = await import("../../../../../lib/api");
        [exam, subject, unit, chapter, topic] = await Promise.all([
          fetchExamById(examSlug).catch(() => null),
          fetchSubjectById(subjectSlug).catch(() => null),
          fetchUnitById(unitSlug).catch(() => null),
          fetchChapterById(chapterSlug).catch(() => null),
          fetchTopicById(topicSlug).catch(() => null),
        ]);
        
        // Fetch topic details separately
        if (topic?._id) {
          topicDetails = await fetchTopicDetailsById(topic._id).catch(() => null);
        }
    } catch (fetchError) {
      // Silently fail - we'll use defaults
      logger.warn("Could not fetch data for metadata:", fetchError.message);
    }

    if (!topic) {
      return generateSEO({}, { type: "topic", name: topicSlug || "Topic" });
    }

    // Use SEO fields from Details: title, metaDescription, keywords
    const seoData = {
      title: topicDetails?.title || (topic.name && subject?.name && exam?.name ? `${topic.name} - ${subject.name} - ${exam.name}` : topic.name || "Topic"),
      metaDescription:
        topicDetails?.metaDescription ||
        (topic.name && subject?.name && exam?.name
          ? `Master ${topic.name} in ${subject.name} for ${exam.name} exam. Study with detailed explanations, examples, and practice problems.`
          : `Master ${topic.name || "Topic"} with detailed explanations and examples.`),
      keywords: topicDetails?.keywords || (topic.name && subject?.name && exam?.name ? `${topic.name}, ${subject.name}, ${exam.name}` : topic.name || "Topic"),
    };

    return generateSEO(seoData, {
      type: "topic",
      name: topic.name,
      path: `/${createSlug(exam?.name || "")}/${createSlug(subject?.name || "")}/${createSlug(unit?.name || "")}/${createSlug(chapter?.name || "")}/${createSlug(topic.name)}`,
    });
  } catch (error) {
    // Always return valid metadata even on error
    logger.warn("Error generating metadata:", error.message);
    return generateSEO({}, { type: "topic", name: topicSlug || "Topic" });
  }
}

export default function TopicLayout({ children }) {
  return <>{children}</>;
}

