import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { successResponse, errorResponse } from "@/utils/apiResponse";

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return errorResponse("Invalid or expired token", 401);
    }

    return successResponse(user, "Token is valid");
  } catch (error) {
    return errorResponse("Token verification failed", 401);
  }
}


