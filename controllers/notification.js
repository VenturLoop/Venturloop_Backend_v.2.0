// services/notificationService.js

import moment from "moment";
import Notification from "../models/notification.js";

// Function to send notification
export const sendNotification = async (
  userId,
  ownerId,
  type,
  postId = null,
  message
) => {
  try {
    const newNotification = new Notification({
      userId,
      ownerId,
      type,
      postId,
      message,
    });

    await newNotification.save();
    return newNotification;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw new Error("Error sending notification.");
  }
};

// Function to get unread notifications count for a user
export const getUnreadNotificationCount = async (ownerId) => {
  try {
    const count = await Notification.countDocuments({ ownerId, isRead: false });
    return count;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    throw new Error("Error fetching unread notification count.");
  }
};

// Function to get notifications for a user
export const getNotificationsByUserId = async (ownerId) => {
  try {
    const notifications = await Notification.find({ ownerId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .populate("ownerId", "username") // Assuming 'username' is a field in the 'User' model
      .populate("postId", "content") // Assuming 'content' is a field in the 'Post' model
      .exec();
    return notifications;
  } catch (error) {
    console.error("Error getting notifications:", error);
    throw new Error("Error fetching notifications.");
  }
};

// Function to mark notifications as read
export const markNotificationsAsRead = async (ownerId) => {
  try {
    const result = await Notification.updateMany(
      { ownerId, isRead: false },
      { $set: { isRead: true } }
    );

    console.log(`Marked notifications as read for owner ${ownerId}.`);
    return result;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw new Error("Error marking notifications as read.");
  }
};

// Function to delete notifications older than 24 hours
export const deleteOldNotifications = async () => {
  try {
    const twentyFourHoursAgo = moment().subtract(24, "hours").toDate();
    await Notification.deleteMany({ createdAt: { $lt: twentyFourHoursAgo } });
    console.log("Old notifications deleted.");
  } catch (error) {
    console.error("Error deleting old notifications:", error);
    throw new Error("Error deleting old notifications.");
  }
};

// Function to delete notifications by ownerId
export const deleteNotificationsByOwnerId = async (ownerId) => {
  try {
    if (!ownerId) {
      throw new Error("Owner ID is required to delete notifications.");
    }

    const result = await Notification.deleteMany({ ownerId });

    console.log(
      `Deleted ${result.deletedCount} notifications for owner ${ownerId}.`
    );

    return result;
  } catch (error) {
    console.error("Error deleting notifications by ownerId:", error);
    throw new Error("Error deleting notifications.");
  }
};
