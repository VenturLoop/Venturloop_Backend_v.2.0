import express from "express";
import {
  uploadInvestorProfile,
  getInvestorProfile,
  updateInvestorProfile,
  deleteInvestorProfile,
  getAllInvestors,
  filterInvestors,
  getInvestorCount,
  getAllInvestorInSearch,
  getAllInvestorsForAdmin,
} from "../controllers/investor.js";

const router = express.Router();

router.post("/create-investor", uploadInvestorProfile);

router.get("/get-investor/:id", getInvestorProfile);

router.get("/get-investors/:userId", getAllInvestors);

router.get("/get-investors-from-admin", getAllInvestorsForAdmin);

router.put("/update-investor/:id", updateInvestorProfile);

router.delete("/delete-investor/:id", deleteInvestorProfile);

router.post("/filter-investors", filterInvestors);

router.get("/search-investors", getAllInvestorInSearch);

router.get("/investor-count", getInvestorCount); // Route to get total investor count

export default router;
