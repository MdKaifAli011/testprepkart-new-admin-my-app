// ============================================
// Slug Utility Functions
// ============================================

import { SLUG_CONFIG } from "@/constants";

/**
 * Create URL-friendly slug from string
 * @param {String} text - Text to convert to slug
 * @returns {String} Slug string
 */
export function createSlug(text) {
  if (!text) return "";
  
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, SLUG_CONFIG.SEPARATOR)
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, SLUG_CONFIG.SEPARATOR)
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .substring(0, SLUG_CONFIG.MAX_LENGTH);
}

/**
 * Validate slug format
 */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== "string") return false;
  
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length <= SLUG_CONFIG.MAX_LENGTH;
}

/**
 * Find entity by ID or slug
 */
export function findByIdOrSlug(items, identifier) {
  if (!items || !identifier) return null;
  
  const identifierLower = identifier.toString().toLowerCase();
  
  return items.find(
    (item) =>
      item._id === identifier ||
      item._id?.toString() === identifier ||
      createSlug(item.name) === identifierLower ||
      item.name?.toLowerCase() === identifierLower ||
      item.slug === identifierLower
  ) || null;
}


