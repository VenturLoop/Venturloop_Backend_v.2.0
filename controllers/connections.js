import mongoose from "mongoose";
import ConnectedUsers from "../models/connectedUsers.js";
import Connection from "../models/connection.js";
import UserModel from "../models/user.js";
import Message from "../models/message.js";

export const sendConnectionRequest = async (req, res) => {
  const { senderId } = req.params; // Assuming senderId is set in the authenticate middleware
  const { receiverId } = req.body;

  try {
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a receiver's user ID.",
      });
    }

    // Ensure the sender isn't sending a request to themselves
    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: "You can't send a request to yourself.",
      });
    }

    // Check if users are already connected
    const senderConnectedData = await ConnectedUsers.findOne({
      userId: senderId,
    });
    if (
      senderConnectedData &&
      senderConnectedData.connections.some(
        (conn) => conn.user.toString() === receiverId
      )
    ) {
      return res.status(409).json({
        success: false,
        message: "You are already connected with this user.",
      });
    }

    // Check if a connection request already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existingConnection) {
      return res.status(409).json({
        success: false,
        message: "A connection request already exists.",
      });
    }

    // Create a new connection request if no existing request is found
    const newConnectionRequest = new Connection({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    await newConnectionRequest.save();

    return res.status(201).json({
      success: true,
      message: "Connection request sent successfully.",
    });
  } catch (error) {
    console.error("Error sending connection request:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while sending the connection request.",
    });
  }
};

export const cancelConnectionRequest = async (req, res) => {
  const { senderId } = req.params; // Assuming senderId is set in the authenticate middleware
  const { receiverId } = req.body;

  try {
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a receiver's user ID to cancel the request.",
      });
    }

    // Find the connection request
    const connectionRequest = await Connection.findOne({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    if (!connectionRequest) {
      return res.status(404).json({
        success: false,
        message: "No pending connection request found.",
      });
    }

    // Cancel the request
    await connectionRequest.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Connection request cancelled successfully.",
    });
  } catch (error) {
    console.error("Error cancelling connection request:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while cancelling the connection request.",
    });
  }
};

export const acceptConnectionRequest = async (req, res) => {
  const { senderId } = req.params; // Sender ID from URL params
  const { receiverId } = req.body; // Receiver ID from request body

  try {
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a receiver's user ID to accept the request.",
      });
    }

    // Find and delete the pending connection request
    const connectionRequest = await Connection.findOneAndDelete({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    if (!connectionRequest) {
      return res.status(404).json({
        success: false,
        message: "No pending connection request found.",
      });
    }

    // Update the UserModel's connections count for both sender and receiver
    const sender = await UserModel.findById(senderId);
    const receiver = await UserModel.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        message: "Sender or receiver not found.",
      });
    }

    // Increment the connections count for both users
    sender.totalConnections += 1;
    receiver.totalConnections += 1;

    // Save the updated user records
    await sender.save();
    await receiver.save();

    // Check if ConnectedUsers document exists for sender, create if not
    let senderConnections = await ConnectedUsers.findOne({ userId: senderId });
    if (!senderConnections) {
      senderConnections = new ConnectedUsers({
        userId: senderId,
        connections: [],
      });
    }

    // Add senderId to receiver's connections
    senderConnections.connections.push({
      user: receiverId,
      connectedAt: new Date(),
    });
    await senderConnections.save();

    // Check if ConnectedUsers document exists for receiver, create if not
    let receiverConnections = await ConnectedUsers.findOne({
      userId: receiverId,
    });
    if (!receiverConnections) {
      receiverConnections = new ConnectedUsers({
        userId: receiverId,
        connections: [],
      });
    }

    // Add receiverId to sender's connections
    receiverConnections.connections.push({
      user: senderId,
      connectedAt: new Date(),
    });
    await receiverConnections.save();

    return res.status(200).json({
      success: true,
      message: "Connection request accepted. Users are now connected.",
    });
  } catch (error) {
    console.error("Error accepting connection request:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while accepting the connection request.",
    });
  }
};

export const declineConnectionRequest = async (req, res) => {
  const { senderId } = req.params; // Assuming senderId is set in the authenticate middleware
  const { receiverId } = req.body;

  try {
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a receiver's user ID to decline the request.",
      });
    }

    // Find the pending connection request
    const connectionRequest = await Connection.findOne({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    if (!connectionRequest) {
      return res.status(404).json({
        success: false,
        message: "No pending connection request found.",
      });
    }

    // Decline and delete the connection request
    await connectionRequest.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Connection request declined and removed.",
    });
  } catch (error) {
    console.error("Error declining connection request:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while declining the connection request.",
    });
  }
};

export const removeConnection = async (req, res) => {
  const { userId } = req.params; // The user initiating the removal
  const { connectedUserId } = req.body; // The user being removed

  try {
    if (!connectedUserId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a connected user's ID to remove.",
      });
    }

    // ✅ Remove `connectedUserId` from `userId`'s connections
    const userConnections = await ConnectedUsers.findOneAndUpdate(
      { userId },
      { $pull: { connections: { user: connectedUserId } } },
      { new: true }
    );

    // ✅ Remove `userId` from `connectedUserId`'s connections
    const connectedUserConnections = await ConnectedUsers.findOneAndUpdate(
      { userId: connectedUserId },
      { $pull: { connections: { user: userId } } },
      { new: true }
    );

    // ✅ If no connections exist, return an error
    if (!userConnections || !connectedUserConnections) {
      return res.status(404).json({
        success: false,
        message: "Connection data not found for one or both users.",
      });
    }

    // ✅ Fetch both users
    const [user, connectedUser] = await Promise.all([
      UserModel.findById(userId),
      UserModel.findById(connectedUserId),
    ]);

    if (!user || !connectedUser) {
      return res.status(404).json({
        success: false,
        message: "One or both users not found.",
      });
    }

    // ✅ Decrement `totalConnections` but ensure it doesn't go below 0
    user.totalConnections = Math.max(0, (user.totalConnections || 0) - 1);
    connectedUser.totalConnections = Math.max(
      0,
      (connectedUser.totalConnections || 0) - 1
    );

    // ✅ Save updated user connection counts
    await Promise.all([user.save(), connectedUser.save()]);

    // ✅ Delete all messages between the two users
    await Message.deleteMany({
      $or: [
        { senderId: userId, recipientId: connectedUserId },
        { senderId: connectedUserId, recipientId: userId },
      ],
    });

    return res.status(200).json({
      success: true,
      message:
        "Connection removed, totalConnections updated, and messages deleted successfully.",
    });
  } catch (error) {
    console.error("Error removing connection:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while removing the connection.",
    });
  }
};

// Get list of received invitations
export const getReceivedInvitations = async (req, res) => {
  const { userId } = req.params; // Extract userId from request parameters

  try {
    // Fetch pending invitations for the given receiver
    const invitations = await Connection.find({
      receiver: userId,
      status: "pending",
    }).populate({
      path: "sender",
      select: "name status profile", // Select sender's name, status, and profile reference
      populate: {
        path: "profile", // Nested populate for profile details
        select: "profilePhoto status", // Fetch only profilePhoto and status
      },
    });

    // Return a success response with the fetched invitations
    return res.status(200).json({
      success: true,
      invitations,
    });
  } catch (error) {
    console.error("Error fetching received invitations:", error);

    // Handle unexpected errors with a descriptive message
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching received invitations.",
    });
  }
};

// Get list of sent invitations
export const getSentInvitations = async (req, res) => {
  const { userId } = req.params;

  try {
    const invitations = await Connection.find({
      sender: userId,
      status: "pending",
    }).populate({
      path: "receiver",
      select: "name status profile", // Select sender's name, status, and profile reference
      populate: {
        path: "profile", // Nested populate for profile details
        select: "profilePhoto status", // Fetch only profilePhoto and status
      },
    });

    return res.status(200).json({
      success: true,
      invitations,
    });
  } catch (error) {
    console.error("Error fetching sent invitations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sent invitations.",
    });
  }
};

export const getConnectedUsers = async (req, res) => {
  const { userId } = req.params;

  try {
    // Ensure userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    // Find user's connections from ConnectedUsers model
    const userConnections = await ConnectedUsers.findOne({ userId }).populate({
      path: "connections.user",
      select: "name profile",
      populate: {
        path: "profile",
        select: "profilePhoto",
      },
    });

    if (!userConnections) {
      return res.status(200).json({
        success: true,
        connectedUsers: [],
      });
    }

    // Ensure all connections are properly mapped
    const connectedUsers = userConnections.connections
      .map((conn) => {
        if (!conn.user) return null; // Handle case where user is missing
        return {
          id: conn.user._id,
          name: conn.user.name,
          profilePhoto: conn.user.profile
            ? conn.user.profile.profilePhoto
            : null,
          connectionCreatedAt: conn.connectedAt, // Include actual connection creation time
        };
      })
      .filter((user) => user !== null); // Remove any null values

    return res.status(200).json({
      success: true,
      connectedUsers,
    });
  } catch (error) {
    console.error("Error fetching connected users:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch connected users.",
      error: error.message,
    });
  }
};

export const checkConnectionStatus = async (req, res) => {
  const { senderId, receiverId } = req.params;

  try {
    // Ensure both IDs are provided
    if (!senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "Sender ID and Receiver ID are required.",
      });
    }

    // Find the user in the ConnectedUsers collection
    const user = await ConnectedUsers.findOne({ userId: senderId });

    if (!user || !user.connections) {
      return res.status(200).json({
        success: true,
        isConnected: false, // ✅ Ensuring Boolean format
      });
    }

    // ✅ Check if receiverId is in the user's connections array
    const isConnected = user.connections.some(
      (connection) => connection.user.toString() === receiverId
    );

    // If a connection exists, return its status
    return res.status(200).json({
      success: true,
      isConnected: Boolean(isConnected), // ✅ Always returns `true` or `false`
    });
  } catch (error) {
    console.error("Error checking connection status:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while checking connection status.",
    });
  }
};

// export const getUnseenConnections = async (req, res) => {
//   try {
//     const userId = req.params.userId; // Get userId from route parameters

//     // Fetch all unseen connections where the user is the receiver and the connection is accepted
//     const unseenConnections = await Connection.find({
//       receiver: userId,
//       status: "accepted",
//       isSeen: false,
//     }).select("_id");

//     // Extract connection IDs
//     const unseenConnectionIds = unseenConnections.map(
//       (connection) => connection._id
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Unseen connection IDs fetched successfully.",
//       data: unseenConnectionIds,
//     });
//   } catch (error) {
//     console.error("Error fetching unseen connection IDs:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch unseen connection IDs.",
//       error: error.message,
//     });
//   }
// };

// export const markConnectionsAsSeen = async (req, res) => {
//   try {
//     const userId = req.params.userId; // Get userId from route parameters

//     // Update all unseen connections where the user is the receiver
//     const updatedConnections = await Connection.updateMany(
//       {
//         receiver: userId,
//         status: "accepted",
//         isSeen: false,
//       },
//       { $set: { isSeen: true } }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Unseen connections marked as seen.",
//       data: updatedConnections,
//     });
//   } catch (error) {
//     console.error("Error marking connections as seen:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to mark connections as seen.",
//       error: error.message,
//     });
//   }
// };
