import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    orderNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    weightage: {
      type: Number,
      default: 0,
      min: 0,
    },
    time: {
      type: Number,
      default: 0,
      min: 0,
    },
    questions: {
      type: Number,
      default: 0,
      min: 0,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    // content fields
    content: {
      type: String,
      default: "",
    },
    // seo title
    title: {
      type: String,
      trim: true,
      default: "",
    },
    // seo description
    metaDescription: {
      type: String,
      trim: true,
      default: "",
    },
    // seo keywords
    keywords: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Add compound index to ensure unique orderNumber per unit within an exam
chapterSchema.index({ unitId: 1, orderNumber: 1 }, { unique: true });

// Cascading delete: When a Chapter is deleted, delete all related Topics and SubTopics
chapterSchema.pre("findOneAndDelete", async function () {
  try {
    const chapter = await this.model.findOne(this.getQuery());
    if (chapter) {
      console.log(
        `🗑️ Cascading delete: Deleting all entities for chapter ${chapter._id}`
      );

      // Get models - use mongoose.model() to ensure models are loaded
      const Topic = mongoose.models.Topic || mongoose.model("Topic");
      const SubTopic = mongoose.models.SubTopic || mongoose.model("SubTopic");

      // Find all topics in this chapter
      const topics = await Topic.find({ chapterId: chapter._id });
      const topicIds = topics.map((topic) => topic._id);
      console.log(
        `🗑️ Found ${topics.length} topics for chapter ${chapter._id}`
      );

      // Delete all subtopics in these topics
      let subTopicsResult = { deletedCount: 0 };
      if (topicIds.length > 0) {
        subTopicsResult = await SubTopic.deleteMany({
          topicId: { $in: topicIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${subTopicsResult.deletedCount} SubTopics for chapter ${chapter._id}`
      );

      // Delete all topics in this chapter
      const topicsResult = await Topic.deleteMany({ chapterId: chapter._id });
      console.log(
        `🗑️ Cascading delete: Deleted ${topicsResult.deletedCount} Topics for chapter ${chapter._id}`
      );
    }
  } catch (error) {
    console.error("❌ Error in Chapter cascading delete middleware:", error);
    // Don't throw - allow the delete to continue even if cascading fails
  }
});

const Chapter =
  mongoose.models.Chapter || mongoose.model("Chapter", chapterSchema);

export default Chapter;

