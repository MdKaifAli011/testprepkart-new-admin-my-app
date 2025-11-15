import mongoose from "mongoose";

const chapterDetailsSchema = new mongoose.Schema(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
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

// Ensure one details record per chapter
chapterDetailsSchema.index({ chapterId: 1 }, { unique: true });

// Cascading delete: When a Chapter is deleted, delete its details
chapterDetailsSchema.pre("findOneAndDelete", async function () {
  // Details are automatically cleaned up via the Chapter model's cascading delete
});

const ChapterDetails =
  mongoose.models.ChapterDetails ||
  mongoose.model("ChapterDetails", chapterDetailsSchema);

export default ChapterDetails;

