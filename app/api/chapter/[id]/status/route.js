import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Chapter from "@/models/Chapter";
// Import all child models to ensure they're registered before middleware runs
import Topic from "@/models/Topic";
import SubTopic from "@/models/SubTopic";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";

// ---------- PATCH CHAPTER STATUS (with Cascading) ----------
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid chapter ID" },
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

    // Update chapter status
    const updated = await Chapter.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Chapter not found" },
        { status: 404 }
      );
    }

    // Cascading: Update all children status
    logger.info(`Cascading status update to ${status} for chapter ${id}`);

    // Find all topics in this chapter
    const topics = await Topic.find({ chapterId: id });
    const topicIds = topics.map((topic) => topic._id);

    // Update all subtopics in these topics
    let subTopicsResult = { modifiedCount: 0 };
    if (topicIds.length > 0) {
      subTopicsResult = await SubTopic.updateMany(
        { topicId: { $in: topicIds } },
        { $set: { status } }
      );
    }
    logger.info(`Updated ${subTopicsResult.modifiedCount} SubTopics`);

    // Update all topics in this chapter
    const topicsResult = await Topic.updateMany(
      { chapterId: id },
      { $set: { status } }
    );
    logger.info(`Updated ${topicsResult.modifiedCount} Topics`);

    return NextResponse.json({
      success: true,
      message: `Chapter and all children ${
        status === "inactive" ? "deactivated" : "activated"
      } successfully`,
      data: updated,
    });
  } catch (error) {
    logger.error("Error updating chapter status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update chapter status" },
      { status: 500 }
    );
  }
}

