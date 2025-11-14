import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Topic from "@/models/Topic";
import { requireAction } from "@/middleware/authMiddleware";
import { logger } from "@/utils/logger";

export async function POST(request) {
  return handleReorder(request);
}

export async function PATCH(request) {
  return handleReorder(request);
}

async function handleReorder(request) {
  try {
    // Check authentication and permissions (users need to be able to update)
    const authCheck = await requireAction(request, "PATCH");
    if (authCheck.error) {
      return NextResponse.json(authCheck, { status: authCheck.status || 401 });
    }

    await connectDB();
    const { topics } = await request.json();

    if (!topics || !Array.isArray(topics)) {
      return NextResponse.json(
        { success: false, message: "Invalid topics data" },
        { status: 400 }
      );
    }

    // Validate each topic object
    for (const topic of topics) {
      if (!topic.id || !topic.orderNumber) {
        return NextResponse.json(
          { success: false, message: "Each topic must have id and orderNumber" },
          { status: 400 }
        );
      }
      if (typeof topic.orderNumber !== 'number') {
        return NextResponse.json(
          { success: false, message: "orderNumber must be a number" },
          { status: 400 }
        );
      }
    }

    // Validate that all topics belong to the same chapter
    const topicDocs = await Topic.find({ _id: { $in: topics.map(t => t.id) } })
      .select('chapterId');
    
    if (topicDocs.length !== topics.length) {
      return NextResponse.json(
        { success: false, message: "Some topics not found" },
        { status: 404 }
      );
    }

    const firstTopic = topicDocs[0];
    const firstChapterId = firstTopic.chapterId?.toString() || firstTopic.chapterId;

    for (let i = 1; i < topicDocs.length; i++) {
      const topic = topicDocs[i];
      const chapterId = topic.chapterId?.toString() || topic.chapterId;
      
      if (chapterId !== firstChapterId) {
        return NextResponse.json(
          { success: false, message: "All topics must belong to the same chapter" },
          { status: 400 }
        );
      }
    }

    // Two-step update to prevent duplicate key errors
    // Step 1: Set all topics to temporary high order numbers
    const tempUpdates = topics.map((topic, index) => ({
      updateOne: {
        filter: { _id: topic.id },
        update: { orderNumber: 10000 + index },
      },
    }));

    await Topic.bulkWrite(tempUpdates);

    // Step 2: Set all topics to their final order numbers
    const finalUpdates = topics.map((topic) => ({
      updateOne: {
        filter: { _id: topic.id },
        update: { orderNumber: topic.orderNumber },
      },
    }));

    await Topic.bulkWrite(finalUpdates);

    return NextResponse.json({
      success: true,
      message: "Topics reordered successfully",
    });
  } catch (error) {
    logger.error("Error reordering topics:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reorder topics" },
      { status: 500 }
    );
  }
}

