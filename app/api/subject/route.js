import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Subject from "@/models/Subject";
import mongoose from "mongoose";
import { parsePagination, createPaginationResponse } from "@/utils/pagination";
import { successResponse, errorResponse, handleApiError } from "@/utils/apiResponse";
import { STATUS, ERROR_MESSAGES } from "@/constants";

// ---------- GET ALL SUBJECTS ----------
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Parse pagination
    const { page, limit, skip } = parsePagination(searchParams);
    
    // Get filters
    const examId = searchParams.get("examId");
    const statusFilter = searchParams.get("status") || STATUS.ACTIVE;
    
    // Build query
    const query = {};
    if (examId && mongoose.Types.ObjectId.isValid(examId)) {
      query.examId = examId;
    }
    if (statusFilter !== "all") {
      query.status = statusFilter;
    }
    
    // Get total count
    const total = await Subject.countDocuments(query);
    
    // Fetch subjects with pagination
    const subjects = await Subject.find(query)
      .populate("examId", "name status")
      .sort({ orderNumber: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      createPaginationResponse(subjects, total, page, limit)
    );
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.FETCH_FAILED);
  }
}

// ---------- CREATE SUBJECT ----------
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, examId, orderNumber, status, content, title, metaDescription, keywords } = body;

    // Validate required fields
    if (!name || !examId) {
      return errorResponse("Name and examId are required", 400);
    }

    // Validate examId format
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return errorResponse("Invalid examId format", 400);
    }

    // Check if exam exists
    const Exam = (await import("@/models/Exam")).default;
    const examExists = await Exam.findById(examId);
    if (!examExists) {
      return errorResponse(ERROR_MESSAGES.EXAM_NOT_FOUND, 404);
    }

    // Capitalize first letter of each word in subject name
    const subjectName = name.trim().replace(/\b\w/g, (l) => l.toUpperCase());

    // Check for duplicate subject name within the same exam
    const existingSubject = await Subject.findOne({
      name: subjectName,
      examId,
    });
    if (existingSubject) {
      return errorResponse("Subject with this name already exists for this exam", 409);
    }

    // Determine orderNumber
    let finalOrderNumber = orderNumber;
    if (finalOrderNumber === undefined || finalOrderNumber === null) {
      const maxOrderDoc = await Subject.findOne({ examId })
        .sort({ orderNumber: -1 })
        .select("orderNumber")
        .lean();
      finalOrderNumber = maxOrderDoc ? (maxOrderDoc.orderNumber || 0) + 1 : 1;
    }

    // Create new subject
    const subject = await Subject.create({
      name: subjectName,
      examId,
      orderNumber: finalOrderNumber,
      status: status || STATUS.ACTIVE,
      content: content || "",
      title: title || "",
      metaDescription: metaDescription || "",
      keywords: keywords || "",
    });

    // Populate the exam data before returning
    const populatedSubject = await Subject.findById(subject._id)
      .populate("examId", "name status")
      .lean();

    return successResponse(populatedSubject, "Subject created successfully", 201);
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.SAVE_FAILED);
  }
}

