import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reported: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  reportedAt: {
    type: Date,
    default: Date.now,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
});

const ReportModel = mongoose.model("Report", ReportSchema);
export default ReportModel;
