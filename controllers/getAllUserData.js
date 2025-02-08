// controllers/userController.js
import SavedProfile from "../models/savedProfile.js";
import UserModel from "../models/user.js";
import BlockModel from "../models/block.js";
import ReportModel from "../models/report.js";
import mongoose from "mongoose";

// Controller to get users feed
export const getCofoundersFeed = async (req, res) => {
  try {
    const { userId } = req.params;
    let { cursor, limit = 6 } = req.query; // Cursor-based pagination

    // ✅ Validate userId before querying
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId provided",
      });
    }

    // ✅ Validate cursor before using it in query
    let cursorFilter = {};
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      cursorFilter._id = { $gt: new mongoose.Types.ObjectId(cursor) };
    }

    // Get blocked and reported users
    const blockedUserIds = await BlockModel.find({ blocker: userId }).distinct(
      "blocked"
    );
    const reportedUserIds = await ReportModel.find({
      reporter: userId,
    }).distinct("reported");
    const excludedUserIds = [...blockedUserIds, ...reportedUserIds, userId];

    const users = await UserModel.aggregate([
      {
        $match: {
          isVerified: true,
          isDeleted: false,
          _id: { $nin: excludedUserIds }, // Exclude blocked, swiped, or reported users
        },
      },
      { $sample: { size: parseInt(limit) } }, // Get random users
      {
        $lookup: {
          from: "userprofiles", // ✅ Ensure this matches your actual MongoDB collection name
          localField: "profile",
          foreignField: "_id",
          as: "profile",
        },
      },
      { $unwind: { path: "$profile", preserveNullAndEmptyArrays: false } }, // ✅ Ensures users without profiles are removed
      {
        $match: {
          "profile.status": { $exists: true, $ne: null },
          "profile.profilePhoto": { $exists: true, $ne: null },
          "profile.birthday": { $exists: true, $ne: null },
          "profile.bio": { $exists: true, $ne: null },
          "profile.location": { $exists: true, $ne: null },
          "profile.skillSet": { $exists: true, $ne: [] },
          "profile.industries": { $exists: true, $ne: [] },
          "profile.priorStartupExperience": { $exists: true, $ne: null },
          "profile.commitmentLevel": { $exists: true, $ne: null },
          "profile.equityExpectation": { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          isVerified: 1,
          isDeleted: 1,
          totalConnections: 1,
          pushToken: 1,
          createdAt: 1,
          updatedAt: 1,
          "profile._id": 1,
          "profile.birthday": 1,
          "profile.location": 1,
          "profile.skillSet": 1,
          "profile.industries": 1,
          "profile.commitmentLevel": 1,
          "profile.equityExpectation": 1,
          "profile.priorStartupExperience": 1,
          "profile.status": 1,
          "profile.profilePhoto": 1,
          "profile.bio": 1,
          "profile.instagramLink": 1,
          "profile.linkedInLink": 1,
          "profile.xLink": 1,
        },
      },
    ]);

    // Filter users who have a profile
    const filteredUsers = users.filter((user) => user.profile);

    // Determine next cursor
    const nextCursor = users.length > limit ? users[limit]._id : null;

    return res.status(200).json({
      success: true,
      message: "Verified users with complete profiles fetched successfully.",
      data: filteredUsers.slice(0, limit),
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching users feed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users feed",
    });
  }
};

export const getUserSearchFeed = async (req, res) => {
  try {
    const { page = 1 } = req.query; // Get page number from query, default is 1
    const limit = 12; // Limit 12 users per request
    const skip = (page - 1) * limit; // Calculate skip value

    // Fetch 12 verified users with complete profiles
    const users = await UserModel.find({
      isVerified: true,
      isDeleted: false,
    })
      .populate({
        path: "profile",
        select: "status profilePhoto",
        match: {
          status: { $exists: true, $ne: null },
          profilePhoto: { $exists: true, $ne: null },
        },
      })
      .select("name") // Fetch only the name field from UserModel
      .skip(skip)
      .limit(limit)
      .lean(); // Convert Mongoose documents to plain JavaScript objects for better performance

    // Filter users with profiles and format the response
    const formattedUsers = users
      .filter((user) => user.profile)
      .map((user) => ({
        id: user._id, // Include user ID
        name: user.name,
        status: user.profile.status,
        profilePhoto: user.profile.profilePhoto,
      }));

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      data: formattedUsers,
      hasMore: formattedUsers.length === limit, // Check if more users are available
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
    });
  }
};

// Fetch all users
export const getAllUsers = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await UserModel.find().populate({
      path: "profile",
      populate: [
        {
          path: "education",
          model: "Education", // Populate the Education model
        },
        {
          path: "experience",
          model: "Experience", // Populate the Experience model
        },
      ],
    });

    // Return the response with all user data
    return res.status(200).json({
      success: true,
      message: "All users retrieved successfully.",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching all users:", error); // Log the error for debugging
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve all users",
      data: null,
    });
  }
};

// Fetch user count
export const getUserCount = async (req, res) => {
  try {
    // Get the total count of users in the database
    const userCount = await UserModel.countDocuments();

    // Return the response with the user count
    return res.status(200).json({
      success: true,
      message: "User count retrieved successfully.",
      count: userCount,
    });
  } catch (error) {
    console.error("Error fetching user count:", error); // Log the error for debugging
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user count",
      count: null,
    });
  }
};

export const addCofounderSavedProfile = async (req, res) => {
  const { userId } = req.params; // Current user's ID
  const { savedUserId } = req.body; // ID of the user to save

  try {
    if (!savedUserId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a profile to save.",
      });
    }

    // Check if the user already has a saved profile list
    let existingProfile = await SavedProfile.findOne({ userId });

    if (existingProfile) {
      // Check if the savedUserId is already in the list
      if (existingProfile.savedUserIds.includes(savedUserId)) {
        return res.status(409).json({
          success: false,
          message: "Co-founder is already saved.",
        });
      }

      // Add the new savedUserId to the array
      existingProfile.savedUserIds.push(savedUserId);
      await existingProfile.save();
    } else {
      // Create a new saved profile document if none exists
      existingProfile = new SavedProfile({
        userId,
        savedUserIds: [savedUserId],
      });

      await existingProfile.save();
    }

    return res.status(201).json({
      success: true,
      message: "Profile saved successfully.",
    });
  } catch (error) {
    console.error("Error saving profile:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while saving the profile.",
    });
  }
};

export const addInvestorToSavedProfiles = async (req, res) => {
  try {
    const { userId, investorId } = req.params; // Get IDs from request params

    if (!userId || !investorId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Investor ID are required.",
      });
    }

    // Find existing saved profile for the user
    let savedProfile = await SavedProfile.findOne({ userId });

    if (savedProfile) {
      // Check if investorId is already saved
      if (savedProfile.savedInvestorIds.includes(investorId)) {
        return res.status(409).json({
          success: false,
          message: "Investor profile is already saved.",
        });
      }

      // Add investorId to savedInvestorIds array
      savedProfile.savedInvestorIds.push(investorId);
      await savedProfile.save();
    } else {
      // Create new saved profile document if none exists
      savedProfile = new SavedProfile({
        userId,
        savedInvestorIds: [investorId],
      });

      await savedProfile.save();
    }

    return res.status(201).json({
      success: true,
      message: "Investor profile saved successfully.",
      data: savedProfile,
    });
  } catch (error) {
    console.error("Error saving investor profile:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while saving the investor profile.",
    });
  }
};

export const getCoFoundersByUserId = async (req, res) => {
  const { userId } = req.params; // Extract userId from params

  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    // Fetch saved profiles and populate co-founder details
    const savedProfiles = await SavedProfile.findOne({ userId }).populate({
      path: "savedUserIds", // Ensure `savedUserIds` is an array in the schema
      populate: {
        path: "profile", // Populate co-founders' profile details
      },
    });

    // Check if user has any saved co-founders
    if (!savedProfiles || savedProfiles.savedUserIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No co-founders found for the given User ID.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Co-founders retrieved successfully.",
      data: savedProfiles.savedUserIds, // Return populated co-founders
    });
  } catch (error) {
    console.error("Error fetching co-founders:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching co-founders.",
    });
  }
};

export const getInvestorsByUserId = async (req, res) => {
  const { userId } = req.params; // Extract userId from params

  try {
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required." });
    }

    // Fetch saved profile and populate investors
    const savedProfile = await SavedProfile.findOne({ userId }).populate({
      path: "savedInvestorIds",
      model: "Investor",
    });

    if (!savedProfile || savedProfile.savedInvestorIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No investors found for the given User ID.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Investors retrieved successfully.",
      data: savedProfile.savedInvestorIds,
    });
  } catch (error) {
    console.error("Error fetching investors:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching investors.",
    });
  }
};

export const removeCoFounderProfile = async (req, res) => {
  const { userId } = req.params; // Get userId from the URL parameters
  const { coFounderId } = req.body; // Get coFounderId from the request body

  try {
    if (!coFounderId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a co-founder ID to remove.",
      });
    }

    // Find the saved profile for the user
    const savedProfile = await SavedProfile.findOne({ userId });

    if (!savedProfile) {
      return res.status(404).json({
        success: false,
        message: "No saved profiles found for this user.",
      });
    }

    // Remove the co-founder ID from the array
    const updatedSavedUserIds = savedProfile.savedUserIds.filter(
      (id) => id.toString() !== coFounderId
    );

    // Check if any changes were made
    if (updatedSavedUserIds.length === savedProfile.savedUserIds.length) {
      return res.status(404).json({
        success: false,
        message: "Co-founder profile not found in saved list.",
      });
    }

    // Update the document in the database
    savedProfile.savedUserIds = updatedSavedUserIds;
    await savedProfile.save();

    return res.status(200).json({
      success: true,
      message: "Co-founder profile removed successfully.",
    });
  } catch (error) {
    console.error("Error removing co-founder profile:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while removing the co-founder profile.",
    });
  }
};

export const removeInvestorProfile = async (req, res) => {
  const { userId } = req.params; // Get userId from the URL parameters
  const { investorId } = req.body; // Get investorId from the request body

  try {
    if (!investorId) {
      return res.status(400).json({
        success: false,
        message: "Please provide an investor ID to remove.",
      });
    }

    // Find the saved profile by userId
    const result = await SavedProfile.findOneAndUpdate(
      { userId, savedInvestorIds: investorId }, // Match userId and the investorId in the array
      { $pull: { savedInvestorIds: investorId } }, // Use $pull to remove the investorId from the savedInvestorIds array
      { new: true } // Return the updated document
    );

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Investor profile not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Investor profile removed successfully.",
    });
  } catch (error) {
    console.error("Error removing investor profile:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while removing the investor profile.",
    });
  }
};
