import express from "express";
import { createAdmion, loginAdmin } from "../controllers/admin.js";
import adminAuth from "../middlewaers/adminAuth.js";

const router = express.Router();

router.post("/register", createAdmion);

router.post("/login", loginAdmin);

router.get("/admin/dashboard", adminAuth, (req, res) => {
  res.json({ message: "Welcome to the admin dashboard" });
});

export default router;
