import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Subject from "@/models/Subject";
import Unit from "@/models/Unit";
import Chapter from "@/models/Chapter";
import Topic from "@/models/Topic";
import SubTopic from "@/models/SubTopic";
import mongoose from "mongoose";
import {
  successResponse,
  errorResponse,
  handleApiError,
  notFoundResponse,
} from "@/utils/apiResponse";
import { ERROR_MESSAGES } from "@/constants";

// ---------- GET SINGLE SUBJECT ----------
export async function GET(_request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid subject ID", 400);
    }

    const subject = await Subject.findById(id)
      .populate("examId", "name status")
      .lean();

    if (!subject) {
      return notFoundResponse(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
    }

    return successResponse(subject);
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.FETCH_FAILED);
  }
}

// ---------- UPDATE SUBJECT ----------
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid subject ID", 400);
    }

    const {
      name,
      examId,
      orderNumber,
      status,
      content,
      title,
      metaDescription,
      keywords,
    } = body;

    // Validate required fields
    if (!name || name.trim() === "") {
      return errorResponse("Subject name is required", 400);
    }

    // Check if subject exists
    const existingSubject = await Subject.findById(id);
    if (!existingSubject) {
      return notFoundResponse(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
    }

    // Capitalize first letter of each word in subject name
    const subjectName = name.trim().replace(/\b\w/g, (l) => l.toUpperCase());

    // Check for duplicate name
    const duplicate = await Subject.findOne({
      name: subjectName,
      _id: { $ne: id },
      ...(examId && { examId }),
    });
    if (duplicate) {
      return errorResponse("Subject with same name already exists", 409);
    }

    // Prepare update data
    const updateData = {
      name: subjectName,
      content: content || "",
      title: title || "",
      metaDescription: metaDescription || "",
      keywords: keywords || "",
    };

    if (examId) updateData.examId = examId;
    if (orderNumber !== undefined) updateData.orderNumber = orderNumber;
    if (status) updateData.status = status;

    const updated = await Subject.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("examId", "name status")
      .lean();

    if (!updated) {
      return notFoundResponse(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
    }

    return successResponse(updated, "Subject updated successfully");
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.UPDATE_FAILED);
  }
}

// ---------- PATCH SUBJECT (Reorder/Status) ----------
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { orderNumber, status } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid subject ID", 400);
    }

    const updateData = {};
    if (orderNumber !== undefined) updateData.orderNumber = orderNumber;
    if (status) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No valid update fields provided", 400);
    }

    const updated = await Subject.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("examId", "name status")
      .lean();

    if (!updated) {
      return notFoundResponse(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
    }

    return successResponse(updated, "Subject updated successfully");
  } catch (error) {
    return handleApiError(error, "Failed to update subject");
  }
}

// ---------- DELETE SUBJECT ----------
export async function DELETE(_request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid subject ID", 400);
    }

    const deleted = await Subject.findByIdAndDelete(id);
    if (!deleted) {
      return notFoundResponse(ERROR_MESSAGES.SUBJECT_NOT_FOUND);
    }

    return successResponse(deleted, "Subject deleted successfully");
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.DELETE_FAILED);
  }
}
