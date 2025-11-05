import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Exam from "@/models/Exam";
import Subject from "@/models/Subject";
import Unit from "@/models/Unit";
import Chapter from "@/models/Chapter";
import Topic from "@/models/Topic";
import SubTopic from "@/models/SubTopic";
import mongoose from "mongoose";
import { successResponse, errorResponse, handleApiError, notFoundResponse } from "@/utils/apiResponse";
import { ERROR_MESSAGES } from "@/constants";

// ---------- GET SINGLE EXAM ----------
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid exam ID", 400);
    }

    const exam = await Exam.findById(id).lean();

    if (!exam) {
      return notFoundResponse(ERROR_MESSAGES.EXAM_NOT_FOUND);
    }

    return successResponse(exam);
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.FETCH_FAILED);
  }
}

// ---------- UPDATE EXAM ----------
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid exam ID", 400);
    }

    const { name, status, content, title, metaDescription, keywords, orderNumber } = body;

    // Validate required fields
    if (!name || name.trim() === "") {
      return errorResponse("Exam name is required", 400);
    }

    // Check if exam exists
    const existingExam = await Exam.findById(id);
    if (!existingExam) {
      return notFoundResponse(ERROR_MESSAGES.EXAM_NOT_FOUND);
    }

    // Capitalize exam name
    const examName = name.trim().toUpperCase();

    // Check for duplicate name
    const duplicate = await Exam.findOne({
      name: examName,
      _id: { $ne: id },
    });
    if (duplicate) {
      return errorResponse("Exam with same name already exists", 409);
    }

    // Prepare update data
    const updateData = {
      name: examName,
      content: content || "",
      title: title || "",
      metaDescription: metaDescription || "",
      keywords: keywords || "",
    };

    if (status) updateData.status = status;
    if (orderNumber !== undefined) updateData.orderNumber = orderNumber;

    const updated = await Exam.findByIdAndUpdate(id, { $set: updateData }, {
      new: true,
      runValidators: true,
    });

    return successResponse(updated, "Exam updated successfully");
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.UPDATE_FAILED);
  }
}

// ---------- PATCH EXAM (Status Update with Cascading) ----------
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid exam ID", 400);
    }

    const { status, orderNumber } = body;

    if (status && !["active", "inactive"].includes(status)) {
      return errorResponse("Valid status is required (active or inactive)", 400);
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (orderNumber !== undefined) updateData.orderNumber = orderNumber;

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No valid update fields provided", 400);
    }

    const updated = await Exam.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!updated) {
      return notFoundResponse(ERROR_MESSAGES.EXAM_NOT_FOUND);
    }

    // Cascading: Update all children status if status changed
    if (status) {
      await Promise.all([
        SubTopic.updateMany({ examId: id }, { status }),
        Topic.updateMany({ examId: id }, { status }),
        Chapter.updateMany({ examId: id }, { status }),
        Unit.updateMany({ examId: id }, { status }),
        Subject.updateMany({ examId: id }, { status }),
      ]);
    }

    return successResponse(
      updated,
      `Exam ${status === "inactive" ? "deactivated" : "updated"} successfully`
    );
  } catch (error) {
    return handleApiError(error, "Failed to update exam");
  }
}

// ---------- DELETE EXAM ----------
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid exam ID", 400);
    }

    const deleted = await Exam.findByIdAndDelete(id);
    if (!deleted) {
      return notFoundResponse(ERROR_MESSAGES.EXAM_NOT_FOUND);
    }

    return successResponse(deleted, "Exam deleted successfully");
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.DELETE_FAILED);
  }
}

