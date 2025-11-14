import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SubTopicDetails from "@/models/SubTopicDetails";
import SubTopic from "@/models/SubTopic";
import mongoose from "mongoose";
import {
  successResponse,
  errorResponse,
  handleApiError,
  notFoundResponse,
} from "@/utils/apiResponse";
import { ERROR_MESSAGES } from "@/constants";

// ---------- GET SUBTOPIC DETAILS ----------
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid subtopic ID", 400);
    }

    // Check if subtopic exists
    const subTopic = await SubTopic.findById(id);
    if (!subTopic) {
      return notFoundResponse(ERROR_MESSAGES.SUBTOPIC_NOT_FOUND);
    }

    // Find or create details
    let details = await SubTopicDetails.findOne({ subTopicId: id }).lean();
    
    // If no details exist, return empty defaults
    if (!details) {
      details = {
        subTopicId: id,
        content: "",
        title: "",
        metaDescription: "",
        keywords: "",
      };
    }

    return successResponse(details);
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.FETCH_FAILED);
  }
}

// ---------- CREATE OR UPDATE SUBTOPIC DETAILS ----------
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid subtopic ID", 400);
    }

    // Check if subtopic exists
    const subTopic = await SubTopic.findById(id);
    if (!subTopic) {
      return notFoundResponse(ERROR_MESSAGES.SUBTOPIC_NOT_FOUND);
    }

    const { content, title, metaDescription, keywords } = body;

    // Prepare update data
    const updateData = {
      subTopicId: id,
      content: content || "",
      title: title || "",
      metaDescription: metaDescription || "",
      keywords: keywords || "",
    };

    // Use upsert to create or update
    const details = await SubTopicDetails.findOneAndUpdate(
      { subTopicId: id },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    return successResponse(details, "SubTopic details saved successfully");
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.UPDATE_FAILED);
  }
}

// ---------- DELETE SUBTOPIC DETAILS ----------
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid subtopic ID", 400);
    }

    const deleted = await SubTopicDetails.findOneAndDelete({ subTopicId: id });
    
    if (!deleted) {
      return notFoundResponse("SubTopic details not found");
    }

    return successResponse(deleted, "SubTopic details deleted successfully");
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.DELETE_FAILED);
  }
}

