import mongoose from "mongoose";

const topicDetailsSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      // Unique constraint enforced via schema.index() below
    },
    content: {
      type: String,
      default: "",
    },
    // SEO title
    title: {
      type: String,
      trim: true,
      default: "",
    },
    // SEO description
    metaDescription: {
      type: String,
      trim: true,
      default: "",
    },
    // SEO keywords
    keywords: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Ensure one details record per topic
topicDetailsSchema.index({ topicId: 1 }, { unique: true });

// Cascading delete: When a Topic is deleted, delete its details
topicDetailsSchema.pre("findOneAndDelete", async function () {
  // Details are automatically cleaned up via the Topic model's cascading delete
});

const TopicDetails =
  mongoose.models.TopicDetails || mongoose.model("TopicDetails", topicDetailsSchema);

export default TopicDetails;

