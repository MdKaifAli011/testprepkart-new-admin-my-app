// ============================================
// SEO Utility Functions
// ============================================

import { SEO_DEFAULTS, APP_CONFIG } from "@/constants";

/**
 * Generate SEO metadata for pages
 * @param {Object} data - Entity data with title, metaDescription, keywords
 * @param {Object} options - Additional options like type, name
 * @returns {Object} SEO metadata object
 */
export function generateMetadata(data, options = {}) {
  const { type = "", name = "" } = options;

  // Use admin-provided SEO data if available, otherwise generate defaults
  const title =
    data?.title || (name ? `${name} - ${APP_CONFIG.name}` : SEO_DEFAULTS.TITLE);

  const description =
    data?.metaDescription ||
    (name
      ? `Prepare for ${name} with ${APP_CONFIG.name}. ${SEO_DEFAULTS.DESCRIPTION}`
      : SEO_DEFAULTS.DESCRIPTION);

  // Handle keywords - can be string or array
  let keywords = SEO_DEFAULTS.KEYWORDS;
  if (data?.keywords) {
    if (typeof data.keywords === "string") {
      // Split comma-separated string
      keywords = data.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
    } else if (Array.isArray(data.keywords)) {
      keywords = data.keywords;
    }
    // Add default keywords if not already present
    keywords = [...new Set([...keywords, ...SEO_DEFAULTS.KEYWORDS])];
  } else if (name) {
    // Generate keywords from name
    keywords = [name, ...SEO_DEFAULTS.KEYWORDS];
  }

  return {
    title,
    description,
    keywords: keywords.join(", "),
    openGraph: {
      title,
      description,
      type: "website",
      url: `${APP_CONFIG.url}${options.path || ""}`,
      images: [
        {
          url: SEO_DEFAULTS.OG_IMAGE,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SEO_DEFAULTS.OG_IMAGE],
    },
  };
}

/**
 * Generate page title from entity data
 */
export function generatePageTitle(data, fallback = SEO_DEFAULTS.TITLE) {
  return data?.title || fallback;
}

/**
 * Generate meta description from entity data
 */
export function generateMetaDescription(
  data,
  fallback = SEO_DEFAULTS.DESCRIPTION
) {
  return data?.metaDescription || fallback;
}

/**
 * Parse keywords from string or array
 */
export function parseKeywords(keywords) {
  if (!keywords) return SEO_DEFAULTS.KEYWORDS;

  if (typeof keywords === "string") {
    return keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }

  if (Array.isArray(keywords)) {
    return keywords;
  }

  return SEO_DEFAULTS.KEYWORDS;
}

