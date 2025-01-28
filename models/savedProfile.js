import mongoose from "mongoose";

const SavedProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Ensures only one saved profile per user
    },
    savedUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true, // Ensures no duplicates
      },
    ],
    savedInvestorIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Investor",
        unique: true, // Ensures no duplicates
      },
    ],
    savedPostIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        unique: true, // Ensures no duplicates
      },
    ],
    savedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      // Automatically update this field when the document is updated
    },
  },
  {
    timestamps: { createdAt: "savedAt", updatedAt: "updatedAt" }, // Automatically manage the updatedAt field
  }
);


export default mongoose.model("SavedProfile", SavedProfileSchema);
