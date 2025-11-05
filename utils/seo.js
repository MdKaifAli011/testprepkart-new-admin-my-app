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
  const { type = "", name = "", path = "" } = options;

  // Use admin-provided SEO data if available, otherwise generate defaults
  const title =
    data?.title || (name ? `${name} - ${APP_CONFIG.name}` : SEO_DEFAULTS.TITLE);

  // Ensure title doesn't exceed recommended length
  const optimizedTitle = title.length > 60 ? `${title.substring(0, 57)}...` : title;

  const description =
    data?.metaDescription ||
    (name
      ? `Prepare for ${name} with ${APP_CONFIG.name}. ${SEO_DEFAULTS.DESCRIPTION}`
      : SEO_DEFAULTS.DESCRIPTION);

  // Ensure description doesn't exceed recommended length
  const optimizedDescription = description.length > 160 
    ? `${description.substring(0, 157)}...` 
    : description;

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
    // Add default keywords if not already present (limit to 10 keywords for performance)
    keywords = [...new Set([...keywords.slice(0, 10), ...SEO_DEFAULTS.KEYWORDS])];
  } else if (name) {
    // Generate keywords from name
    keywords = [name, ...SEO_DEFAULTS.KEYWORDS].slice(0, 10);
  }

  // Build canonical URL
  const canonicalUrl = `${APP_CONFIG.url}${path || ""}`;

  return {
    title: optimizedTitle,
    description: optimizedDescription,
    keywords: keywords.slice(0, 10).join(", "),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: optimizedTitle,
      description: optimizedDescription,
      type: "website",
      url: canonicalUrl,
      siteName: APP_CONFIG.name,
      images: [
        {
          url: `${APP_CONFIG.url}${SEO_DEFAULTS.OG_IMAGE}`,
          width: 1200,
          height: 630,
          alt: optimizedTitle,
        },
      ],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: optimizedTitle,
      description: optimizedDescription,
      images: [`${APP_CONFIG.url}${SEO_DEFAULTS.OG_IMAGE}`],
      creator: "@testprepkart",
      site: "@testprepkart",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
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

