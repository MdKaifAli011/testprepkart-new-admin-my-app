import jwt from "jsonwebtoken";

/**
 * Get JWT secret with validation
 * @returns {string} JWT secret
 * @throws {Error} If JWT_SECRET is not set
 */
export function getJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET environment variable is required. Please set it in your .env file."
    );
  }
  return jwtSecret;
}

/**
 * Verify JWT token and return decoded user data
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded token data or null if invalid
 */
export function verifyToken(token) {
  try {
    if (!token) {
      return null;
    }

    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret);

    return decoded;
  } catch (error) {
    // Re-throw if it's a JWT_SECRET error
    if (error.message && error.message.includes("JWT_SECRET")) {
      throw error;
    }
    // Don't log expired token errors - it's expected behavior
    // Only log unexpected errors
    if (error.name !== 'TokenExpiredError' && error.name !== 'JsonWebTokenError') {
      console.error("Token verification error:", error);
    }
    return null;
  }
}

/**
 * Get user from request headers (for API routes)
 * @param {Request} request - Next.js request object
 * @returns {object|null} - User data or null
 */
export async function getUserFromRequest(request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const decoded = verifyToken(token);

    return decoded;
  } catch (error) {
    console.error("Error getting user from request:", error);
    return null;
  }
}

/**
 * Check if user has required role
 * @param {string} userRole - User's role
 * @param {string|string[]} requiredRoles - Required role(s)
 * @returns {boolean} - True if user has required role
 */
export function hasRole(userRole, requiredRoles) {
  if (!userRole) {
    return false;
  }

  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userRole);
  }

  return userRole === requiredRoles;
}

/**
 * Check if user can perform action based on role
 * @param {string} userRole - User's role
 * @param {string} action - Action to perform (GET, POST, PUT, PATCH, DELETE)
 * @returns {boolean} - True if user can perform action
 */
export function canPerformAction(userRole, action) {
  if (!userRole) {
    return false;
  }

  const rolePermissions = {
    viewer: ["GET"],
    editor: ["GET", "PUT", "PATCH"],
    moderator: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    super_moderator: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    admin: ["GET", "POST", "PUT", "PATCH", "DELETE", "MANAGE_USERS"],
  };

  const allowedActions = rolePermissions[userRole] || [];
  return allowedActions.includes(action);
}

/**
 * Check if user can manage users (only admin)
 * @param {string} userRole - User's role
 * @returns {boolean} - True if user can manage users
 */
export function canManageUsers(userRole) {
  return userRole === "admin";
}


