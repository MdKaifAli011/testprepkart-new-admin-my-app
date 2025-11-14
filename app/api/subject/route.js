import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Subject from "@/models/Subject";
import mongoose from "mongoose";
import { parsePagination, createPaginationResponse } from "@/utils/pagination";
import { successResponse, errorResponse, handleApiError } from "@/utils/apiResponse";
import { STATUS, ERROR_MESSAGES } from "@/constants";

// Cache for frequently accessed queries
export const queryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Maximum cache entries

// Helper function to cleanup cache (LRU + expired entries)
function cleanupCache() {
  const now = Date.now();
  
  // First, remove expired entries
  for (const [key, value] of queryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      queryCache.delete(key);
    }
  }
  
  // If still over limit, remove oldest entries (LRU)
  if (queryCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(queryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    toDelete.forEach(([key]) => queryCache.delete(key));
  }
}

// ---------- GET ALL SUBJECTS (optimized) ----------
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Parse pagination
    const { page, limit, skip } = parsePagination(searchParams);
    
    // Get filters (normalize status to lowercase for case-insensitive matching)
    const examId = searchParams.get("examId");
    const statusFilterParam = searchParams.get("status") || STATUS.ACTIVE;
    const statusFilter = statusFilterParam.toLowerCase();
    
    // Build query with case-insensitive status matching
    const query = {};
    if (examId && mongoose.Types.ObjectId.isValid(examId)) {
      query.examId = examId;
    }
    if (statusFilter !== "all") {
      query.status = { $regex: new RegExp(`^${statusFilter}$`, "i") };
    }
    
    // Create cache key
    const cacheKey = `subjects-${JSON.stringify(query)}-${page}-${limit}`;
    const now = Date.now();

    // Check cache (only for active status)
    const cached = queryCache.get(cacheKey);
    if (cached && statusFilter === STATUS.ACTIVE && (now - cached.timestamp < CACHE_TTL)) {
      return NextResponse.json(cached.data);
    }

    // Optimize query execution
    const shouldCount = page === 1 || limit < 100;
    const [total, subjects] = await Promise.all([
      shouldCount ? Subject.countDocuments(query) : Promise.resolve(0),
      Subject.find(query)
        .populate("examId", "name status")
        .sort({ orderNumber: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    const response = createPaginationResponse(subjects, total, page, limit);

    // Cache the response (only for active status)
    if (statusFilter === STATUS.ACTIVE) {
      queryCache.set(cacheKey, { data: response, timestamp: now });
      cleanupCache();
    }

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.FETCH_FAILED);
  }
}

// ---------- CREATE SUBJECT ----------
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, examId, orderNumber, status } = body;

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

    // Create new subject (content/SEO fields are now in SubjectDetails)
    const subject = await Subject.create({
      name: subjectName,
      examId,
      orderNumber: finalOrderNumber,
      status: status || STATUS.ACTIVE,
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

