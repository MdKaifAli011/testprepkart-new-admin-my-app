import mongoose from "mongoose";
import Exam from "./Exam";

const practiceCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    // Optional: Order number for category within an exam
    orderNumber: {
      type: Number,
      min: 1,
    },
    // Optional: Description for the category
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Reference to Subject
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
    // Number of tests in this category
    noOfTests: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Test mode (e.g., "Online Test", "Offline Test")
    mode: {
      type: String,
      trim: true,
      default: "Online Test",
    },
    // Duration per test (e.g., "60 Min / Test")
    duration: {
      type: String,
      trim: true,
      default: "",
    },
    // Language (e.g., "English", "Hindi")
    language: {
      type: String,
      trim: true,
      default: "English",
    },
  },
  { timestamps: true }
);

// Ensure unique category name per exam
practiceCategorySchema.index({ examId: 1, name: 1 }, { unique: true });

// Index for better query performance
practiceCategorySchema.index({ examId: 1, status: 1 });
practiceCategorySchema.index({ subjectId: 1, status: 1 });
practiceCategorySchema.index({ status: 1 });
practiceCategorySchema.index({ createdAt: -1 });

// Ensure unique ordering per exam only when orderNumber is set
practiceCategorySchema.index(
  { examId: 1, orderNumber: 1 },
  { unique: true, partialFilterExpression: { orderNumber: { $exists: true } } }
);

// Cascading delete: When a PracticeCategory is deleted, delete all related PracticeSubCategories
practiceCategorySchema.pre("findOneAndDelete", async function () {
  try {
    const category = await this.model.findOne(this.getQuery());
    if (category) {
      console.log(
        `🗑️ Cascading delete: Deleting practice category ${category._id}`
      );
      // Delete all related subcategories
      const PracticeSubCategory =
        mongoose.models.PracticeSubCategory ||
        mongoose.model("PracticeSubCategory");
      const result = await PracticeSubCategory.deleteMany({
        categoryId: category._id,
      });
      console.log(
        `🗑️ Cascading delete: Deleted ${result.deletedCount} PracticeSubCategories for category ${category._id}`
      );
    }
  } catch (error) {
    console.error(
      "❌ Error in PracticeCategory cascading delete middleware:",
      error
    );
    // Don't throw - allow the delete to continue even if cascading fails
  }
});

// Ensure the latest schema is used during dev hot-reload
// If a previous version of the model exists (with an outdated schema), delete it first
if (mongoose.connection?.models?.PracticeCategory) {
  delete mongoose.connection.models.PracticeCategory;
}

const PracticeCategory = mongoose.model(
  "PracticeCategory",
  practiceCategorySchema
);

export default PracticeCategory;
