// models/SavedProfile.js
import mongoose from "mongoose";

const SavedProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  savedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Array of saved user IDs
  savedInvestorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Investor" }], // Array of saved investor IDs
  savedAt: { type: Date, default: Date.now },
});

export default mongoose.model("SavedProfile", SavedProfileSchema);
