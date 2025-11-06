import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { successResponse, errorResponse, handleApiError } from "@/utils/apiResponse";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return errorResponse("Email and password are required", 400);
    }

    // Find user by email and include password
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return errorResponse("Invalid email or password", 401);
    }

    // Check if user is active
    if (user.status !== "active") {
      return errorResponse("Account is inactive. Please contact administrator.", 403);
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return errorResponse("Invalid email or password", 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      }
    );

    // Return user data without password
    const userData = user.toJSON();

    return successResponse(
      {
        user: userData,
        token,
      },
      "Login successful"
    );
  } catch (error) {
    return handleApiError(error, "Login failed");
  }
}


