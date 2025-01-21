import express from "express";
import {
  uploadInvestorProfile,
  getInvestorProfile,
  updateInvestorProfile,
  deleteInvestorProfile,
  getAllInvestors,
  filterInvestors,
  getInvestorCount,
} from "../controllers/investor.js";

const router = express.Router();

router.post("/create-investor", uploadInvestorProfile);

router.get("/get-investor/:id", getInvestorProfile);

router.get("/get-investors", getAllInvestors);

router.put("/update-investor/:id", updateInvestorProfile);

router.delete("/delete-investor/:id", deleteInvestorProfile);

router.post("/filter-investors", filterInvestors);

router.get("/investor-count", getInvestorCount); // Route to get total investor count

export default router;
