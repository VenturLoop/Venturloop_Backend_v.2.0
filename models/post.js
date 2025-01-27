import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    // postType: Skillswipe
    title: { type: String, maxlength: 40 },

    // postType: All
    description: { type: String },

    // postType: project
    openRoles: [
      {
        role: { type: String },
        description: { type: String },
        compensation: {
          type: String,
          enum: ["Paid", "Equity", "Unpaid"],
          default: "Unpaid",
        },
      },
    ],

    // postType: project
    teamMates: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: { type: String },
        location: { type: String },
        profileImage: { type: String },
      },
    ],

    // postType: project
    websiteLink: {
      type: String,
      validate: {
        validator: function (value) {
          return value === "" || /^https?:\/\/[^\s$.?#].[^\s]*$/.test(value);
        },
        message: "Invalid website URL",
      },
      default: "",
    },

    // postType: Project
    category: { type: String },
    startupStage: { type: String },
    startupDetails: { type: String },
    problemStatement: { type: String },
    marketDescription: { type: String },
    competition: { type: String },

    userData: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }, // Post creator

    postType: {
      type: String,
      enum: ["project", "poles", "posts", "youtubeUrl", "skillSwap"],
    },

    // postType: polls
    polls: [
      {
        option: { type: String }, // Poll option text
        votes: {
          type: [mongoose.Schema.Types.ObjectId], // Array of user IDs who voted for this option
          ref: "User",
          default: [],
        },
        voteCount: { type: Number, default: 0 }, // Total vote count for this option
      },
    ],

    // postType: youtubeUrl
    videoUrl: { type: String }, // Video link for the post

    // All
    likes: {
      users: {
        type: [mongoose.Schema.Types.ObjectId], // Array of user IDs who liked the post
        ref: "User",
        default: [],
      },
      count: { type: Number, default: 0 }, // Total like count
    },

    // All
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // All
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who saved the post

    // postType: Project
    appliedUsers: [
      {
        applicant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
        },
        status: {
          type: String,
          enum: ["Pending", "Accepted", "Rejected"],
          default: "Pending",
        },
        whyJoin: {
          type: String,
          maxlength: 500, // Limiting the length of the answer
        },
        expertise: {
          type: String,
          maxlength: 500, // Limiting the length of the answer
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // postType: Skillswipe
    skillSwap: {
      offeredSkills: [{ type: String }],
      requiredSkills: [{ type: String }],
    },

    // postType: Skillswipe
    applyUsersOnSkillSwap: [
      {
        applicantUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        requiredFor: {
          type: String, // The skill or role that the applicant is applying for
        },
        status: {
          type: String,
          enum: ["Pending", "Accepted", "Rejected"],
          default: "Pending",
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
export default Post;
