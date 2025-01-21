import mongoose from "mongoose";

const investorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    website: { type: String, required: true },
    image: { type: String, required: true },
    portfolioCompanies: [
      {
        name: { type: String, required: true },
        logo: { type: String, required: true },
        link: { type: String, required: true },
      },
    ],
    description: { type: String, required: true },
    geography: { type: String, required: true }, 
    investmentStages: { type: String },
    businessModel: { type: [String] },
    investorType: { type: String }, 
    sectorInterested: { type: [String] },
    checkSize: { type: String },
    headquarter: { type: String },
    contactLink: { type: String, required: true },
  },
  { timestamps: true }
);

const Investor = mongoose.model("Investor", investorSchema);
export default Investor;
