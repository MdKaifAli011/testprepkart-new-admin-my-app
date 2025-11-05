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

// Add compound index to ensure unique orderNumber per topic within an exam
subTopicSchema.index({ topicId: 1, orderNumber: 1 }, { unique: true });

// Cascading delete: SubTopic is a leaf node with no children, so no cascading deletes needed
// This middleware is here for documentation and consistency
subTopicSchema.pre("findOneAndDelete", async function () {
  // No cascading delete needed - SubTopic has no child entities
});

const SubTopic =
  mongoose.models.SubTopic || mongoose.model("SubTopic", subTopicSchema);

export default SubTopic;

