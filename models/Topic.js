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

      // Get models - use mongoose.model() to ensure models are loaded
      const SubTopic = mongoose.models.SubTopic || mongoose.model("SubTopic");
      const TopicDetails = mongoose.models.TopicDetails || mongoose.model("TopicDetails");

      // Delete topic details first
      const topicDetailsResult = await TopicDetails.deleteMany({ topicId: topic._id });
      console.log(
        `🗑️ Cascading delete: Deleted ${topicDetailsResult.deletedCount} TopicDetails for topic ${topic._id}`
      );

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

// Ensure the latest schema is used during dev hot-reload
// If a previous version of the model exists (with an outdated schema), delete it first
if (mongoose.connection?.models?.Topic) {
  delete mongoose.connection.models.Topic;
}

const Topic = mongoose.model("Topic", topicSchema);

export default Topic;
