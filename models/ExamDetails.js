import mongoose from "mongoose";

const examDetailsSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
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

// Ensure one details record per exam
examDetailsSchema.index({ examId: 1 }, { unique: true });

// Cascading delete: When an Exam is deleted, delete its details
examDetailsSchema.pre("findOneAndDelete", async function () {
  // Details are automatically cleaned up via the Exam model's cascading delete
  // but we can add cleanup here if needed
});

const ExamDetails =
  mongoose.models.ExamDetails ||
  mongoose.model("ExamDetails", examDetailsSchema);

export default ExamDetails;
