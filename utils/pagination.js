// ============================================
// Pagination Utility Functions
// ============================================

import { PAGINATION } from "@/constants";

/**
 * Parse pagination parameters from request
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object} Pagination object with page and limit
 */
export function parsePagination(searchParams) {
  const page = Math.max(
    PAGINATION.DEFAULT_PAGE,
    parseInt(searchParams.get("page") || PAGINATION.DEFAULT_PAGE, 10)
  );

  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(
      PAGINATION.MIN_LIMIT,
      parseInt(searchParams.get("limit") || PAGINATION.DEFAULT_LIMIT, 10)
    )
  );

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Create pagination response
 * @param {Array} data - Data array
 * @param {Number} total - Total count
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @returns {Object} Pagination response object
 */
export function createPaginationResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
  };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page, limit) {
  const errors = [];

  if (page < 1) {
    errors.push("Page must be greater than 0");
  }

  if (limit < PAGINATION.MIN_LIMIT) {
    errors.push(`Limit must be at least ${PAGINATION.MIN_LIMIT}`);
  }

  if (limit > PAGINATION.MAX_LIMIT) {
    errors.push(`Limit cannot exceed ${PAGINATION.MAX_LIMIT}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

