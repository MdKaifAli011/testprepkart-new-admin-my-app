import { generateMetadata as generateSEO } from "@/utils/seo";
import { createSlug } from "@/utils/slug";
import { logger } from "@/utils/logger";

export async function generateMetadata({ params }) {
  const { exam: examSlug, subject: subjectSlug, unit: unitSlug } = await params;

    try {
      // Try to fetch data, but don't fail if it doesn't work
      let exam = null;
      let subject = null;
      let unit = null;
      let unitDetails = null;

      try {
        const { fetchExamById, fetchSubjectById, fetchUnitById, fetchUnitDetailsById } = await import("../../../lib/api");
        [exam, subject, unit] = await Promise.all([
          fetchExamById(examSlug).catch(() => null),
          fetchSubjectById(subjectSlug).catch(() => null),
          fetchUnitById(unitSlug).catch(() => null),
        ]);
        
        // Fetch unit details separately
        if (unit?._id) {
          unitDetails = await fetchUnitDetailsById(unit._id).catch(() => null);
        }
    } catch (fetchError) {
      // Silently fail - we'll use defaults
      logger.warn("Could not fetch data for metadata:", fetchError.message);
    }

    if (!unit) {
      return generateSEO({}, { type: "unit", name: unitSlug || "Unit" });
    }

    // Use SEO fields from Details: title, metaDescription, keywords
    const seoData = {
      title: unitDetails?.title || (unit.name && subject?.name && exam?.name ? `${unit.name} - ${subject.name} - ${exam.name}` : unit.name || "Unit"),
      metaDescription:
        unitDetails?.metaDescription ||
        (unit.name && subject?.name && exam?.name
          ? `Study ${unit.name} in ${subject.name} for ${exam.name} exam. Get comprehensive notes, practice questions, and expert guidance.`
          : `Study ${unit.name || "Unit"} with comprehensive study materials.`),
      keywords: unitDetails?.keywords || (unit.name && subject?.name && exam?.name ? `${unit.name}, ${subject.name}, ${exam.name}` : unit.name || "Unit"),
    };

    return generateSEO(seoData, {
      type: "unit",
      name: unit.name,
      path: `/${createSlug(exam?.name || "")}/${createSlug(subject?.name || "")}/${createSlug(unit.name)}`,
    });
  } catch (error) {
    // Always return valid metadata even on error
    logger.warn("Error generating metadata:", error.message);
    return generateSEO({}, { type: "unit", name: unitSlug || "Unit" });
  }
}

export default function UnitLayout({ children }) {
  return <>{children}</>;
}

