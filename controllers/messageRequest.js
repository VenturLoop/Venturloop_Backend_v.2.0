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
    // Validate input
    if (!userId || !ownerId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Owner ID are required.",
      });
    }

    // Find the pending message request
    const request = await MessageRequest.findOne({
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

    // Check if the user is already connected
    let connection = await ConnectedUsers.findOne({
      userId: userId,
      "connections.user": ownerId,
    });

    // If not connected, add to ConnectedUsers
    if (!connection) {
      connection = await ConnectedUsers.findOneAndUpdate(
        { userId: userId },
        { $push: { connections: { user: ownerId, connectedAt: new Date() } } },
        { new: true, upsert: true }
      );

      // Optionally, you can also add the user to the other user's connections.
      await ConnectedUsers.findOneAndUpdate(
        { userId: ownerId },
        { $push: { connections: { user: userId, connectedAt: new Date() } } },
        { new: true, upsert: true }
      );
    }

    // Create a connection with status "accepted"
    const newConnection = await Connection.create({
      sender: userId,
      receiver: ownerId,
      status: "accepted",
    });

    // Create a message based on the request message
    const message = await Message.create({
      senderId: ownerId,
      recipientId: userId,
      content: request.message,
      isDelivered: false, // Initial delivery status
    });

    // Delete the message request
    await MessageRequest.deleteOne({ _id: request._id });

    // Respond with success
    res.status(200).json({
      success: true,
      message:
        "Message request accepted, connection created, and message sent.",
      data: {
        connection: newConnection,
        message,
      },
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
    // Find and delete the pending message request
    const request = await MessageRequest.findOneAndDelete({
      userId,
      ownerId,
      status: "pending",
    });

    const requestNotification = await Notification.findOneAndDelete({
      userId,
      ownerId,
      type: "message_request",
    });

    if (!request || !requestNotification) {
      return res.status(404).json({
        success: false,
        message: "Pending message request not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message request declined and deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while declining the message request.",
      error: error.message,
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
