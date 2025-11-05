import { generateMetadata as generateSEO } from "@/utils/seo";
import { createSlug } from "@/utils/slug";
import { logger } from "@/utils/logger";

// Generate metadata for exam pages from admin SEO data
export async function generateMetadata({ params }) {
  const { exam: examSlug } = await params;

  try {
    // Try to fetch exam data, but don't fail if it doesn't work
    let exam = null;
    try {
      const { fetchExamById } = await import("../lib/api");
      exam = await fetchExamById(examSlug);
    } catch (fetchError) {
      // Silently fail - we'll use defaults
      logger.warn("Could not fetch exam for metadata:", fetchError.message);
    }

    if (!exam) {
      return generateSEO({}, { type: "exam", name: examSlug || "Exam" });
    }

    // Use SEO fields from admin: title, metaDescription, keywords
    const seoData = {
      title: exam.title || exam.name,
      metaDescription:
        exam.metaDescription ||
        `Prepare for ${exam.name} exam with comprehensive resources and expert guidance.`,
      keywords: exam.keywords || exam.name,
    };

    return generateSEO(seoData, {
      type: "exam",
      name: exam.name,
      path: `/${createSlug(exam.name)}`,
    });
  } catch (error) {
    // Always return valid metadata even on error
    logger.warn("Error generating metadata:", error.message);
    return generateSEO({}, { type: "exam", name: examSlug || "Exam" });
  }
}

export default function ExamLayout({ children }) {
  return <>{children}</>;
}
