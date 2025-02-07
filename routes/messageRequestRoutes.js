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
router.put("/message-request/accept/:userId/:ownerId", acceptMessageRequest);

router.delete(
  "/message-request/decline/:userId/:ownerId",
  declineMessageRequest
);

router.delete("/message-requests/:requestId", deleteMessageRequest);

router.get("/message-user/:userId/messages", getUserMessages);

export default router;
