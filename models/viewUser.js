import mongoose from "mongoose";

// Viewer schema to store userId and an array of viewerUserIds
const ViewerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    viewers: [
      {
        viewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        viewedAt: { type: Date, default: Date.now }, // Optional: timestamp for when the view occurred
      },
    ],
  },
  { timestamps: true }
);

// Add a TTL index on the "viewers.viewedAt" field
ViewerSchema.index({ "viewers.viewedAt": 1 }, { expireAfterSeconds: 2592000 }); // 30 days in seconds

const ViewerModel = mongoose.model("Viewer", ViewerSchema);

export default ViewerModel;
