import mongoose from "mongoose";

const subTopicDetailsSchema = new mongoose.Schema(
  {
    subTopicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubTopic",
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

// Ensure one details record per subtopic
subTopicDetailsSchema.index({ subTopicId: 1 }, { unique: true });

// Cascading delete: When a SubTopic is deleted, delete its details
subTopicDetailsSchema.pre("findOneAndDelete", async function () {
  // Details are automatically cleaned up via the SubTopic model's cascading delete
});

const SubTopicDetails =
  mongoose.models.SubTopicDetails ||
  mongoose.model("SubTopicDetails", subTopicDetailsSchema);

export default SubTopicDetails;

