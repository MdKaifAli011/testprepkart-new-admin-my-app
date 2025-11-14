import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PracticeSubCategory from "@/models/PracticeSubCategory";
import PracticeCategory from "@/models/PracticeCategory";
import Topic from "@/models/Topic";
import SubTopic from "@/models/SubTopic";
import mongoose from "mongoose";
import { parsePagination, createPaginationResponse } from "@/utils/pagination";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/utils/apiResponse";
import { STATUS, ERROR_MESSAGES } from "@/constants";
import { requireAuth, requireAction } from "@/middleware/authMiddleware";

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

// ---------- GET ALL PRACTICE SUBCATEGORIES (optimized) ----------
export async function GET(request) {
  try {
    // Check authentication (all authenticated users can view)
    const authCheck = await requireAuth(request);
    if (authCheck.error) {
      return NextResponse.json(authCheck, { status: authCheck.status || 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);

    // Parse pagination
    const { page, limit, skip } = parsePagination(searchParams);

    // Get filters
    const categoryId = searchParams.get("categoryId");
    const statusFilterParam = searchParams.get("status") || STATUS.ACTIVE;
    const statusFilter = statusFilterParam.toLowerCase();

    // Build query
    const query = {};
    if (statusFilter !== "all") {
      query.status = { $regex: new RegExp(`^${statusFilter}$`, "i") };
    }
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.categoryId = categoryId;
    }

    // Create cache key
    const cacheKey = `practiceSubCategories-${JSON.stringify(query)}-${page}-${limit}`;
    const now = Date.now();

    // Check cache (only for active status)
    const cached = queryCache.get(cacheKey);
    if (
      cached &&
      statusFilter === STATUS.ACTIVE &&
      now - cached.timestamp < CACHE_TTL
    ) {
      return NextResponse.json(cached.data);
    }

    // Optimize query execution
    const shouldCount = page === 1 || limit < 100;
    const [total, subCategories] = await Promise.all([
      shouldCount
        ? PracticeSubCategory.countDocuments(query)
        : Promise.resolve(0),
      PracticeSubCategory.find(query)
        .populate("categoryId", "name status examId subjectId")
        .populate("unitId", "name status")
        .populate("chapterId", "name status")
        .populate("topicId", "name status")
        .populate("subTopicId", "name status")
        .sort({ orderNumber: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    const response = createPaginationResponse(subCategories, total, page, limit);

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

// ---------- CREATE PRACTICE SUBCATEGORY ----------
export async function POST(request) {
  try {
    // Check authentication and permissions (users need to be able to create)
    const authCheck = await requireAction(request, "POST");
    if (authCheck.error) {
      return NextResponse.json(authCheck, { status: authCheck.status || 401 });
    }

    await connectDB();
    const body = await request.json();
    const {
      name,
      categoryId,
      unitId,
      chapterId,
      topicId,
      subTopicId,
      duration,
      maximumMarks,
      numberOfQuestions,
      negativeMarks,
      orderNumber,
      status,
      description,
    } = body;

    // Validate required fields
    if (!name || !categoryId) {
      return errorResponse("Name and categoryId are required", 400);
    }

    // Validate categoryId format
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return errorResponse("Invalid categoryId format", 400);
    }

    // Check if category exists
    const categoryExists = await PracticeCategory.findById(categoryId);
    if (!categoryExists) {
      return errorResponse("Practice category not found", 404);
    }

    // Validate hierarchical references if provided
    if (unitId && !mongoose.Types.ObjectId.isValid(unitId)) {
      return errorResponse("Invalid unitId format", 400);
    }
    if (chapterId && !mongoose.Types.ObjectId.isValid(chapterId)) {
      return errorResponse("Invalid chapterId format", 400);
    }
    if (topicId && !mongoose.Types.ObjectId.isValid(topicId)) {
      return errorResponse("Invalid topicId format", 400);
    }
    if (subTopicId && !mongoose.Types.ObjectId.isValid(subTopicId)) {
      return errorResponse("Invalid subTopicId format", 400);
    }

    // Validate numeric fields
    if (maximumMarks !== undefined && (isNaN(maximumMarks) || maximumMarks < 0)) {
      return errorResponse("Maximum marks must be a non-negative number", 400);
    }
    if (
      numberOfQuestions !== undefined &&
      (isNaN(numberOfQuestions) || numberOfQuestions < 0)
    ) {
      return errorResponse(
        "Number of questions must be a non-negative number",
        400
      );
    }
    if (
      negativeMarks !== undefined &&
      (isNaN(negativeMarks) || negativeMarks < 0)
    ) {
      return errorResponse("Negative marks must be a non-negative number", 400);
    }

    // Capitalize first letter of each word in subcategory name
    const subCategoryName = name.trim().replace(/\b\w/g, (l) => l.toUpperCase());

    // Check for duplicate subcategory name within the same category
    const existingSubCategory = await PracticeSubCategory.findOne({
      name: subCategoryName,
      categoryId,
    });
    if (existingSubCategory) {
      return errorResponse(
        "SubCategory with this name already exists for this category",
        409
      );
    }

    // Determine orderNumber
    let finalOrderNumber = orderNumber;
    if (finalOrderNumber === undefined || finalOrderNumber === null) {
      const maxOrderDoc = await PracticeSubCategory.findOne({ categoryId })
        .sort({ orderNumber: -1 })
        .select("orderNumber")
        .lean();
      finalOrderNumber = maxOrderDoc ? (maxOrderDoc.orderNumber || 0) + 1 : 1;
    }

    // Create new subcategory
    const subCategory = await PracticeSubCategory.create({
      name: subCategoryName,
      categoryId,
      unitId: unitId || null,
      chapterId: chapterId || null,
      topicId: topicId || null,
      subTopicId: subTopicId || null,
      duration: duration?.trim() || "",
      maximumMarks: maximumMarks || 0,
      numberOfQuestions: numberOfQuestions || 0,
      negativeMarks: negativeMarks || 0,
      orderNumber: finalOrderNumber,
      status: status || STATUS.ACTIVE,
      description: description || "",
    });

    // Populate the category data before returning
    const populatedSubCategory = await PracticeSubCategory.findById(
      subCategory._id
    )
      .populate("categoryId", "name status examId subjectId")
      .populate("unitId", "name status")
      .populate("chapterId", "name status")
      .populate("topicId", "name status")
      .populate("subTopicId", "name status")
      .lean();

    // Clear cache
    queryCache.clear();

    return successResponse(
      populatedSubCategory,
      "Practice subcategory created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.SAVE_FAILED);
  }
}

