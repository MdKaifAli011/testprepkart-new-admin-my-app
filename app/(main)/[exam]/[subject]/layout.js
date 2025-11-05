import { generateMetadata as generateSEO } from "@/utils/seo";
import { createSlug } from "@/utils/slug";
import { logger } from "@/utils/logger";

export async function generateMetadata({ params }) {
  const { exam: examSlug, subject: subjectSlug } = await params;

  try {
    // Try to fetch data, but don't fail if it doesn't work
    let exam = null;
    let subject = null;

    try {
      const { fetchExamById, fetchSubjectById } = await import("../../lib/api");
      [exam, subject] = await Promise.all([
        fetchExamById(examSlug).catch(() => null),
        fetchSubjectById(subjectSlug).catch(() => null),
      ]);
    } catch (fetchError) {
      // Silently fail - we'll use defaults
      logger.warn("Could not fetch data for metadata:", fetchError.message);
    }

    if (!subject) {
      return generateSEO(
        {},
        { type: "subject", name: subjectSlug || "Subject" }
      );
    }

    // Use SEO fields from admin: title, metaDescription, keywords
    // If admin provided SEO data, use it; otherwise generate from names
    const seoData = {
      title:
        subject.title ||
        (subject.name && exam?.name
          ? `${subject.name} - ${exam.name}`
          : subject.name || "Subject"),
      metaDescription:
        subject.metaDescription ||
        (subject.name && exam?.name
          ? `Prepare for ${subject.name} in ${exam.name} exam with comprehensive study materials and practice tests.`
          : `Prepare for ${
              subject.name || "Subject"
            } with comprehensive study materials.`),
      keywords:
        subject.keywords ||
        (subject.name && exam?.name
          ? `${subject.name}, ${exam.name}`
          : subject.name || "Subject"),
    };

    return generateSEO(seoData, {
      type: "subject",
      name: subject.name,
      path: `/${createSlug(exam?.name || "")}/${createSlug(subject.name)}`,
    });
  } catch (error) {
    // Always return valid metadata even on error
    logger.warn("Error generating metadata:", error.message);
    return generateSEO({}, { type: "subject", name: subjectSlug || "Subject" });
  }
}

export default function SubjectLayout({ children }) {
  return <>{children}</>;
}
