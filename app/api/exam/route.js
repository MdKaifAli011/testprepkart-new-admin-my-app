import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Exam from "@/models/Exam";
import { parsePagination, createPaginationResponse } from "@/utils/pagination";
import { successResponse, errorResponse, handleApiError } from "@/utils/apiResponse";
import { STATUS, ERROR_MESSAGES } from "@/constants";

// ✅ GET: Fetch all exams with pagination
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Parse pagination
    const { page, limit, skip } = parsePagination(searchParams);
    
    // Get status filter (default to active for public, all for admin)
    const statusFilter = searchParams.get("status") || STATUS.ACTIVE;
    const filter = statusFilter === "all" ? {} : { status: statusFilter };
    
    // Get total count
    const total = await Exam.countDocuments(filter);
    
    // Fetch exams with pagination
    const exams = await Exam.find(filter)
      .sort({ orderNumber: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("name status orderNumber createdAt")
      .lean();

    return NextResponse.json(
      createPaginationResponse(exams, total, page, limit)
    );
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.FETCH_FAILED);
  }
}

// ✅ POST: Create new exam
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim() === "") {
      return errorResponse("Exam name is required", 400);
    }

    // Capitalize exam name
    const examName = body.name.trim().toUpperCase();

    // Check for duplicate exam name
    const existingExam = await Exam.findOne({ name: examName });
    if (existingExam) {
      return errorResponse("Exam with this name already exists", 409);
    }

    // Create new exam
    const newExam = await Exam.create({
      name: examName,
      status: body.status || STATUS.ACTIVE,
      orderNumber: body.orderNumber || 1,
    });

    return successResponse(newExam, "Exam created successfully", 201);
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.SAVE_FAILED);
  }
}

