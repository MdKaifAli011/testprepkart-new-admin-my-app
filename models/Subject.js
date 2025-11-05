import mongoose from "mongoose";
import Exam from "./Exam";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Order number for subject within an exam (independent per exam)
    orderNumber: {
      type: Number,
      min: 1,
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
    content: {
      type: String,
      default: "",
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

// Ensure unique ordering per exam only when orderNumber is set
// This keeps order numbers independent per exam and avoids conflicts for docs without orderNumber
subjectSchema.index(
  { examId: 1, orderNumber: 1 },
  { unique: true, partialFilterExpression: { orderNumber: { $exists: true } } }
);

// Cascading delete: When a Subject is deleted, delete all related Units, Chapters, Topics, and SubTopics
subjectSchema.pre("findOneAndDelete", async function () {
  try {
    const subject = await this.model.findOne(this.getQuery());
    if (subject) {
      console.log(
        `🗑️ Cascading delete: Deleting all entities for subject ${subject._id}`
      );

      // Get models - use mongoose.model() to ensure models are loaded
      const Unit = mongoose.models.Unit || mongoose.model("Unit");
      const Chapter = mongoose.models.Chapter || mongoose.model("Chapter");
      const Topic = mongoose.models.Topic || mongoose.model("Topic");
      const SubTopic = mongoose.models.SubTopic || mongoose.model("SubTopic");

      // Find all units in this subject
      const units = await Unit.find({ subjectId: subject._id });
      const unitIds = units.map((unit) => unit._id);
      console.log(`🗑️ Found ${units.length} units for subject ${subject._id}`);

      // Find all chapters in these units
      const chapters = await Chapter.find({ unitId: { $in: unitIds } });
      const chapterIds = chapters.map((chapter) => chapter._id);
      console.log(
        `🗑️ Found ${chapters.length} chapters for subject ${subject._id}`
      );

      // Find all topics in these chapters
      const topics = await Topic.find({ chapterId: { $in: chapterIds } });
      const topicIds = topics.map((topic) => topic._id);
      console.log(
        `🗑️ Found ${topics.length} topics for subject ${subject._id}`
      );

      // Delete all subtopics in these topics
      let subTopicsResult = { deletedCount: 0 };
      if (topicIds.length > 0) {
        subTopicsResult = await SubTopic.deleteMany({
          topicId: { $in: topicIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${subTopicsResult.deletedCount} SubTopics for subject ${subject._id}`
      );

      // Delete all topics in these chapters
      let topicsResult = { deletedCount: 0 };
      if (chapterIds.length > 0) {
        topicsResult = await Topic.deleteMany({
          chapterId: { $in: chapterIds },
        });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${topicsResult.deletedCount} Topics for subject ${subject._id}`
      );

      // Delete all chapters in these units
      let chaptersResult = { deletedCount: 0 };
      if (unitIds.length > 0) {
        chaptersResult = await Chapter.deleteMany({ unitId: { $in: unitIds } });
      }
      console.log(
        `🗑️ Cascading delete: Deleted ${chaptersResult.deletedCount} Chapters for subject ${subject._id}`
      );

      // Delete all units in this subject
      const unitsResult = await Unit.deleteMany({ subjectId: subject._id });
      console.log(
        `🗑️ Cascading delete: Deleted ${unitsResult.deletedCount} Units for subject ${subject._id}`
      );
    }
  } catch (error) {
    console.error("❌ Error in Subject cascading delete middleware:", error);
    // Don't throw - allow the delete to continue even if cascading fails
  }
});

// Ensure the latest schema is used during dev hot-reload
// If a previous version of the model exists (with an outdated schema), delete it first
if (mongoose.connection?.models?.Subject) {
  delete mongoose.connection.models.Subject;
}

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;

