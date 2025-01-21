import mongoose from "mongoose";

// Define the schema for a message
const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Refers to the User model
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Refers to the User model
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent", // Message statuses: sent, delivered, or read
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isDelivered: {
      type: Boolean,
      default: false, // Indicates if the message is delivered
    },
    isSeen: {
      type: Boolean,
      default: false, // Indicates if the message has been seen
    },
    deliveredAt: {
      type: Date,
      default: null, // Timestamp of delivery
    },
    seenAt: {
      type: Date,
      default: null, // Timestamp of when the message was seen
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Create and export the Message model based on the schema
const Message = mongoose.model("Message", messageSchema);
export default Message;
