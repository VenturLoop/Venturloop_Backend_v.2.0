import express from "express";
import {
  sendConnectionRequest,
  cancelConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  removeConnection,
  getReceivedInvitations,
  getSentInvitations,
  getConnectedUsers,
  checkConnectionStatus,
} from "../controllers/connections.js";

const router = express.Router();

router.post("/send-request/:senderId", sendConnectionRequest);

router.post("/cancel-request/:senderId", cancelConnectionRequest);

router.post("/accept-request/:senderId", acceptConnectionRequest);

router.post("/decline-request/:senderId", declineConnectionRequest);
 
router.delete("/remove-connection/:userId", removeConnection);

router.get("/invitations/received/:userId", getReceivedInvitations);

// Route to fetch sent invitations
router.get("/invitations/sent/:userId", getSentInvitations);

// Route to fetch connected users
router.get("/connections/:userId", getConnectedUsers);

router.get("/connection-status/:senderId/:receiverId", checkConnectionStatus);

// router.get("/connections/unseen/:userId", getUnseenConnections);

// router.put("/connections/mark-as-seen/:userId", markConnectionsAsSeen);


export default router;
