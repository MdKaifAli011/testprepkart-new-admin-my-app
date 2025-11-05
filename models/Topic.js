import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
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
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
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

// Add compound index to ensure unique orderNumber per chapter within an exam
topicSchema.index({ chapterId: 1, orderNumber: 1 }, { unique: true });

// Cascading delete: When a Topic is deleted, delete all related SubTopics
topicSchema.pre("findOneAndDelete", async function () {
  try {
    const topic = await this.model.findOne(this.getQuery());
    if (topic) {
      console.log(
        `🗑️ Cascading delete: Deleting all entities for topic ${topic._id}`
      );

      // Get model - use mongoose.model() to ensure model is loaded
      const SubTopic = mongoose.models.SubTopic || mongoose.model("SubTopic");

      const result = await SubTopic.deleteMany({ topicId: topic._id });
      console.log(
        `🗑️ Cascading delete: Deleted ${result.deletedCount} SubTopics for topic ${topic._id}`
      );
    }
  } catch (error) {
    console.error("❌ Error in Topic cascading delete middleware:", error);
    // Don't throw - allow the delete to continue even if cascading fails
  }
});

const Topic = mongoose.models.Topic || mongoose.model("Topic", topicSchema);

export default Topic;

