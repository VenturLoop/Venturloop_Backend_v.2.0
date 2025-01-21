// routes/notificationRoutes.js
import express from "express";
import {
  sendNotification,
  getUnreadNotificationCount,
  getNotificationsByUserId,
  deleteOldNotifications,
  deleteNotificationsByOwnerId,
  markNotificationsAsRead,
} from "../controllers/notification.js";
import { getUnseenConnectionsAndMessages } from "../controllers/message.js";

const router = express.Router();

// Route to send a notification
router.post("/send", async (req, res) => {
  const { userId, ownerId, type, postId, message } = req.body;

  try {
    const notification = await sendNotification(
      userId,
      ownerId,
      type,
      postId,
      message
    );
    res.status(200).json({
      success: true,
      notification: notification,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get unread notification count by userId
router.get("/:userId/unread-count", async (req, res) => {
  const { userId } = req.params;

  try {
    const count = await getUnreadNotificationCount(userId);
    res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get notifications by userId
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await getNotificationsByUserId(userId);
    res.status(200).json({ success: true, notification: notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to delete old notifications (older than 24 hours)
router.delete("/delete-old", async (req, res) => {
  try {
    await deleteOldNotifications();
    res.status(200).json({ message: "Old notifications deleted." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}); 

// mark As read
router.post("/mark-as-read/:ownerId", async (req, res) => {
  const { ownerId } = req.params;

  try {
    const result = await markNotificationsAsRead(ownerId);
    res.status(200).json({
      success: true,
      message: `Marked notifications as read for owner ${ownerId}.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/clear-notification/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    await deleteNotificationsByOwnerId(userId);
    res
      .status(200)
      .json({ success: true, message: "All notifications Cleared." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get(
  "/unseen-connections-message/:userId",
  getUnseenConnectionsAndMessages
);

export default router;
