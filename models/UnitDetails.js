import mongoose from "mongoose";

const unitDetailsSchema = new mongoose.Schema(
  {
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
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

// Ensure one details record per unit
unitDetailsSchema.index({ unitId: 1 }, { unique: true });

// Cascading delete: When a Unit is deleted, delete its details
unitDetailsSchema.pre("findOneAndDelete", async function () {
  // Details are automatically cleaned up via the Unit model's cascading delete
});

const UnitDetails =
  mongoose.models.UnitDetails || mongoose.model("UnitDetails", unitDetailsSchema);

export default UnitDetails;

