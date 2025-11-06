import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Exam from "@/models/Exam";
import { parsePagination, createPaginationResponse } from "@/utils/pagination";
import { successResponse, errorResponse, handleApiError } from "@/utils/apiResponse";
import { buildQueryFromParams, getCachedOrExecute, optimizedFind } from "@/utils/apiRouteHelpers";
import { STATUS, ERROR_MESSAGES } from "@/constants";

// Cache for frequently accessed queries
export const queryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ✅ GET: Fetch all exams with pagination (optimized)
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Parse pagination
    const { page, limit, skip } = parsePagination(searchParams);
    
    // Get status filter (normalize to lowercase for consistent matching)
    const statusFilterParam = searchParams.get("status") || STATUS.ACTIVE;
    const statusFilter = statusFilterParam.toLowerCase();
    
    // Build query with case-insensitive status matching
    let query = {};
    if (statusFilter !== "all") {
      // Use regex for case-insensitive matching
      query.status = { $regex: new RegExp(`^${statusFilter}$`, "i") };
    }
    
    // Create cache key
    const cacheKey = `exams-${statusFilter}-${page}-${limit}`;
    const now = Date.now();

    // Check cache (only for active status)
    const cached = queryCache.get(cacheKey);
    if (cached && statusFilter === STATUS.ACTIVE && (now - cached.timestamp < CACHE_TTL)) {
      return NextResponse.json(cached.data);
    }

    // Optimize query execution
    const shouldCount = page === 1 || limit < 100;
    const [total, exams] = await Promise.all([
      shouldCount ? Exam.countDocuments(query) : Promise.resolve(0),
      Exam.find(query)
        .sort({ orderNumber: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name status orderNumber createdAt")
        .lean()
        .exec(),
    ]);

    // Ensure all returned exams are valid (have name and match status)
    const validExams = exams.filter((exam) => {
      if (!exam || !exam.name) return false;
      // Double-check status match (case-insensitive)
      if (statusFilter !== "all") {
        return exam.status && exam.status.toLowerCase() === statusFilter;
      }
      return true;
    });

    // Update total count based on valid exams if needed
    const actualTotal = shouldCount ? total : validExams.length;
    const response = createPaginationResponse(validExams, actualTotal, page, limit);

    // Cache the response (only for active status)
    if (statusFilter === STATUS.ACTIVE) {
      queryCache.set(cacheKey, { data: response, timestamp: now });
      
      // Clean up old cache entries
      if (queryCache.size > 100) {
        for (const [key, value] of queryCache.entries()) {
          if (now - value.timestamp > CACHE_TTL) {
            queryCache.delete(key);
          }
        }
      }
    }

    return NextResponse.json(response);
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

