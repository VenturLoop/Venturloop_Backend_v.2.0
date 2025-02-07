import express from "express";
import {
  sendMessageRequest,
  getMessageRequests,
  acceptMessageRequest,
  declineMessageRequest,
  deleteMessageRequest,
  getUserMessages,
} from "../controllers/messageRequest.js";

const router = express.Router();

router.post("/message-requests", sendMessageRequest);

router.get("/message-requests/:ownerId", getMessageRequests);

// Accept a message request and establish a connection
router.put("/message-request/accept/:userId/:ownerId", (req, res) => {
  const io = req.app.get("io"); // Get WebSocket instance
  const inMemoryUsers = req.app.get("inMemoryUsers"); // Get connected users map
  acceptMessageRequest(req, res, io, inMemoryUsers);
});

router.delete(
  "/message-request/decline/:userId/:ownerId",
  declineMessageRequest
);

router.delete("/message-requests/:requestId", deleteMessageRequest);

router.get("/message-user/:userId/messages", getUserMessages);

export default router;
