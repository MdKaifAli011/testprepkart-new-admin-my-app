import mongoose from "mongoose";

const subjectDetailsSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
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

// Ensure one details record per subject
subjectDetailsSchema.index({ subjectId: 1 }, { unique: true });

// Cascading delete: When a Subject is deleted, delete its details
subjectDetailsSchema.pre("findOneAndDelete", async function () {
  // Details are automatically cleaned up via the Subject model's cascading delete
});

const SubjectDetails =
  mongoose.models.SubjectDetails ||
  mongoose.model("SubjectDetails", subjectDetailsSchema);

export default SubjectDetails;
