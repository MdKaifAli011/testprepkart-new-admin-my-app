import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { successResponse, errorResponse, handleApiError } from "@/utils/apiResponse";
import { getJwtSecret } from "@/lib/auth";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, password, adminCode } = body;

    // Validate required fields
    if (!name || !email || !password || !adminCode) {
      return errorResponse(
        "Name, email, password, and admin code are required",
        400
      );
    }

    // Validate admin code
    const requiredAdminCode = process.env.ADMIN_REGISTRATION_CODE;
    if (!requiredAdminCode) {
      return errorResponse(
        "Admin registration code is not configured. Please contact system administrator.",
        500
      );
    }

    if (adminCode !== requiredAdminCode) {
      return errorResponse("Invalid admin registration code", 403);
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

    // Create new user (default role is admin for registration with admin code)
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: "admin", // Default to admin when registered with admin code
      status: "active",
    });

    // Generate JWT token
    const jwtSecret = getJwtSecret();
    const token = jwt.sign(
      {
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      }
    );

    // Return user data without password
    const userData = newUser.toJSON();

    return successResponse(
      {
        user: userData,
        token,
      },
      "Registration successful",
      201
    );
  } catch (error) {
    return handleApiError(error, "Registration failed");
  }
}


