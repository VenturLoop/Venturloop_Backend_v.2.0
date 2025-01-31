// controllers/userController.js
import SavedProfile from "../models/savedProfile.js";
import UserModel from "../models/user.js";
import BlockModel from "../models/block.js";
import ReportModel from "../models/report.js";

// Controller to get users feed
export const getCofoundersFeed = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get blocked and reported users
    const blockedUserIds = await BlockModel.find({ blocker: userId }).distinct(
      "blocked"
    );
    const reportedUserIds = await ReportModel.find({
      reporter: userId,
    }).distinct("reported");
    const excludedUserIds = [...blockedUserIds, ...reportedUserIds, userId];

    // Fetch 6 verified users with complete profiles
    const users = await UserModel.find({
      isVerified: true,
      isDeleted: false,
      _id: { $nin: excludedUserIds },
    })
      .populate({
        path: "profile",
        match: {
          status: { $exists: true, $ne: null },
          profilePhoto: { $exists: true, $ne: null },
          birthday: { $exists: true, $ne: null },
          bio: { $exists: true, $ne: null },
          location: { $exists: true, $ne: null },
          skillSet: { $exists: true, $ne: [] },
          industries: { $exists: true, $ne: [] },
          priorStartupExperience: { $exists: true, $ne: null },
          commitmentLevel: { $exists: true, $ne: null },
          equityExpectation: { $exists: true, $ne: null },
        },
      })
      .limit(6);

    return res.status(200).json({
      success: true,
      message: "Verified users with complete profiles fetched successfully.",
      data: users.filter((user) => user.profile), // Ensure only users with profiles are included
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
      .select("userName")
      .skip(skip)
      .limit(limit);

    // Filter and format response
    const formattedUsers = users
      .filter((user) => user.profile)
      .map((user) => ({
        userName: user.userName,
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

export const addInvestorSavedProfile = async (req, res) => {
  const { userId } = req.params; // Current user's ID
  const { savedInvestorId } = req.body; // ID of the investor to save

  try {
    if (!savedInvestorId) {
      return res.status(400).json({
        success: false,
        message: "Please provide an investor profile to save.",
      });
    }

    // Check if the user already has a saved investor profile list
    let existingProfile = await SavedProfile.findOne({ userId });

    if (existingProfile) {
      // Check if the savedInvestorId is already in the list
      if (existingProfile.savedInvestorIds.includes(savedInvestorId)) {
        return res.status(409).json({
          success: false,
          message: "Investor profile is already saved.",
        });
      }

      // Add the new savedInvestorId to the array
      existingProfile.savedInvestorIds.push(savedInvestorId);
      await existingProfile.save();
    } else {
      // Create a new saved profile document if none exists
      existingProfile = new SavedProfile({
        userId,
        savedInvestorIds: [savedInvestorId],
      });

      await existingProfile.save();
    }

    return res.status(201).json({
      success: true,
      message: "Investor profile saved successfully.",
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
    const result = await savedProfile.findOneAndUpdate(
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
