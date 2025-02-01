import Investor from "../models/investor.js";

export const uploadInvestorProfile = async (req, res) => {
  try {
    const {
      name,
      website,
      image,
      portfolioCompanies,
      description,
      geography,
      investmentStages,
      businessModel,
      investorType,
      sectorInterested,
      checkSize,
      headquarter,
      contactLink,
    } = req.body;

    // Required fields validation
    const requiredFields = {
      name,
      website,
      image,
      description,
      geography,
      contactLink,
    };

    const missingFields = Object.keys(requiredFields).filter(
      (field) => !requiredFields[field]
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Parse portfolioCompanies if provided
    let parsedPortfolioCompanies = [];
    if (portfolioCompanies) {
      try {
        parsedPortfolioCompanies =
          typeof portfolioCompanies === "string"
            ? JSON.parse(portfolioCompanies)
            : portfolioCompanies;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid format for portfolioCompanies. It should be a valid JSON string or array.",
        });
      }
    }

    // Create a new investor document
    const newInvestor = new Investor({
      name,
      website,
      image,
      portfolioCompanies: parsedPortfolioCompanies,
      description,
      geography,
      investmentStages,
      businessModel,
      investorType,
      sectorInterested,
      checkSize,
      headquarter,
      contactLink,
    });

    // Save to the database
    await newInvestor.save();

    return res.status(201).json({
      success: true,
      message: "Investor profile uploaded successfully.",
      investor: newInvestor,
    });
  } catch (error) {
    console.error("Error uploading investor profile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

// controllers/investorController.js
export const getInvestorProfile = async (req, res) => {
  try {
    const { id } = req.params; // Extracting the investor ID from the URL params

    // Fetch the investor profile by ID using the Investor model
    const investor = await Investor.findById(id); // Ensure you're using the correct model (Investor)

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: "Investor not found",
      });
    }

    // Respond with the investor profile
    return res.status(200).json({
      success: true,
      investor, // Return the investor profile data
    });
  } catch (error) {
    console.error("Error fetching investor profile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// controllers/investorController.js
export const getAllInvestors = async (req, res) => {
  try {
    const { page = 1 } = req.query; // Get page number from query, default is 1
    const limit = 12; // Limit 12 investors per request
    const skip = (page - 1) * limit; // Calculate skip value

    // Fetch 12 investors with pagination
    const investors = await Investor.find().skip(skip).limit(limit);

    if (!investors || investors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No investors found",
      });
    }
 
    return res.status(200).json({
      success: true,
      message: "Investors fetched successfully.",
      data: investors,
      hasMore: investors.length === limit, // Check if more investors are available
    });
  } catch (error) {
    console.error("Error fetching investors:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllInvestorInSearch = async (req, res) => {
  try {
    const { page = 1 } = req.query; // Get page number from query, default is 1
    const limit = 12; // Limit 12 investors per request
    const skip = (page - 1) * limit; // Calculate skip value

    // Fetch 12 investors with only name, image, and investorType
    const investors = await Investor.find()
      .select("name image investorType")
      .skip(skip)
      .limit(limit);

    if (!investors || investors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No investors found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Investors fetched successfully.",
      data: investors,
      hasMore: investors.length === limit, // Check if more investors are available
    });
  } catch (error) {
    console.error("Error fetching investors:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// controllers/investorController.js
export const updateInvestorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      website,
      portfolioCompanies,
      description,
      geography,
      investmentStages,
      businessModel,
      investorType,
      sectorInterested,
      checkSize,
      headquarter,
      contactLink,
    } = req.body;

    // Find the investor by ID
    const investor = await Investor.findById(id);
    if (!investor) {
      return res.status(404).json({
        success: false,
        message: "Investor not found",
      });
    }

    // Update the investor profile with new data
    investor.name = name;
    investor.website = website;

    // Only parse portfolioCompanies if it's a string
    if (portfolioCompanies && typeof portfolioCompanies === "string") {
      investor.portfolioCompanies = JSON.parse(portfolioCompanies);
    } else if (portfolioCompanies && Array.isArray(portfolioCompanies)) {
      investor.portfolioCompanies = portfolioCompanies;
    }

    investor.description = description;
    investor.geography = geography;
    investor.investmentStages = investmentStages;
    investor.businessModel = businessModel;
    investor.investorType = investorType;
    investor.sectorInterested = sectorInterested;
    investor.checkSize = checkSize;
    investor.headquarter = headquarter;
    investor.contactLink = contactLink;

    // If image is uploaded, update the image path
    if (req.file) {
      investor.image = req.file.path;
    }

    // Save the updated investor profile
    await investor.save();

    return res.status(200).json({
      success: true,
      message: "Investor profile updated successfully",
      investor,
    });
  } catch (error) {
    console.error("Error updating investor profile:", error);
    return res.status(500).json({
      success: false,
      message: `Internal server error : ${error}`,
    });
  }
};

// controllers/investorController.js
export const deleteInvestorProfile = async (req, res) => {
  const { id } = req.params;

  try {
    // Find and delete the investor profile by ID
    const investor = await Investor.findByIdAndDelete(id);

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: "Investor not found or already deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Investor profile deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting investor profile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Could not delete investor profile.",
    });
  }
};

// Function to filter investors

export const filterInvestors = async (req, res) => {
  try {
    const {
      geography,
      investmentStages,
      businessModel,
      investorType,
      sectorInterested,
      checkSize,
      headquarter,
    } = req.body;

    // Build query filters dynamically
    const filters = {};
    if (geography?.length) filters.geography = { $in: geography };
    if (investmentStages?.length)
      filters.investmentStages = { $in: investmentStages };
    if (businessModel?.length) filters.businessModel = { $in: businessModel };
    if (investorType?.length) filters.investorType = { $in: investorType };
    if (sectorInterested?.length)
      filters.sectorInterested = { $in: sectorInterested };
    if (checkSize?.length) filters.checkSize = { $in: checkSize };
    if (headquarter?.length) filters.headquarter = { $in: headquarter };

    // Fetch all investors from the database
    const allInvestors = await Investor.find();

    if (!allInvestors.length) {
      return res.status(404).json({
        success: false,
        message: "No investors found",
      });
    }

    // Categorize investors based on match level
    const fullMatches = [];
    const partialMatches = [];
    const noMatches = [];

    allInvestors.forEach((investor) => {
      const investorData = investor.toObject();
      let matchCount = 0;
      const totalCriteria = Object.keys(filters).length;

      Object.keys(filters).forEach((key) => {
        if (Array.isArray(filters[key].$in)) {
          if (
            filters[key].$in.some((value) => investorData[key]?.includes(value))
          ) {
            matchCount++;
          }
        } else if (filters[key].$in === investorData[key]) {
          matchCount++;
        }
      });

      if (matchCount === totalCriteria) {
        fullMatches.push(investor);
      } else if (matchCount > 0) {
        partialMatches.push(investor);
      } else {
        noMatches.push(investor);
      }
    });

    const sortedResults = [...fullMatches, ...partialMatches, ...noMatches];

    res.status(200).json({
      success: true,
      message: "Filtered investors retrieved successfully.",
      investors: sortedResults,
    });
  } catch (error) {
    console.error("Error filtering investors:", error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

// Function to get total investor count
export const getInvestorCount = async (req, res) => {
  try {
    const count = await Investor.countDocuments();
    return res.status(200).json({
      success: true,
      message: "Total investor count retrieved successfully.",
      count,
    });
  } catch (error) {
    console.error("Error getting investor count:", error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error}`,
    });
  }
};
