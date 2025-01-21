import mongoose from "mongoose";

const messageRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Automatically delete documents after 24 hours if declined
messageRequestSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 86400, partialFilterExpression: { status: "declined" } }
);

const MessageRequest = mongoose.model("MessageRequest", messageRequestSchema);

export default MessageRequest;
