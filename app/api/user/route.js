import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";
import { parsePagination, createPaginationResponse } from "@/utils/pagination";
import { successResponse, errorResponse, handleApiError } from "@/utils/apiResponse";
import { requireUserManagement } from "@/middleware/authMiddleware";

// GET: Fetch all users with pagination
export async function GET(request) {
  try {
    // Check authentication and permissions (only admin can view users)
    const authCheck = await requireUserManagement(request);
    if (authCheck.error) {
      return NextResponse.json(authCheck, { status: authCheck.status || 403 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);

    // Parse pagination
    const { page, limit, skip } = parsePagination(searchParams);

    // Get filters
    const roleFilter = searchParams.get("role");
    const statusFilter = searchParams.get("status");
    const searchQuery = searchParams.get("search");

    // Build query
    const query = {};

    if (roleFilter) {
      query.role = roleFilter;
    }

    if (statusFilter) {
      query.status = statusFilter.toLowerCase();
    }

    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Get total count
    const total = await User.countDocuments(query);

    // Fetch users with pagination
    const users = await User.find(query)
      .select("-password") // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      createPaginationResponse(users, total, page, limit)
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch users");
  }
}

// POST: Create new user (admin only)
export async function POST(request) {
  try {
    // Check authentication and permissions (only admin can create users)
    const authCheck = await requireUserManagement(request);
    if (authCheck.error) {
      return NextResponse.json(authCheck, { status: authCheck.status || 403 });
    }

    await connectDB();
    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return errorResponse("Name, email, password, and role are required", 400);
    }

    // Validate role
    const validRoles = ["admin", "super_moderator", "moderator", "editor", "viewer"];
    if (!validRoles.includes(role)) {
      return errorResponse("Invalid role", 400);
    }

    // Validate password length
    if (password.length < 6) {
      return errorResponse("Password must be at least 6 characters long", 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return errorResponse("User with this email already exists", 409);
    }

    // Create new user
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      status: "active",
    });

    // Return user data without password
    const userData = newUser.toJSON();

    return successResponse(userData, "User created successfully", 201);
  } catch (error) {
    return handleApiError(error, "Failed to create user");
  }
}

