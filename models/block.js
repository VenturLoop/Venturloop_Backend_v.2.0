import mongoose from "mongoose";

const BlockSchema = new mongoose.Schema({
  blocker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  blocked: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  blockedAt: {
    type: Date,
    default: Date.now,
  },
});

const BlockModel = mongoose.model("Block", BlockSchema);

export default BlockModel;
