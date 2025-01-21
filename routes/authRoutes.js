import express from "express";
import {
  SignupEmailVerification,
  VerifyOTP,
  Signup,
  Login,
  ResendOtp,
  ForgotPassword,
  ConfirmPassword,
  deleteUserAndProfile,
  saveUserProfileDetails,
} from "../controllers/auth.js";

const router = express.Router();

// POST route for user signup
router.post("/signup", Signup);

// POST route for user login
router.post("/login", Login);

// POST route to send OTP for email verification
router.post("/send-otp", VerifyOTP);

// POST route to verify email with the OTP
router.post("/verify-email", SignupEmailVerification);

router.post("/resend", ResendOtp);

router.post("/forgot", ForgotPassword);

router.post("/confirm", ConfirmPassword);
router.delete("/delete", deleteUserAndProfile);
router.post("/user/:userId", saveUserProfileDetails);

export default router;
