import mongoose from "mongoose";

// User schema with additional fields for status, premium, and premium dates
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    verificationCode: { type: String }, // OTP
    isVerified: { type: Boolean, default: false }, // Email verified or not

    isDeleted: { type: Boolean, default: false }, // Account deletion status

    pushToken: { type: String, required: false }, //notification Token for push notification

    name: { type: String }, // Added later during signup completion
    password: { type: String },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile" },
    workingWith: [
      {
        postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // Store post ID
        joinedAt: { type: Date, default: Date.now }, // Timestamp when added
      },
    ],
    posts: [
      {
        postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // Store post ID
        createdAt: { type: Date, default: Date.now }, // Timestamp when post was added
      },
    ],
    totalConnections: { type: Number, default: 0 }, // Store number of connections
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;
