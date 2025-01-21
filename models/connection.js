import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled"],
      default: "pending",
    },
    isSeen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Connection = mongoose.model("Connection", connectionSchema);

export default Connection; // Use `export default` for ES modules
