import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";
import { successResponse, errorResponse, handleApiError } from "@/utils/apiResponse";
import { requireUserManagement, requireAction } from "@/middleware/authMiddleware";

// GET: Fetch user by ID
export async function GET(request, { params }) {
  try {
    // Check authentication and permissions (only admin can view users)
    const authCheck = await requireUserManagement(request);
    if (authCheck.error) {
      return NextResponse.json(authCheck, { status: authCheck.status || 403 });
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid user ID", 400);
    }

    const user = await User.findById(id).select("-password").lean();

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse(user, "User fetched successfully");
  } catch (error) {
    return handleApiError(error, "Failed to fetch user");
  }
}

// PUT: Update user
export async function PUT(request, { params }) {
  try {
    // Check authentication and permissions (only admin can update users)
    const authCheck = await requireUserManagement(request);
    if (authCheck.error) {
      return NextResponse.json(authCheck, { status: authCheck.status || 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid user ID", 400);
    }

    const user = await User.findById(id);

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Update allowed fields
    if (body.name !== undefined) {
      user.name = body.name.trim();
    }

    if (body.email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email: body.email.toLowerCase().trim(),
        _id: { $ne: id },
      });

      if (existingUser) {
        return errorResponse("Email is already taken", 409);
      }

      user.email = body.email.toLowerCase().trim();
    }

    if (body.role !== undefined) {
      const validRoles = ["admin", "super_moderator", "moderator", "editor", "viewer"];
      if (!validRoles.includes(body.role)) {
        return errorResponse("Invalid role", 400);
      }
      user.role = body.role;
    }

    if (body.status !== undefined) {
      const validStatuses = ["active", "inactive"];
      if (!validStatuses.includes(body.status.toLowerCase())) {
        return errorResponse("Invalid status", 400);
      }
      user.status = body.status.toLowerCase();
    }

    if (body.password !== undefined) {
      if (body.password.length < 6) {
        return errorResponse("Password must be at least 6 characters long", 400);
      }
      user.password = body.password; // Will be hashed by pre-save hook
    }

    await user.save();

    // Return user data without password
    const userData = user.toJSON();

    return successResponse(userData, "User updated successfully");
  } catch (error) {
    return handleApiError(error, "Failed to update user");
  }
}

// DELETE: Delete user
export async function DELETE(request, { params }) {
  try {
    // Check authentication and permissions (only admin can delete users)
    const authCheck = await requireUserManagement(request);
    if (authCheck.error) {
      return NextResponse.json(authCheck, { status: authCheck.status || 403 });
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid user ID", 400);
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse(null, "User deleted successfully");
  } catch (error) {
    return handleApiError(error, "Failed to delete user");
  }
}

