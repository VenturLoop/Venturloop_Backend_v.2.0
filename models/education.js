import mongoose from "mongoose";

// Define the Education schema
const EducationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true, // Ensure userId is always provided
    },
    education: [
      {
        degree: { type: String }, // Degree or certification obtained
        institution: { type: String }, // Institution where the degree was obtained
        stream : { type: String }, // Institution where the degree was obtained
        currentlyStudying: { type: Boolean }, // Whether the user is still studying
        startDate: { type: String }, // Start date of the education
        endDate: { type: String }, // End date of the education (optional)
        description: { type: String }, // Additional description or details about the education
      },
    ],
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Create the Education model
const EducationModel = mongoose.model("Education", EducationSchema);

export default EducationModel;
