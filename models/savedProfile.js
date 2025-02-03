import mongoose from "mongoose";

const SavedProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    savedUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    savedInvestorIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Investor",
      },
    ],
    savedPostIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    savedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "savedAt", updatedAt: "updatedAt" },
  }
);

export default mongoose.model("SavedProfile", SavedProfileSchema);
