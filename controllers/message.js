import mongoose from "mongoose";
import Message from "../models/message.js";
import UserModel from "../models/user.js";
import Connection from "../models/connection.js";
import ConnectedUsers from "../models/connectedUsers.js";

// Fetch message history
export const history = async (req, res) => {
  const { user1, user2 } = req.query;

  if (
    !user1 ||
    !user2 ||
    !mongoose.isValidObjectId(user1) ||
    !mongoose.isValidObjectId(user2)
  ) {
    return res.status(400).json({ error: "Invalid user IDs" });
  }

  try {
    const messages = await Message.find({
      $or: [
        { senderId: user1, recipientId: user2 },
        { senderId: user2, recipientId: user1 },
      ],
    }).sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Server error while fetching messages" });
  }
};

// Get user status
export const getStatus = async (req, res) => {
  const { userId } = req.query;

  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      status: user.status,
      lastSeen: user.lastSeen,
    });
  } catch (err) {
    console.error("Error fetching user status: ", err);
    res
      .status(500)
      .json({ error: "Failed to get user status", details: err.message });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  const { messageId, userId } = req.body;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if the user is the sender
    if (message.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You can only delete your own messages" });
    }

    // Remove the message
    await message.deleteOne(); // Using deleteOne to explicitly delete

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Error deleting message: ", err);
    res
      .status(500)
      .json({ error: "Failed to delete message", details: err.message });
  }
};

// unseen Message and connection number
export const getUnseenConnectionsAndMessages = async (req, res) => {
  try {
    const userId = req.params.userId; // Get userId from route parameters

    // Step 1: Find the user by userId
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Step 2: Find unseen connections (connections with status "accepted" and isSeen = false)
    const unseenConnections = await Connection.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: "accepted",
      isSeen: false,
    });

    // Step 3: Find the latest unseen message for each connection
    const unseenMessages = [];
    for (const connection of unseenConnections) {
      const connectedUserId =
        connection.sender.toString() === userId
          ? connection.receiver
          : connection.sender;

      // Fetch the latest unseen message between the user and the connected user
      const latestUnseenMessage = await Message.findOne({
        $or: [
          { senderId: userId, recipientId: connectedUserId, isSeen: false },
          { senderId: connectedUserId, recipientId: userId, isSeen: false },
        ],
      }).sort({ createdAt: -1 }); // Sort to get the most recent message

      if (latestUnseenMessage) {
        unseenMessages.push(latestUnseenMessage);
      }
    }

    // Step 4: Calculate the total unseen count
    const unseenConnectionMessage =
      unseenConnections.length + unseenMessages.length;

    // Step 5: Return the result with the sum of unseen connections and messages
    return res.status(200).json({
      success: true,
      message: "Unseen connections and messages fetched successfully.",
      unseenConnectionMessage: unseenConnectionMessage, // Return the sum as unseenConnectionMessage
    });
  } catch (error) {
    console.error("Error getting unseen connections and messages:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
      error: error.message,
    });
  }
};

export const getUnseenMessages = async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from route parameters

    // Step 1: Find unseen messages where the recipient is the given userId
    const unseenMessages = await Message.find({
      recipientId: userId,
      isSeen: false,
    }).select("_id content senderId createdAt");

    // Step 2: Group messages by senderId
    const groupedMessages = unseenMessages.reduce((acc, message) => {
      if (!acc[message.senderId]) {
        acc[message.senderId] = {
          senderId: message.senderId,
          messageCount: 0,
          messages: [],
        };
      }
      acc[message.senderId].messageCount += 1;
      acc[message.senderId].messages.push({
        id: message._id,
        content: message.content,
        createdAt: message.createdAt,
      });
      return acc;
    }, {});

    // Step 3: Prepare the response data for each sender
    const responseData = Object.values(groupedMessages).map((group) => ({
      senderId: group.senderId,
      messageCount: group.messageCount,
      messages: group.messages,
    }));

    // Return the response
    return res.status(200).json({
      success: true,
      message: "Unseen messages retrieved successfully.",
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching unseen messages:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
      error: error.message,
    });
  }
};

export const markMessagesAsSeenBetweenUsers = async (req, res) => {
  try {
    const { senderId, recipientId } = req.body; // Extract senderId and recipientId from the request body

    // Validate input
    if (!senderId || !recipientId) {
      return res.status(400).json({
        success: false,
        message: "Both senderId and recipientId are required.",
      });
    }

    // Step 1: Find and update all unseen messages from sender to recipient
    const updatedMessages = await Message.updateMany(
      { senderId, recipientId, isSeen: false }, // Unseen messages from sender to recipient
      { $set: { isSeen: true } } // Mark them as seen
    );

    // Step 2: Check if any messages were updated
    if (updatedMessages.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No unseen messages found between the specified users.",
      });
    }

    // Return a success response with the count of updated messages
    return res.status(200).json({
      success: true,
      message: `${updatedMessages.modifiedCount} messages marked as seen successfully.`,
      data: {
        updatedMessageCount: updatedMessages.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Error marking messages as seen:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
      error: error.message,
    });
  }
};

export const getConnectedUsersWithMessagesinMessageTab = async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    // ✅ Find the user's connected users
    const connectedUsers = await ConnectedUsers.findOne({ userId }).populate({
      path: "connections.user",
      select: "_id name profile",
      populate: {
        path: "profile",
        select: "profilePhoto",
      },
    });

    if (!connectedUsers || !connectedUsers.connections.length) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No connected users found",
      });
    }

    const userIds = connectedUsers.connections
      .map((conn) => conn.user?._id)
      .filter(Boolean);

    if (userIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No connected users found",
      });
    }

    // ✅ Fetch only users who have messages exchanged
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            {
              senderId: new mongoose.Types.ObjectId(userId),
              recipientId: {
                $in: userIds.map((id) => new mongoose.Types.ObjectId(id)),
              },
            },
            {
              senderId: {
                $in: userIds.map((id) => new mongoose.Types.ObjectId(id)),
              },
              recipientId: new mongoose.Types.ObjectId(userId),
            },
          ],
        },
      },
      { $sort: { timestamp: -1 } }, // ✅ Sort messages to get the latest first
      {
        $group: {
          _id: {
            user1: {
              $cond: [
                { $lt: ["$senderId", "$recipientId"] },
                "$senderId",
                "$recipientId",
              ],
            },
            user2: {
              $cond: [
                { $lt: ["$senderId", "$recipientId"] },
                "$recipientId",
                "$senderId",
              ],
            },
          },
          latestMessage: { $first: "$$ROOT" }, // ✅ Ensures we pick the latest message
        },
      },
    ]);

    // ✅ Filter only users who have messages
    const usersWithMessages = messages
      .map((msg) => {
        const otherUserId =
          msg._id.user1.toString() === userId ? msg._id.user2 : msg._id.user1;
        const connection = connectedUsers.connections.find(
          (conn) =>
            conn.user && conn.user._id.toString() === otherUserId.toString()
        );

        if (!connection || !connection.user) return null;

        return {
          user: {
            _id: connection.user._id,
            name: connection.user.name,
            profilePhoto: connection.user.profile?.profilePhoto || "",
          },
          latestMessage: msg.latestMessage,
          latestMessageTime: msg.latestMessage.timestamp,
        };
      })
      .filter(Boolean) // Remove null values
      .sort(
        (a, b) => new Date(b.latestMessageTime) - new Date(a.latestMessageTime)
      ); // ✅ Sort by latest message timestamp

    res.status(200).json({ success: true, data: usersWithMessages });
  } catch (error) {
    console.error("Error fetching connected users and messages:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
