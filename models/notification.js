// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: [
      "like",
      "comment",
      "connection_request",
      "message_request",
      "role_request",
      "accept_connection",
      "accept_message",
      "accept_role",
      "decline_connection",
      "decline_message",
      "decline_role",
    ],
    required: true,
  },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  message: { type: String },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
