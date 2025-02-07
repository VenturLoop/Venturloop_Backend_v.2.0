import ConnectedUsers from "../models/connectedUsers.js";
import Connection from "../models/connection.js";
import Message from "../models/message.js";
import MessageRequest from "../models/messageRequest.js";
import Notification from "../models/notification.js";
import UserModel from "../models/user.js";
import UserProfileModel from "../models/userProfile.js";

// Send a new message request
export const sendMessageRequest = async (req, res) => {
  const { userId, ownerId, message } = req.body;

  try {
    // Step 1: Check if a connection exists between userId and ownerId
    const existingConnection = await Connection.findOne({
      $or: [
        { sender: userId, receiver: ownerId },
        { sender: ownerId, receiver: userId },
      ],
      status: "accepted", // Assuming "accepted" means an active connection
    });

    if (existingConnection) {
      // Step 2: If connection exists, don't send message request
      return res.status(400).json({
        success: false,
        message: "You are already in connection with this user.",
      });
    }

    // Step 3: If no connection exists, proceed to send the message request
    const messageRequest = new MessageRequest({ userId, ownerId, message });
    await messageRequest.save();

    res.status(201).json({
      success: true,
      message: "Message request sent successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all message requests for a specific owner
export const getMessageRequests = async (req, res) => {
  const { ownerId } = req.params;

  try {
    const requests = await MessageRequest.find({ ownerId }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptMessageRequest = async (req, res) => {
  const { userId, ownerId } = req.params;

  try {
    if (!userId || !ownerId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Owner ID are required.",
      });
    }

    // ✅ Find and delete the pending message request
    const request = await MessageRequest.findOneAndDelete({
      userId,
      ownerId,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Message request not found or already processed.",
      });
    }

    // ✅ Delete the notification of type "message_request"
    await Notification.deleteOne({
      userId,
      ownerId,
      type: "message_request",
    });

    // ✅ Find sender and receiver
    const [user, owner] = await Promise.all([
      UserModel.findById(userId),
      UserModel.findById(ownerId),
    ]);

    if (!user || !owner) {
      return res.status(404).json({
        success: false,
        message: "User or owner not found.",
      });
    }

    // ✅ Ensure `ConnectedUsers` exists for both users
    let [userConnections, ownerConnections] = await Promise.all([
      ConnectedUsers.findOne({ userId }),
      ConnectedUsers.findOne({ userId: ownerId }),
    ]);

    if (!userConnections) {
      userConnections = new ConnectedUsers({ userId, connections: [] });
    }
    if (!ownerConnections) {
      ownerConnections = new ConnectedUsers({
        userId: ownerId,
        connections: [],
      });
    }

    // ✅ Check if users are already connected
    const isAlreadyConnected = userConnections.connections.some(
      (conn) => conn.user.toString() === ownerId
    );

    if (!isAlreadyConnected) {
      // ✅ Add each user to the other's connection list
      userConnections.connections.push({
        user: ownerId,
        connectedAt: new Date(),
      });
      ownerConnections.connections.push({
        user: userId,
        connectedAt: new Date(),
      });

      await Promise.all([userConnections.save(), ownerConnections.save()]);
    }

    await Message.create({
      senderId: ownerId,
      recipientId: userId,
      content: request.message,
      status: "sent",
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Message request accepted, users connected, and message sent.",
    });
  } catch (error) {
    console.error("Error in acceptMessageRequest:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

// Decline a message request
export const declineMessageRequest = async (req, res) => {
  const { userId, ownerId } = req.params;

  try {
    if (!userId || !ownerId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Owner ID are required.",
      });
    }

    // ✅ Delete the message request and notification in parallel
    const [deletedRequest, deletedNotification] = await Promise.all([
      MessageRequest.findOneAndDelete({
        userId,
        ownerId,
        status: "pending",
      }),
      Notification.findOneAndDelete({
        userId,
        ownerId,
        type: "message_request",
      }),
    ]);

    // ✅ Check if any of them were missing
    if (!deletedRequest && !deletedNotification) {
      return res.status(404).json({
        success: false,
        message: "No pending message request or notification found.",
      });
    }

    // ✅ Log for debugging
    console.log(
      `[Decline] Message request deleted: ${
        deletedRequest?._id || "None"
      } | Notification deleted: ${deletedNotification?._id || "None"}`
    );

    res.status(200).json({
      success: true,
      message: "Message request declined and notification removed.",
    });
  } catch (error) {
    console.error("Error in declineMessageRequest:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while declining the message request.",
    });
  }
};

// Delete a message request (manually, if needed)
export const deleteMessageRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    const deletedRequest = await MessageRequest.findByIdAndDelete(requestId);

    if (!deletedRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    res.status(200).json({ success: true, message: "Message request deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserMessages = async (req, res) => {
  try {
    const userId = req.params.userId; // Get userId from route parameters

    // Step 1: Find all connections for the user with status "accepted"
    const connections = await Connection.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: "accepted",
    });

    if (!connections || connections.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No connections found for the user.",
      });
    }

    // Step 2: Prepare a list of connected user IDs
    const connectedUserIds = connections.map((connection) =>
      connection.sender.toString() === userId
        ? connection.receiver
        : connection.sender
    );

    // Step 3: Fetch user and profile details for connected users
    const users = await UserModel.find({
      _id: { $in: connectedUserIds },
    }).select("name profile");

    const profiles = await UserProfileModel.find({
      _id: { $in: users.map((user) => user.profile) },
    }).select("profilePhoto");

    // Step 4: Fetch the latest message for each connected user
    const result = [];
    for (const connectedUserId of connectedUserIds) {
      const latestMessage = await Message.findOne({
        $or: [
          { senderId: userId, recipientId: connectedUserId },
          { senderId: connectedUserId, recipientId: userId },
        ],
      })
        .sort({ createdAt: -1 }) // Sort by latest message
        .limit(1);

      // If no message exists, skip the user
      if (!latestMessage) {
        continue; // Skip this user if there's no message
      }

      const connectedUser = users.find(
        (user) => user._id.toString() === connectedUserId.toString()
      );

      const connectedProfile = profiles.find(
        (profile) => profile._id.toString() === connectedUser.profile.toString()
      );

      if (connectedUser) {
        result.push({
          userId,
          connectedUserId,
          connectedUserName: connectedUser.name,
          connectedUserImage: connectedProfile?.profilePhoto || null,
          latestMessage: latestMessage || null,
        });
      }
    }

    // Return the result
    return res.status(200).json({
      success: true,
      message: "Messages fetched successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error getting user messages:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
      error: error.message,
    });
  }
};
