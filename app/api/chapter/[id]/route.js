import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Chapter from "@/models/Chapter";
import Topic from "@/models/Topic";
import SubTopic from "@/models/SubTopic";
import mongoose from "mongoose";
import { successResponse, errorResponse, handleApiError, notFoundResponse } from "@/utils/apiResponse";
import { ERROR_MESSAGES } from "@/constants";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid chapter ID", 400);
    }

    const chapter = await Chapter.findById(id)
      .populate("examId", "name status")
      .populate("subjectId", "name")
      .populate("unitId", "name orderNumber")
      .lean();

    if (!chapter) {
      return notFoundResponse(ERROR_MESSAGES.CHAPTER_NOT_FOUND);
    }

    return successResponse(chapter);
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
      return errorResponse("Invalid chapter ID", 400);
    }

    const { name, examId, subjectId, unitId, orderNumber, weightage, time, questions, status } = body;

    // Validate required fields
    if (!name || name.trim() === "") {
      return errorResponse("Chapter name is required", 400);
    }

    // Check if chapter exists
    const existingChapter = await Chapter.findById(id);
    if (!existingChapter) {
      return notFoundResponse(ERROR_MESSAGES.CHAPTER_NOT_FOUND);
    }

    // Capitalize first letter of each word in chapter name
    const chapterName = name.trim().replace(/\b\w/g, (l) => l.toUpperCase());

    // Prepare update data (content/SEO fields are now in ChapterDetails)
    const updateData = {
      name: chapterName,
    };

    if (examId) updateData.examId = examId;
    if (subjectId) updateData.subjectId = subjectId;
    if (unitId) updateData.unitId = unitId;
    if (orderNumber !== undefined) updateData.orderNumber = orderNumber;
    if (weightage !== undefined) updateData.weightage = weightage;
    if (time !== undefined) updateData.time = time;
    if (questions !== undefined) updateData.questions = questions;
    if (status) updateData.status = status;

    const updatedChapter = await Chapter.findByIdAndUpdate(id, { $set: updateData }, {
      new: true,
      runValidators: true,
    })
      .populate("examId", "name status")
      .populate("subjectId", "name")
      .populate("unitId", "name orderNumber")
      .lean();

    if (!updatedChapter) {
      return notFoundResponse(ERROR_MESSAGES.CHAPTER_NOT_FOUND);
    }

    return successResponse(updatedChapter, "Chapter updated successfully");
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.UPDATE_FAILED);
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid chapter ID", 400);
    }

    const deletedChapter = await Chapter.findByIdAndDelete(id);
    if (!deletedChapter) {
      return notFoundResponse(ERROR_MESSAGES.CHAPTER_NOT_FOUND);
    }

    return successResponse(deletedChapter, "Chapter deleted successfully");
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.DELETE_FAILED);
  }
}

