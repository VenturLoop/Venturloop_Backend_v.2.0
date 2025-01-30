import express from "express";
import {
  deleteMessage,
  getConnectedUsersWithMessagesinMessageTab,
  getStatus,
  getUnseenMessages,
  history,
  markMessagesAsSeenBetweenUsers,
} from "../controllers/message.js";

const router = express.Router();

router.get("/history", history);

router.get("/status", getStatus);

router.delete("/delete", deleteMessage);

router.get("/messages/unseen/:userId", getUnseenMessages);

router.put("/messages/seen", markMessagesAsSeenBetweenUsers);

router.get(
  "/connected-users-messages/:userId",
  getConnectedUsersWithMessagesinMessageTab
); //new

export default router;
