import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SubTopic from "@/models/SubTopic";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";

// ---------- PATCH SUBTOPIC STATUS ----------
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid subtopic ID" },
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

    // Update subtopic status
    const updated = await SubTopic.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "SubTopic not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `SubTopic ${
        status === "inactive" ? "deactivated" : "activated"
      } successfully`,
      data: updated,
    });
  } catch (error) {
    logger.error("Error updating subtopic status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update subtopic status" },
      { status: 500 }
    );
  }
}

