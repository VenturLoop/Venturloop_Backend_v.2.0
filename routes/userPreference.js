import express from "express";
import { getFilteredUsers } from "../controllers/UserProfilePreference.js";

const router = express.Router();

router.post("/filter-users", getFilteredUsers);

export default router;
