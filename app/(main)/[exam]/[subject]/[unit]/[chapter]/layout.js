import { generateMetadata as generateSEO } from "@/utils/seo";
import { createSlug } from "@/utils/slug";
import { logger } from "@/utils/logger";

export async function generateMetadata({ params }) {
  const { exam: examSlug, subject: subjectSlug, unit: unitSlug, chapter: chapterSlug } = await params;

    try {
      // Try to fetch data, but don't fail if it doesn't work
      let exam = null;
      let subject = null;
      let unit = null;
      let chapter = null;
      let chapterDetails = null;

      try {
        const { fetchExamById, fetchSubjectById, fetchUnitById, fetchChapterById, fetchChapterDetailsById } = await import("../../../../lib/api");
        [exam, subject, unit, chapter] = await Promise.all([
          fetchExamById(examSlug).catch(() => null),
          fetchSubjectById(subjectSlug).catch(() => null),
          fetchUnitById(unitSlug).catch(() => null),
          fetchChapterById(chapterSlug).catch(() => null),
        ]);
        
        // Fetch chapter details separately
        if (chapter?._id) {
          chapterDetails = await fetchChapterDetailsById(chapter._id).catch(() => null);
        }
    } catch (fetchError) {
      // Silently fail - we'll use defaults
      logger.warn("Could not fetch data for metadata:", fetchError.message);
    }

    if (!chapter) {
      return generateSEO({}, { type: "chapter", name: chapterSlug || "Chapter" });
    }

    // Use SEO fields from Details: title, metaDescription, keywords
    const seoData = {
      title: chapterDetails?.title || (chapter.name && subject?.name && exam?.name ? `${chapter.name} - ${subject.name} - ${exam.name}` : chapter.name || "Chapter"),
      metaDescription:
        chapterDetails?.metaDescription ||
        (chapter.name && subject?.name && exam?.name
          ? `Learn ${chapter.name} in ${subject.name} for ${exam.name} exam. Access detailed notes, solved examples, and practice questions.`
          : `Learn ${chapter.name || "Chapter"} with detailed study materials.`),
      keywords: chapterDetails?.keywords || (chapter.name && subject?.name && exam?.name ? `${chapter.name}, ${subject.name}, ${exam.name}` : chapter.name || "Chapter"),
    };

    return generateSEO(seoData, {
      type: "chapter",
      name: chapter.name,
      path: `/${createSlug(exam?.name || "")}/${createSlug(subject?.name || "")}/${createSlug(unit?.name || "")}/${createSlug(chapter.name)}`,
    });
  } catch (error) {
    // Always return valid metadata even on error
    logger.warn("Error generating metadata:", error.message);
    return generateSEO({}, { type: "chapter", name: chapterSlug || "Chapter" });
  }
}

export default function ChapterLayout({ children }) {
  return <>{children}</>;
}

