import mongoose from "mongoose";
import Subject from "./Subject";
import Exam from "./Exam";

const unitSchema = new mongoose.Schema(
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
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
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
  },
  { timestamps: true }
);

// Add compound index to ensure unique orderNumber per subject within an exam
unitSchema.index({ subjectId: 1, orderNumber: 1 }, { unique: true });

// Cascading delete: When a Unit is deleted, delete all related Chapters, Topics, and SubTopics
unitSchema.pre("findOneAndDelete", async function () {
  try {
    const unit = await this.model.findOne(this.getQuery());
    if (unit) {
      console.log(
        `🗑️ Cascading delete: Deleting all entities for unit ${unit._id}`
      );

      // Get models - use mongoose.model() to ensure models are loaded
      const Chapter = mongoose.models.Chapter || mongoose.model("Chapter");
      const Topic = mongoose.models.Topic || mongoose.model("Topic");
      const SubTopic = mongoose.models.SubTopic || mongoose.model("SubTopic");
      const UnitDetails = mongoose.models.UnitDetails || mongoose.model("UnitDetails");

      // Delete unit details first
      const unitDetailsResult = await UnitDetails.deleteMany({ unitId: unit._id });
      console.log(
        `🗑️ Cascading delete: Deleted ${unitDetailsResult.deletedCount} UnitDetails for unit ${unit._id}`
      );

      // Find all chapters in this unit
      const chapters = await Chapter.find({ unitId: unit._id });
      const chapterIds = chapters.map((chapter) => chapter._id);
      console.log(`🗑️ Found ${chapters.length} chapters for unit ${unit._id}`);

      // Find all topics in these chapters
      const topics = await Topic.find({ chapterId: { $in: chapterIds } });
      const topicIds = topics.map((topic) => topic._id);
      console.log(`🗑️ Found ${topics.length} topics for unit ${unit._id}`);

      // Delete all subtopics in these topics
      let subTopicsResult = { deletedCount: 0 };
      if (topicIds.length > 0) {
        subTopicsResult = await SubTopic.deleteMany({
          topicId: { $in: topicIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${subTopicsResult.deletedCount} SubTopics for unit ${unit._id}`
      );

      // Delete all topics in these chapters
      let topicsResult = { deletedCount: 0 };
      if (chapterIds.length > 0) {
        topicsResult = await Topic.deleteMany({
          chapterId: { $in: chapterIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${topicsResult.deletedCount} Topics for unit ${unit._id}`
      );

      // Delete all chapters in this unit
      const chaptersResult = await Chapter.deleteMany({ unitId: unit._id });
      console.log(
        `🗑️ Cascading delete: Deleted ${chaptersResult.deletedCount} Chapters for unit ${unit._id}`
      );
    }
  } catch (error) {
    console.error("❌ Error in Unit cascading delete middleware:", error);
    // Don't throw - allow the delete to continue even if cascading fails
  }
});

const Unit = mongoose.models.Unit || mongoose.model("Unit", unitSchema);

export default Unit;

