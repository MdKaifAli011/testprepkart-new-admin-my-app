import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SubTopic from "@/models/SubTopic";
import mongoose from "mongoose";
import { successResponse, errorResponse, handleApiError, notFoundResponse } from "@/utils/apiResponse";
import { ERROR_MESSAGES } from "@/constants";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid subtopic ID", 400);
    }

    const subTopic = await SubTopic.findById(id)
      .populate("examId", "name status")
      .populate("subjectId", "name")
      .populate("unitId", "name orderNumber")
      .populate("chapterId", "name orderNumber")
      .populate("topicId", "name orderNumber")
      .lean();

    if (!subTopic) {
      return notFoundResponse(ERROR_MESSAGES.SUBTOPIC_NOT_FOUND);
    }

    return successResponse(subTopic);
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.FETCH_FAILED);
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid subtopic ID", 400);
    }

    const { name, examId, subjectId, unitId, chapterId, topicId, orderNumber, status, content, title, metaDescription, keywords } = body;

    // Validate required fields
    if (!name || name.trim() === "") {
      return errorResponse("SubTopic name is required", 400);
    }

    // Check if subtopic exists
    const existingSubTopic = await SubTopic.findById(id);
    if (!existingSubTopic) {
      return notFoundResponse(ERROR_MESSAGES.SUBTOPIC_NOT_FOUND);
    }

    // Capitalize first letter of each word in subtopic name
    const subTopicName = name.trim().replace(/\b\w/g, (l) => l.toUpperCase());

    // Prepare update data
    const updateData = {
      name: subTopicName,
      content: content || "",
      title: title || "",
      metaDescription: metaDescription || "",
      keywords: keywords || "",
    };

    if (examId) updateData.examId = examId;
    if (subjectId) updateData.subjectId = subjectId;
    if (unitId) updateData.unitId = unitId;
    if (chapterId) updateData.chapterId = chapterId;
    if (topicId) updateData.topicId = topicId;
    if (orderNumber !== undefined) updateData.orderNumber = orderNumber;
    if (status) updateData.status = status;

    const updatedSubTopic = await SubTopic.findByIdAndUpdate(id, { $set: updateData }, {
      new: true,
      runValidators: true,
    })
      .populate("examId", "name status")
      .populate("subjectId", "name")
      .populate("unitId", "name orderNumber")
      .populate("chapterId", "name orderNumber")
      .populate("topicId", "name orderNumber")
      .lean();

    if (!updatedSubTopic) {
      return notFoundResponse(ERROR_MESSAGES.SUBTOPIC_NOT_FOUND);
    }

    return successResponse(updatedSubTopic, "SubTopic updated successfully");
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.UPDATE_FAILED);
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid subtopic ID", 400);
    }

    const deletedSubTopic = await SubTopic.findByIdAndDelete(id);
    if (!deletedSubTopic) {
      return notFoundResponse(ERROR_MESSAGES.SUBTOPIC_NOT_FOUND);
    }

    return successResponse(deletedSubTopic, "SubTopic deleted successfully");
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.DELETE_FAILED);
  }
}

