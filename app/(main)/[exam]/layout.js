import { generateMetadata as generateSEO } from "@/utils/seo";
import { createSlug } from "@/utils/slug";
import { logger } from "@/utils/logger";

// Generate metadata for exam pages from admin SEO data
export async function generateMetadata({ params }) {
  const { exam: examSlug } = await params;

    try {
      // Try to fetch exam data and details, but don't fail if it doesn't work
      let exam = null;
      let examDetails = null;
      try {
        const { fetchExamById, fetchExamDetailsById } = await import("../lib/api");
        exam = await fetchExamById(examSlug);
        if (exam?._id) {
          examDetails = await fetchExamDetailsById(exam._id);
        }
      } catch (fetchError) {
        // Silently fail - we'll use defaults
        logger.warn("Could not fetch exam for metadata:", fetchError.message);
      }

      if (!exam) {
        return generateSEO({}, { type: "exam", name: examSlug || "Exam" });
      }

      // Use SEO fields from Details: title, metaDescription, keywords
      const seoData = {
        title: examDetails?.title || exam.name,
        metaDescription:
          examDetails?.metaDescription ||
          `Prepare for ${exam.name} exam with comprehensive resources and expert guidance.`,
        keywords: examDetails?.keywords || exam.name,
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
