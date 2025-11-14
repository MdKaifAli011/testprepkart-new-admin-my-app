import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PracticeQuestion from "@/models/PracticeQuestion";
import mongoose from "mongoose";
import { successResponse, errorResponse, notFoundResponse } from "@/utils/apiResponse";
import { logger } from "@/utils/logger";

// ---------- PATCH PRACTICE QUESTION STATUS ----------
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid question ID", 400);
    }

    if (!status || !["active", "inactive"].includes(status.toLowerCase())) {
      return errorResponse(
        "Valid status is required (active or inactive)",
        400
      );
    }

    const updated = await PracticeQuestion.findByIdAndUpdate(
      id,
      { status: status.toLowerCase() },
      { new: true }
    )
      .populate("subCategoryId", "name status categoryId")
      .lean();

    if (!updated) {
      return notFoundResponse("Practice question not found");
    }

    // Clear cache
    try {
      const questionRouteModule = await import("../../route");
      if (questionRouteModule?.queryCache) {
        questionRouteModule.queryCache.clear();
        logger.info("Cleared practice question query cache");
      }
    } catch (cacheError) {
      logger.warn("Could not clear practice question cache:", cacheError);
    }

    return successResponse(
      updated,
      `Practice question ${status === "inactive" ? "deactivated" : "activated"} successfully`
    );
  } catch (error) {
    logger.error("Error updating practice question status:", error);
    return errorResponse("Failed to update practice question status", 500);
  }
}

