import UserModel from "../models/user.js";

export const getFilteredUsers = async (req, res) => {
  try {
    const {
      skillSet,
      industries,
      commitmentLevel,
      equityExpectation,
      priorStartupExperience,
      location,
      minAge, // Add minAge to the query
      maxAge, // Add maxAge to the query
    } = req.body;

    // Fetch all users
    const allUsers = await UserModel.find()
      .populate(
        "profile",
        "status profilePhoto birthday bio location skillSet industries priorStartupExperience commitmentLevel equityExpectation"
      )
      .select("-password -__v"); // Exclude password and version from the response

    if (!allUsers || allUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }

    // Arrays to categorize the users
    let fullMatches = [];
    let partialMatches = [];
    let noMatches = [];

    // Filter users based on the provided criteria
    allUsers.forEach((user) => {
      const userProfile = user.profile;

      // Ensure userProfile exists before accessing its properties
      if (!userProfile) {
        return; // Skip this user if profile is undefined
      }

      // Check for skillSet match
      const skillSetMatch =
        skillSet && skillSet.length > 0
          ? userProfile.skillSet.some((skill) => skillSet.includes(skill))
          : true;

      // Check for industries match
      const industriesMatch =
        industries && industries.length > 0
          ? userProfile.industries.some((industry) =>
              industries.includes(industry)
            )
          : true;

      // Check for commitmentLevel match
      const commitmentLevelMatch = commitmentLevel
        ? userProfile.commitmentLevel === commitmentLevel
        : true;

      // Check for equityExpectation match
      const equityExpectationMatch = equityExpectation
        ? userProfile.equityExpectation === equityExpectation
        : true;

      // Check for priorStartupExperience match
      const priorStartupExperienceMatch = priorStartupExperience
        ? userProfile.priorStartupExperience === priorStartupExperience
        : true;

      // Check for location match
      const locationMatch = location ? userProfile.location === location : true;

      // Calculate the age from birthday and filter based on age range
      const birthDate = new Date(userProfile.birthday);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const ageMatch =
        (minAge ? age >= minAge : true) && (maxAge ? age <= maxAge : true);

      // Categorize users into exact, partial, or no match
      if (
        skillSetMatch &&
        industriesMatch &&
        commitmentLevelMatch &&
        equityExpectationMatch &&
        priorStartupExperienceMatch &&
        locationMatch &&
        ageMatch
      ) {
        fullMatches.push(user); // All filters match
      } else if (
        skillSetMatch ||
        industriesMatch ||
        commitmentLevelMatch ||
        equityExpectationMatch ||
        priorStartupExperienceMatch ||
        locationMatch ||
        ageMatch
      ) {
        partialMatches.push(user); // Some filters match
      } else {
        noMatches.push(user); // No filters match
      }
    });

    // Combine the results with full matches first, then partial, then no matches
    const sortedResults = [...fullMatches, ...partialMatches, ...noMatches];

    // Return the structured response
    res.status(200).json({
      success: true,
      message: "Filtered users retrieved successfully.",
      users: sortedResults, // Return the sorted list of users
    });
  } catch (error) {
    console.error("Error filtering users:", error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error}`,
    });
  }
};
