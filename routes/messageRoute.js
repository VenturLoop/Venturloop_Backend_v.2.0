import express from "express";
import {
  deleteMessage,
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



export default router;
