import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Unit from "@/models/Unit";
import mongoose from "mongoose";
import { parsePagination, createPaginationResponse } from "@/utils/pagination";
import { successResponse, errorResponse, handleApiError } from "@/utils/apiResponse";
import { STATUS, ERROR_MESSAGES } from "@/constants";

// ---------- GET ALL UNITS ----------
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Parse pagination
    const { page, limit, skip } = parsePagination(searchParams);
    
    // Get filters
    const subjectId = searchParams.get("subjectId");
    const examId = searchParams.get("examId");
    const statusFilter = searchParams.get("status") || STATUS.ACTIVE;

    // Build query
    const query = {};
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
      query.subjectId = subjectId;
    }
    if (examId && mongoose.Types.ObjectId.isValid(examId)) {
      query.examId = examId;
    }
    if (statusFilter !== "all") {
      query.status = statusFilter;
    }

    // Get total count
    const total = await Unit.countDocuments(query);

    // Fetch units with pagination
    const units = await Unit.find(query)
      .populate("subjectId", "name")
      .populate("examId", "name status")
      .sort({ orderNumber: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      createPaginationResponse(units, total, page, limit)
    );
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.FETCH_FAILED);
  }
}

// ---------- CREATE UNIT ----------
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, orderNumber, subjectId, examId, status, content, title, metaDescription, keywords } = body;

    // Validate required fields
    if (!name || !subjectId || !examId) {
      return errorResponse("Name, subjectId, and examId are required", 400);
    }

    // Validate ObjectId formats
    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(examId)
    ) {
      return errorResponse("Invalid subjectId or examId format", 400);
    }

    // Check if subject and exam exist
    const Subject = (await import("@/models/Subject")).default;
    const Exam = (await import("@/models/Exam")).default;

    const [subjectExists, examExists] = await Promise.all([
      Subject.findById(subjectId),
      Exam.findById(examId),
    ]);

    if (!subjectExists) {
      return errorResponse(ERROR_MESSAGES.SUBJECT_NOT_FOUND, 404);
    }

    if (!examExists) {
      return errorResponse(ERROR_MESSAGES.EXAM_NOT_FOUND, 404);
    }

    // Capitalize first letter of each word in unit name
    const unitName = name.trim().replace(/\b\w/g, (l) => l.toUpperCase());

    // Check for duplicate unit name within the same subject
    const existingUnit = await Unit.findOne({
      name: unitName,
      subjectId,
    });
    if (existingUnit) {
      return errorResponse("Unit with this name already exists in this subject", 409);
    }

    // Auto-generate orderNumber if not provided
    let finalOrderNumber = orderNumber;
    if (!finalOrderNumber) {
      const lastUnit = await Unit.findOne({ subjectId })
        .sort({ orderNumber: -1 })
        .select("orderNumber")
        .lean();
      finalOrderNumber = lastUnit ? lastUnit.orderNumber + 1 : 1;
    }

    // Create new unit
    const unit = await Unit.create({
      name: unitName,
      orderNumber: finalOrderNumber,
      subjectId,
      examId,
      status: status || STATUS.ACTIVE,
      content: content || "",
      title: title || "",
      metaDescription: metaDescription || "",
      keywords: keywords || "",
    });

    // Populate the data before returning
    const populatedUnit = await Unit.findById(unit._id)
      .populate("subjectId", "name")
      .populate("examId", "name status")
      .lean();

    return successResponse(populatedUnit, "Unit created successfully", 201);
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.SAVE_FAILED);
  }
}

