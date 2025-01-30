import mongoose from "mongoose";

const ConnectedUsersSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    connections: [ 
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Connected user ID
        connectedAt: { type: Date, default: Date.now }, // Timestamp of connection
      },
    ],
  },
  { timestamps: true }
);

const ConnectedUsers = mongoose.model("ConnectedUsers", ConnectedUsersSchema);
export default ConnectedUsers;
