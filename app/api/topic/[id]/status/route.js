import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Topic from "@/models/Topic";
// Import child model to ensure it's registered before middleware runs
import SubTopic from "@/models/SubTopic";
import mongoose from "mongoose";
import { requireAction } from "@/middleware/authMiddleware";
import { logger } from "@/utils/logger";

// ---------- PATCH TOPIC STATUS (with Cascading) ----------
export async function PATCH(request, { params }) {
  try {
    // Check authentication and permissions (users need to be able to update)
    const authCheck = await requireAction(request, "PATCH");
    if (authCheck.error) {
      return NextResponse.json(authCheck, { status: authCheck.status || 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid topic ID" },
        { status: 400 }
      );
    }

    if (!status || !["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid status is required (active or inactive)",
        },
        { status: 400 }
      );
    }

    // Update topic status
    const updated = await Topic.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Topic not found" },
        { status: 404 }
      );
    }

    // Cascading: Update all children status
    logger.info(`Cascading status update to ${status} for topic ${id}`);

    const result = await SubTopic.updateMany(
      { topicId: id },
      { $set: { status } }
    );
    logger.info(`Updated ${result.modifiedCount} SubTopics`);

    return NextResponse.json({
      success: true,
      message: `Topic and all children ${
        status === "inactive" ? "deactivated" : "activated"
      } successfully`,
      data: updated,
    });
  } catch (error) {
    logger.error("Error updating topic status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update topic status" },
      { status: 500 }
    );
  }
}

