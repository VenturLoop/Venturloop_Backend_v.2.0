import mongoose from "mongoose";

// Define the Company schema
const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // Company name
    companyUrl: { type: String}, // URL of the company logo
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Create the Company model based on the schema
const Company = mongoose.model("Company", companySchema);

export default Company;
