import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Chapter from "@/models/Chapter";
import Exam from "@/models/Exam";
import Subject from "@/models/Subject";
import Unit from "@/models/Unit";
import mongoose from "mongoose";
import { parsePagination, createPaginationResponse } from "@/utils/pagination";
import { successResponse, errorResponse, handleApiError } from "@/utils/apiResponse";
import { STATUS, ERROR_MESSAGES } from "@/constants";

// ---------- GET ALL CHAPTERS ----------
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Parse pagination
    const { page, limit, skip } = parsePagination(searchParams);
    
    // Get filters (normalize status to lowercase for case-insensitive matching)
    const unitId = searchParams.get("unitId");
    const subjectId = searchParams.get("subjectId");
    const examId = searchParams.get("examId");
    const statusFilterParam = searchParams.get("status") || STATUS.ACTIVE;
    const statusFilter = statusFilterParam.toLowerCase();

    // Build query with case-insensitive status matching
    const query = {};
    if (unitId && mongoose.Types.ObjectId.isValid(unitId)) {
      query.unitId = unitId;
    }
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
      query.subjectId = subjectId;
    }
    if (examId && mongoose.Types.ObjectId.isValid(examId)) {
      query.examId = examId;
    }
    if (statusFilter !== "all") {
      query.status = { $regex: new RegExp(`^${statusFilter}$`, "i") };
    }

    // Get total count
    const total = await Chapter.countDocuments(query);

    // Fetch chapters with pagination
    const chapters = await Chapter.find(query)
      .populate("examId", "name status")
      .populate("subjectId", "name")
      .populate("unitId", "name orderNumber")
      .sort({ orderNumber: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      createPaginationResponse(chapters, total, page, limit)
    );
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.FETCH_FAILED);
  }
}

// ---------- CREATE NEW CHAPTER ----------
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, examId, subjectId, unitId, orderNumber, status, content, title, metaDescription, keywords } = body;

    // Validation
    if (!name || !examId || !subjectId || !unitId) {
      return errorResponse("Chapter name, exam, subject, and unit are required", 400);
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(examId) || 
        !mongoose.Types.ObjectId.isValid(subjectId) || 
        !mongoose.Types.ObjectId.isValid(unitId)) {
      return errorResponse("Invalid ID format", 400);
    }

    // Check if exam, subject, and unit exist
    const [exam, subject, unit] = await Promise.all([
      Exam.findById(examId),
      Subject.findById(subjectId),
      Unit.findById(unitId),
    ]);

    if (!exam) return errorResponse(ERROR_MESSAGES.EXAM_NOT_FOUND, 404);
    if (!subject) return errorResponse(ERROR_MESSAGES.SUBJECT_NOT_FOUND, 404);
    if (!unit) return errorResponse(ERROR_MESSAGES.UNIT_NOT_FOUND, 404);

    // Capitalize first letter of each word in chapter name
    const chapterName = name.trim().replace(/\b\w/g, (l) => l.toUpperCase());

    // Check if chapter name already exists in the same unit
    const existingChapter = await Chapter.findOne({
      name: chapterName,
      unitId: unitId,
    });

    if (existingChapter) {
      return errorResponse("Chapter name already exists in this unit", 409);
    }

    // Auto-generate order number if not provided
    let finalOrderNumber = orderNumber;
    if (!finalOrderNumber) {
      const lastChapter = await Chapter.findOne({ unitId })
        .sort({ orderNumber: -1 })
        .select("orderNumber")
        .lean();
      finalOrderNumber = lastChapter ? lastChapter.orderNumber + 1 : 1;
    }

    // Create new chapter
    const chapter = await Chapter.create({
      name: chapterName,
      examId,
      subjectId,
      unitId,
      orderNumber: finalOrderNumber,
      status: status || STATUS.ACTIVE,
      content: content || "",
      title: title || "",
      metaDescription: metaDescription || "",
      keywords: keywords || "",
    });

    // Populate the data before returning
    const populatedChapter = await Chapter.findById(chapter._id)
      .populate("examId", "name status")
      .populate("subjectId", "name")
      .populate("unitId", "name orderNumber")
      .lean();

    return successResponse(populatedChapter, "Chapter created successfully", 201);
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.SAVE_FAILED);
  }
}

