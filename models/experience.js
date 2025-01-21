import mongoose from "mongoose";

// Define the Experience schema
const ExperienceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true, // Ensure userId is always provided
    },
    experiences: [
      {
        title: { type: String }, // Job title or role
        company: { type: String }, // Company or organization name
        startDate: { type: String }, // Start date of the experience
        endDate: { type: String }, // End date of the experience (optional)
        description: { type: String }, // Description of the role and responsibilities
        companyPhoto: { type: String}, // URL or file upload for the company photo
      },
    ],
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Create the Experience model
const ExperienceModel = mongoose.model("Experience", ExperienceSchema);

export default ExperienceModel;
