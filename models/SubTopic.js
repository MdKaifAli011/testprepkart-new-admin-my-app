import mongoose from "mongoose";

const subTopicSchema = new mongoose.Schema(
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
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
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

// Add compound index to ensure unique orderNumber per topic within an exam
subTopicSchema.index({ topicId: 1, orderNumber: 1 }, { unique: true });

// Cascading delete: When a SubTopic is deleted, delete its details
subTopicSchema.pre("findOneAndDelete", async function () {
  try {
    const subTopic = await this.model.findOne(this.getQuery());
    if (subTopic) {
      console.log(
        `🗑️ Cascading delete: Deleting details for subtopic ${subTopic._id}`
      );

      // Get model - use mongoose.model() to ensure model is loaded
      const SubTopicDetails = mongoose.models.SubTopicDetails || mongoose.model("SubTopicDetails");

      const result = await SubTopicDetails.deleteMany({ subTopicId: subTopic._id });
      console.log(
        `🗑️ Cascading delete: Deleted ${result.deletedCount} SubTopicDetails for subtopic ${subTopic._id}`
      );
    }
  } catch (error) {
    console.error("❌ Error in SubTopic cascading delete middleware:", error);
    // Don't throw - allow the delete to continue even if cascading fails
  }
});

// Ensure the latest schema is used during dev hot-reload
// If a previous version of the model exists (with an outdated schema), delete it first
if (mongoose.connection?.models?.SubTopic) {
  delete mongoose.connection.models.SubTopic;
}

const SubTopic = mongoose.model("SubTopic", subTopicSchema);

export default SubTopic;
