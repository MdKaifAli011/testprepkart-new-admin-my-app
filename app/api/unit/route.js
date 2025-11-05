import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Unit from "@/models/Unit";
import mongoose from "mongoose";
import { parsePagination, createPaginationResponse } from "@/utils/pagination";
import { successResponse, errorResponse, handleApiError } from "@/utils/apiResponse";
import { STATUS, ERROR_MESSAGES } from "@/constants";

// Cache for frequently accessed queries (simple in-memory cache)
const queryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ---------- GET ALL UNITS ----------
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Parse pagination
    const { page, limit, skip } = parsePagination(searchParams);
    
    // Get filters (normalize status to lowercase for case-insensitive matching)
    const subjectId = searchParams.get("subjectId");
    const examId = searchParams.get("examId");
    const statusFilterParam = searchParams.get("status") || STATUS.ACTIVE;
    const statusFilter = statusFilterParam.toLowerCase();

    // Build query with case-insensitive status matching
    const query = {};
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
      query.subjectId = subjectId;
    }
    if (examId && mongoose.Types.ObjectId.isValid(examId)) {
      query.examId = examId;
    }
    if (statusFilter !== "all") {
      query.status = { $regex: new RegExp(`^${statusFilter}$`, "i") };
    }

    // Create cache key
    const cacheKey = `units-${JSON.stringify(query)}-${page}-${limit}`;
    const cached = queryCache.get(cacheKey);
    const now = Date.now();

    // Check cache (only for active status queries to avoid stale data)
    if (cached && statusFilter === STATUS.ACTIVE && (now - cached.timestamp < CACHE_TTL)) {
      return NextResponse.json(cached.data);
    }

    // Optimize query: only get count if we need pagination info
    const shouldCount = page === 1 || limit < 100;
    
    // Parallel execution for better performance
    const [total, units] = await Promise.all([
      shouldCount ? Unit.countDocuments(query) : Promise.resolve(0),
      Unit.find(query)
        .populate("subjectId", "name")
        .populate("examId", "name status")
        .sort({ orderNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec()
    ]);

    const response = createPaginationResponse(units, total, page, limit);

    // Cache the response (only for active status)
    if (statusFilter === STATUS.ACTIVE) {
      queryCache.set(cacheKey, {
        data: response,
        timestamp: now,
      });
      
      // Clean up old cache entries periodically
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

