import UserModel from "../models/user.js";
import UserProfileModel from "../models/userProfile.js";
import EducationModel from "../models/education.js";
import ExperienceModel from "../models/experience.js";
import BlockModel from "../models/block.js";
import ReportModel from "../models/report.js";
import Company from "../models/company.js";
import ViewerModel from "../models/viewUser.js";

export const saveUserProfileDetails = async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from request parameters
    const {
      skillSet,
      industries,
      priorStartupExperience,
      commitmentLevel,
      equityExpectation,
      status,
    } = req.body; // Extract profile details from request body

    // Check if the user exists
    const user = await UserModel.findById(userId).populate("profile");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check if the user has a profile
    if (!user.profile) {
      // If no profile exists, create a new profile
      const newProfile = new UserProfileModel({
        skillSet,
        industries,
        priorStartupExperience,
        commitmentLevel,
        equityExpectation,
        status,
      });

      // Save the new profile and link it to the user
      await newProfile.save();
      user.profile = newProfile._id;
      await user.save();

      return res.status(201).json({
        success: true,
        message: "Profile created successfully.",
        profile: newProfile,
      });
    }

    // If a profile exists, update it
    const userProfile = user.profile;
    userProfile.skillSet = skillSet || userProfile.skillSet;
    userProfile.industries = industries || userProfile.industries;
    userProfile.priorStartupExperience =
      priorStartupExperience ?? userProfile.priorStartupExperience;
    userProfile.commitmentLevel =
      commitmentLevel || userProfile.commitmentLevel;
    userProfile.equityExpectation =
      equityExpectation || userProfile.equityExpectation;
    userProfile.status = status || userProfile.status;

    // Save the updated profile
    await userProfile.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      profile: userProfile,
    });
  } catch (error) {
    console.error("Error saving user profile details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const getUserProfileDetails = async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from request parameters

    // Find the user by userId and populate the profile data
    const user = await UserModel.findById(userId).populate("profile").populate({
      path: "workingWith.postId", // Populate the postId inside workingWith
      model: "Post", // The model to populate
    }); // Populate the profile object

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check if the user has a profile
    if (!user.profile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    // Return the user and profile details
    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully.",
      user: {
        userId: user._id,
        email: user.email,
        name: user.name,
        userChatStatus: user.status,
        lastSeen: user.lastSeen,
        profile: user.profile,
        workingWith: user.workingWith.map((entry) => entry.postId), // Full
        user: user, //  post details
      },
    });
  } catch (error) {
    console.error("Error fetching user profile details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const updateUserProfileDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      status,
      profilePhoto,
      birthday,
      bio,
      location,
      skillSet,
      industries,
      priorStartupExperience,
      commitmentLevel,
      equityExpectation,
      instagramLink,
      xLink,
      linkedInLink,
      otherWebsiteUrls,
    } = req.body;

    // Fetch user and populate profile
    const user = await UserModel.findById(userId).populate("profile");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (!user.profile) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found." });
    }

    const userProfile = user.profile;

    // Update profile fields conditionally
    Object.assign(userProfile, {
      status: status ?? userProfile.status,
      profilePhoto: profilePhoto ?? userProfile.profilePhoto,
      birthday: birthday ?? userProfile.birthday,
      bio: bio ?? userProfile.bio,
      location: location ?? userProfile.location,
      skillSet: skillSet ?? userProfile.skillSet,
      industries: industries ?? userProfile.industries,
      priorStartupExperience:
        priorStartupExperience ?? userProfile.priorStartupExperience,
      commitmentLevel: commitmentLevel ?? userProfile.commitmentLevel,
      equityExpectation: equityExpectation ?? userProfile.equityExpectation,
      instagramLink: instagramLink ?? userProfile.instagramLink,
      xLink: xLink ?? userProfile.xLink,
      linkedInLink: linkedInLink ?? userProfile.linkedInLink,
      otherWebsiteUrls: otherWebsiteUrls ?? userProfile.otherWebsiteUrls,
    });

    // Save updated profile
    await userProfile.save();

    return res.status(200).json({
      success: true,
      message: "User profile updated successfully.",
      profile: userProfile,
    });
  } catch (error) {
    console.error("Error updating user profile details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const updateName = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from the URL parameters
    const { name } = req.body; // Get name from the request body

    // Find the user by ID and update the name
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { name },
      { new: true } // Return the updated document
    ).populate("profile"); // Populate the 'profile' field if it exists

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User name updated successfully.",
      data: updatedUser, // Return the updated user object with populated profile
    });
  } catch (error) {
    console.error("Error updating user name:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Controller to search a company by its name
export const searchCompanyByName = async (req, res) => {
  const { companyName } = req.params; // Get company name from the URL parameters

  try {
    // Search for the company by name, case-insensitive search
    const company = await Company.find({
      name: { $regex: new RegExp(companyName, "i") }, // 'i' for case-insensitive matching
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found with the given name.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Company found.",
      data: company,
    });
  } catch (error) {
    console.error("Error searching company:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while searching for the company.",
    });
  }
};

export const addCompanyUrl = async (req, res) => {
  const { companyId } = req.params; // Get companyId from route parameters
  const { companyUrl } = req.body; // Get the companyUrl from the request body

  try {
    // Validate input
    if (!companyUrl) {
      return res.status(400).json({
        success: false,
        message: "Company URL is required.",
      });
    }

    // Find and update the company by ID
    const company = await Company.findByIdAndUpdate(
      companyId,
      { companyUrl },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    // Update all experiences that have this company name and an empty companyPhoto
    const updatedExperiences = await ExperienceModel.updateMany(
      {
        "experiences.company": company.name,
        "experiences.companyPhoto": { $in: ["", null] }, // Only update if companyPhoto is empty or null
      },
      {
        $set: { "experiences.$[exp].companyPhoto": companyUrl },
      },
      {
        arrayFilters: [
          {
            "exp.company": company.name,
            "exp.companyPhoto": { $in: ["", null] },
          },
        ],
        multi: true, // Update multiple documents
      }
    );

    return res.status(200).json({
      success: true,
      message:
        updatedExperiences.modifiedCount > 0
          ? "Company URL updated successfully and applied to experiences."
          : "Company URL updated, but no experiences required an update.",
    });
  } catch (error) {
    console.error("Error updating company URL and experiences:", error);
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while updating the company URL and experiences.",
    });
  }
};

// Get all companies
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find(); // Fetch all companies
    return res.status(200).json({
      success: true,
      message: "All companies retrieved successfully.",
      data: companies,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching companies.",
    });
  }
};

// Get companies with an empty companyUrl
export const getCompaniesWithoutUrl = async (req, res) => {
  try {
    const companies = await Company.find({
      $or: [{ companyUrl: "" }, { companyUrl: null }],
    }); // Find companies where companyUrl is empty or null
    return res.status(200).json({
      success: true,
      message: "Companies without a company URL retrieved successfully.",
      data: companies,
    });
  } catch (error) {
    console.error("Error fetching companies without URL:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching companies without a URL.",
    });
  }
};

// Controller to add education data for a user
export const addEducation = async (req, res) => {
  const { userId } = req.params; // Get userId from route parameters
  const {
    degree,
    institution,
    currentlyStudying,
    startDate,
    endDate,
    description,
  } = req.body; // Get education details from request body

  try {
    // Check if all required fields are provided
    if (!degree || !institution || !startDate) {
      return res.status(400).json({
        success: false,
        message: "Degree, institution, and startDate are required.",
      });
    }

    // Add education to the user's education array
    const updatedEducation = await EducationModel.findOneAndUpdate(
      { userId }, // Find the user by userId
      {
        $push: {
          // Add new education record to the user's education array
          education: {
            degree,
            institution,
            currentlyStudying,
            startDate,
            endDate,
            description,
          },
        },
      },
      { upsert: true, new: true } // Create the document if it doesn't exist
    );

    return res.status(200).json({
      success: true,
      message: "Education added successfully.",
      data: updatedEducation,
    });
  } catch (error) {
    console.error("Error adding education:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while adding education.",
    });
  }
};

// Controller to update education by educationId
export const updateEducation = async (req, res) => {
  const { userId, educationId } = req.params; // Get userId and educationId from route parameters
  const {
    degree,
    institution,
    currentlyStudying,
    startDate,
    endDate,
    description,
  } = req.body; // Get updated education details from request body

  try {
    // Find the user's education document and the specific education entry to update
    const updatedEducation = await EducationModel.findOneAndUpdate(
      { userId, "education._id": educationId }, // Match the userId and educationId
      {
        $set: {
          "education.$.degree": degree, // Update the degree
          "education.$.institution": institution, // Update the institution
          "education.$.currentlyStudying": currentlyStudying, // Update currentlyStudying status
          "education.$.startDate": startDate, // Update startDate
          "education.$.endDate": endDate, // Update endDate
          "education.$.description": description, // Update description
        },
      },
      { new: true } // Return the updated document
    );

    if (!updatedEducation) {
      return res.status(404).json({
        success: false,
        message: "Education entry not found or could not be updated.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Education updated successfully.",
      data: updatedEducation,
    });
  } catch (error) {
    console.error("Error updating education:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating education.",
    });
  }
};

export const getAllEducationByUserId = async (req, res) => {
  const { userId } = req.params; // Get userId from route parameters

  try {
    // Find all education records for the given userId
    const userEducation = await EducationModel.find({ userId });

    if (!userEducation || userEducation.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No education records found for this user.",
      });
    }

    return res.status(200).json({
      success: true,
      data: userEducation,
    });
  } catch (error) {
    console.error("Error fetching education records:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching education records.",
    });
  }
};

// Controller to get a specific education record by userId and educationId
export const getEducationById = async (req, res) => {
  const { userId, educationId } = req.params; // Get userId and educationId from route parameters

  try {
    // Find the specific education entry by userId and educationId
    const userEducation = await EducationModel.findOne({
      userId,
      "education._id": educationId, // Search within the user's education array
    });

    if (!userEducation) {
      return res.status(404).json({
        success: false,
        message: "Education entry not found for this user.",
      });
    }

    // Find the specific education entry
    const educationEntry = userEducation.education.id(educationId);

    if (!educationEntry) {
      return res.status(404).json({
        success: false,
        message: "No such education entry exists.",
      });
    }

    return res.status(200).json({
      success: true,
      data: educationEntry,
    });
  } catch (error) {
    console.error("Error fetching education by ID:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the education entry.",
    });
  }
};

export const deleteEducation = async (req, res) => {
  const { userId, educationId } = req.params; // Get userId and educationId from route parameters

  try {
    // Find the user and remove the specific education entry by educationId
    const updatedUser = await EducationModel.findOneAndUpdate(
      { userId },
      { $pull: { education: { _id: educationId } } }, // Pull out the education entry with the matching educationId
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found or education entry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Education deleted successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error deleting education:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting education.",
    });
  }
};

// Controller to add a new experience
export const addExperience = async (req, res) => {
  const { userId } = req.params; // Get the userId from the route parameters
  const {
    title,
    companyName, // Company name provided by user
    companyId, // Company ID provided by user
    startDate,
    endDate,
    description,
  } = req.body; // Get the experience details from the request body

  try {
    let companyNameToUse = "";
    let companyUrlToUse = "";

    // Check if companyId is provided
    if (companyId) {
      // Find the company by companyId and get the company name and URL
      const company = await Company.findById(companyId);
      if (company) {
        companyNameToUse = company.name;
        companyUrlToUse = company.companyUrl;
      } else {
        return res.status(404).json({
          success: false,
          message: "Company not found with the given companyId.",
        });
      }
    } else if (companyName) {
      // If companyId is not provided, check if companyName is provided
      // Check if company already exists
      let company = await Company.findOne({ name: companyName });

      if (!company) {
        // Create a new company if it doesn't exist
        company = new Company({
          name: companyName,
          companyUrl: "", // Empty URL as it will be updated later
        });
        await company.save();
      }

      companyNameToUse = company.name;
      companyUrlToUse = company.companyUrl;
    } else {
      return res.status(400).json({
        success: false,
        message: "Please provide either a companyId or companyName.",
      });
    }

    // Find the user and add the new experience to the user's experience list
    const userExperience = await ExperienceModel.findOne({ userId });

    if (!userExperience) {
      // If no experience document exists for this user, create a new one
      const newExperience = new ExperienceModel({
        userId,
        experiences: [
          {
            title,
            company: companyNameToUse,
            startDate,
            endDate,
            description,
            companyPhoto: companyUrlToUse,
          },
        ],
      });
      await newExperience.save();
    } else {
      // If experience document exists, push the new experience to the experiences array
      userExperience.experiences.push({
        title,
        company: companyNameToUse,
        startDate,
        endDate,
        description,
        companyPhoto: companyUrlToUse,
      });
      await userExperience.save();
    }

    return res.status(201).json({
      success: true,
      message: "Experience added successfully.",
    });
  } catch (error) {
    console.error("Error adding experience:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while adding experience.",
    });
  }
};

export const updateExperience = async (req, res) => {
  const { userId, experienceId } = req.params; // Get userId and experienceId from the route parameters
  const {
    title,
    company,
    startDate,
    endDate,
    description,
    location,
    skills,
    companyPhoto,
  } = req.body; // Get the updated experience details from the request body

  try {
    // Find the user's experience document
    const userExperience = await ExperienceModel.findOne({ userId });

    if (!userExperience) {
      return res.status(404).json({
        success: false,
        message: "User's experience not found.",
      });
    }

    // Find the specific experience to update by experienceId
    const experienceIndex = userExperience.experiences.findIndex(
      (exp) => exp._id.toString() === experienceId
    );

    if (experienceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Experience not found for the given experienceId.",
      });
    }

    // Update the experience
    userExperience.experiences[experienceIndex] = {
      ...userExperience.experiences[experienceIndex], // Keep existing values
      title,
      company,
      startDate,
      endDate,
      description,
      location,
      skills,
      companyPhoto,
    };

    // Save the updated experience document
    await userExperience.save();

    return res.status(200).json({
      success: true,
      message: "Experience updated successfully.",
      data: userExperience.experiences[experienceIndex],
    });
  } catch (error) {
    console.error("Error updating experience:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating experience.",
    });
  }
};

export const getAllExperiences = async (req, res) => {
  const { userId } = req.params; // Get userId from route parameters

  try {
    // Find the user's experience document
    const userExperience = await ExperienceModel.findOne({ userId });

    if (!userExperience) {
      return res.status(404).json({
        success: false,
        message: "No experiences found for this user.",
      });
    }

    return res.status(200).json({
      success: true,
      experiences: userExperience.experiences,
    });
  } catch (error) {
    console.error("Error fetching experiences:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching experiences.",
    });
  }
};

// Controller to get a particular experience by experienceId
export const getExperienceById = async (req, res) => {
  const { userId, experienceId } = req.params; // Get userId and experienceId from route parameters

  try {
    // Find the user's experience document
    const userExperience = await ExperienceModel.findOne({ userId });

    if (!userExperience) {
      return res.status(404).json({
        success: false,
        message: "User's experience not found.",
      });
    }

    // Find the particular experience by experienceId
    const experience = userExperience.experiences.find(
      (exp) => exp._id.toString() === experienceId
    );

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: "Experience not found for the given experienceId.",
      });
    }

    return res.status(200).json({
      success: true,
      experience,
    });
  } catch (error) {
    console.error("Error fetching experience:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the experience.",
    });
  }
};

export const deleteExperience = async (req, res) => {
  const { userId, experienceId } = req.params; // Get userId and experienceId from the route parameters

  try {
    // Find the user's experience document
    const userExperience = await ExperienceModel.findOne({ userId });

    if (!userExperience) {
      return res.status(404).json({
        success: false,
        message: "User's experience not found.",
      });
    }

    // Find the index of the experience to delete by experienceId
    const experienceIndex = userExperience.experiences.findIndex(
      (exp) => exp._id.toString() === experienceId
    );

    if (experienceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Experience not found for the given experienceId.",
      });
    }

    // Remove the experience from the user's experience array
    userExperience.experiences.splice(experienceIndex, 1);

    // Save the updated experience document
    await userExperience.save();

    return res.status(200).json({
      success: true,
      message: "Experience deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting experience:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the experience.",
    });
  }
};

// Block a user
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params; // User to be blocked (from params)
    const { blockerId } = req.body; // Logged-in user/blocker (from body)

    // Fetch both users
    const [userToBlock, blocker] = await Promise.all([
      UserModel.findById(userId),
      UserModel.findById(blockerId),
    ]);

    if (!userToBlock) {
      return res.status(404).json({ message: "User to block not found" });
    }

    if (!blocker) {
      return res.status(404).json({ message: "Blocker user not found" });
    }

    // Check if blocker is trying to block themselves
    if (blocker._id.equals(userToBlock._id)) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    // Check if the user is already blocked
    const existingBlock = await BlockModel.findOne({
      blocker: userToBlock._id,
      blocked: blocker._id,
    });

    if (existingBlock) {
      return res.status(400).json({ message: "User is already blocked" });
    }

    // Create a new block entry
    const newBlock = new BlockModel({
      blocker: userToBlock._id,
      blocked: blocker._id,
    });

    await newBlock.save();

    return res.status(200).json({ message: "User blocked successfully" });
  } catch (err) {
    console.error("Error blocking user:", err.message);
    res
      .status(500)
      .json({ message: `Server error, please try again later ${err}` });
  }
};

// Unblock a user
export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params; // User to be unblocked
    const { blockerId } = req.body; // Logged-in user/blocker

    // Remove block record
    const block = await BlockModel.findOneAndDelete({
      blocker: userId,
      blocked: blockerId,
    });

    if (!block) {
      return res.status(404).json({ message: "Block record not found" });
    }

    return res.status(200).json({ message: "User unblocked successfully" });
  } catch (err) {
    console.error("Error unblocking user:", err.message);
    res.status(500).json({ message: "Server error, please try again later" });
  }
};

export const getAllBlockedUsers = async (req, res) => {
  try {
    const { blockerId } = req.params;

    // Fetch all block records where the blocker is the specified user
    const blockedUsers = await BlockModel.find({ blocker: blockerId })
      .populate({
        path: "blocked",
        select: "name email profile", // Populate blocked user's profile (including name and email)
        populate: {
          path: "profile", // Nested populate for profile subdocument
          select: "profilePhoto", // Only fetch the profilePhoto from the profile subdocument
        },
      })
      .sort({ blockedAt: -1 }); // Sort by the most recent blocks

    // Prepare the response with desired user data
    return res.status(200).json({
      blockerId,
      blockedUsers: blockedUsers.map((block) => ({
        id: block.blocked._id, // Blocked user ID
        name: block.blocked.name, // Blocked user name
        imageUrl: block.blocked.profile.profilePhoto, // Profile photo URL from the profile subdocument
        blockedAt: block.blockedAt, // Time when the user was blocked
      })),
    });
  } catch (err) {
    console.error("Error fetching blocked users:", err.message);
    res.status(500).json({ message: "Server error, please try again later" });
  }
};

// Report a user
export const reportUser = async (req, res) => {
  try {
    const { userId } = req.params; // User being reported
    const { reporterId, reason } = req.body; // Reporter and reason for report

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: "Reason for report is required" });
    }

    // Check if the report already exists
    const existingReport = await ReportModel.findOne({
      reporter: reporterId,
      reported: userId,
      resolved: false,
    });

    if (existingReport) {
      return res.status(400).json({ message: "User is already reported" });
    }

    // Create a new report
    const newReport = new ReportModel({
      reporter: reporterId,
      reported: userId,
      reason,
    });

    await newReport.save();

    return res.status(200).json({ message: "User reported successfully" });
  } catch (err) {
    console.error("Error reporting user:", err.message);
    res.status(500).json({ message: "Server error, please try again later" });
  }
};

// Admin: Get all reports
export const getReportedUsers = async (req, res) => {
  try {
    const reportedUsers = await ReportModel.find({ resolved: false })
      .populate("reporter", "username email") // Populates reporter details
      .populate("reported", "username email") // Populates reported user details
      .sort({ reportedAt: -1 }); // Sort by latest reports

    return res.status(200).json({ reportedUsers });
  } catch (err) {
    console.error("Error fetching reported users:", err.message);
    res.status(500).json({ message: "Server error, please try again later" });
  }
};

// Admin: Resolve a report
export const resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    // Find the report
    const report = await ReportModel.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Update the status to "resolved"
    report.status = "resolved";
    await report.save();

    // Respond with success
    return res.status(200).json({
      message: "Report resolved successfully",
      report: {
        id: report._id,
        reporter: report.reporter,
        reported: report.reported,
        status: report.status,
        resolvedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("Error resolving report:", err.message);
    res.status(500).json({ message: "Server error, please try again later" });
  }
};

// Controller to handle account deletion
export const deleteUserAccount = async (req, res) => {
  const { userId } = req.params; // Get userId from route parameters

  try {
    // Find the user and update isDeleted to true
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { isDeleted: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User account marked as deleted successfully.",
      user,
    });
  } catch (error) {
    console.error("Error deleting user account:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the user account.",
    });
  }
};

export const savePushToken = async (req, res) => {
  const { userId, pushToken } = req.body;
  if (!userId || !pushToken) {
    return res
      .status(400)
      .json({ message: "UserId and PushToken are required" });
  }

  await UserModel.findByIdAndUpdate(userId, { pushToken });
  res.status(200).json({ message: "Push token saved successfully" });
};

// Controller to save userId and viewerId
export const saveViewer = async (req, res) => {
  const { userId, viewerId } = req.body;

  try {
    // Check if the userId already exists in the database
    let viewerDoc = await ViewerModel.findOne({ userId });

    if (viewerDoc) {
      // If userId exists, check if viewerId is already in the viewers array
      const isAlreadyViewer = viewerDoc.viewers.some(
        (viewer) => viewer.viewerId.toString() === viewerId
      );

      if (!isAlreadyViewer) {
        // Add the viewerId to the viewers array
        viewerDoc.viewers.push({ viewerId });
        await viewerDoc.save();
      }
    } else {
      // If userId doesn't exist, create a new document
      viewerDoc = new ViewerModel({
        userId,
        viewers: [{ viewerId }],
      });
      await viewerDoc.save();
    }

    res
      .status(200)
      .json({ success: true, message: "Viewer saved successfully." });
  } catch (error) {
    console.error("Error saving viewer:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// Controller to get viewers and total count by userId
export const getViewers = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the viewer document for the specified userId and populate viewer details
    const viewerDoc = await ViewerModel.findOne({ userId }).populate({
      path: "viewers.viewerId", // Populate viewerId within the viewers array
      select: "name profile", // Select name and profile fields from UserModel
      populate: {
        path: "profile", // Populate the profile field within UserModel
        select: "profilePhoto", // Select only the profilePhoto from UserProfileModel
      },
    });

    if (!viewerDoc) {
      return res
        .status(404)
        .json({ success: false, message: "User not found in viewer data." });
    }

    const totalViewers = viewerDoc.viewers.length;

    res.status(200).json({
      success: true,
      totalViewers,
      viewers: viewerDoc.viewers, // Return the populated viewers array
    });
  } catch (error) {
    console.error("Error retrieving viewers:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};
