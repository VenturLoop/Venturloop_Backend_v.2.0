import bcrypt from "bcrypt";
import UserModel from "../models/user.js";
import { SendVerificationCode } from "../middlewaers/Email.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import UserProfileModel from "../models/userProfile.js";
import axios from "axios";

dotenv.config();

export const SignupEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists. Please login.",
      });
    }

    // Generate and send OTP
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    console.log("Generated OTP:", verificationCode);

    try {
      await SendVerificationCode(email, verificationCode);
      console.log("OTP sent to email:", email);
    } catch (emailError) {
      console.error("Error sending OTP email:", emailError);
      return res.status(500).json({
        success: false,
        message: "Error sending verification email.",
      });
    }

    // Save OTP and email to the database
    const user = new UserModel({
      email,
      verificationCode, // Save the OTP
      isVerified: false, // Mark as not verified
    });

    try {
      await user.save();
      console.log("User saved with OTP:", email);
    } catch (saveError) {
      console.error("Error saving user to database:", saveError);
      return res.status(500).json({
        success: false,
        message: "Error saving user to database.",
      });
    }

    // Respond with success
    return res.status(200).json({
      success: true,
      message: "OTP sent to email. Please verify your email.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const VerifyOTP = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    // Validate input
    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    // Find user by email and OTP
    const user = await UserModel.findOne({ email, verificationCode });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or email.",
      });
    }

    // Mark email as verified
    user.isVerified = true;
    user.verificationCode = undefined; // Clear the OTP

    try {
      await user.save();
      console.log("User email verified:", email);
    } catch (saveError) {
      console.error("Error updating verification status:", saveError);
      return res.status(500).json({
        success: false,
        message: "Error updating verification status.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Email verified successfully. You can now complete the signup process.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const Signup = async (req, res) => {
  try {
    const { email, name, password, location, birthday } = req.body;

    // Validate input
    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, name, and password are required.",
      });
    }

    // Check if user exists
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email verification required. Please verify your email first.",
      });
    }

    // Check if user is already verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Email is not verified. Please verify your email first.",
      });
    }

    // Check if user is already signed up
    if (user.password) {
      return res.status(400).json({
        success: false,
        message: "User already signed up. Please login instead.",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user with the final details
    user.name = name;
    user.password = hashedPassword;

    // Create a UserProfile document
    let userProfile;
    try {
      userProfile = new UserProfileModel({
        location,
        birthday,
      });
      await userProfile.save();
      console.log("UserProfile created successfully:", userProfile);
    } catch (error) {
      console.error("Error creating user profile:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating user profile.",
      });
    }

    // Link the UserProfile to the User
    user.profile = userProfile._id;

    try {
      await user.save();
      console.log("User signed up successfully:", email);
    } catch (error) {
      console.error("Error saving user to database:", error);
      return res.status(500).json({
        success: false,
        message: "Error saving user to database.",
      });
    }

    // Generate JWT token after successful signup
    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(201).json({
      success: true,
      message: "Signup successful. You can now log in.",
      jwtToken,
      user: {
        name: user.name,
        email: user.email,
        profile: user.profile,
        id: user._id, // Include profile reference
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Check if user exists
    const user = await UserModel.findOne({ email });
    const errorMsg = "Authentication failed: Incorrect email or password.";

    if (!user) {
      return res.status(403).json({
        success: false,
        message: errorMsg,
      });
    }

    // Ensure the email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Your email is not verified. Please verify your email before logging in.",
      });
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(403).json({
        success: false,
        message: errorMsg,
      });
    }

    // Check for environment variable
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set.");
      return res.status(500).json({
        success: false,
        message: "Server configuration error. Please try again later.",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Respond with success and token
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        name: user.name,
        email: user.email,
        id: user._id,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const ResendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    // Check if the user exists
    const existingUser = await UserModel.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please sign up first.",
      });
    }

    // Generate a new OTP
    const newVerificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    console.log("Generated new OTP:", newVerificationCode);

    // Send the new OTP
    try {
      await SendVerificationCode(email, newVerificationCode);
      console.log("New OTP sent to email:", email);
    } catch (emailError) {
      console.error("Error sending OTP email:", emailError);
      return res.status(500).json({
        success: false,
        message: "Error sending verification email.",
      });
    }

    // Update the user's OTP in the database
    try {
      existingUser.verificationCode = newVerificationCode; // Update OTP
      await existingUser.save();
      console.log("Updated user with new OTP:", email);
    } catch (updateError) {
      console.error("Error updating user with new OTP:", updateError);
      return res.status(500).json({
        success: false,
        message: "Error updating OTP in database.",
      });
    }

    // Respond with success
    return res.status(200).json({
      success: true,
      message: "New OTP sent to your email. Please verify your email.",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const ForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP for password reset:", otp);

    // Save OTP in the database
    user.verificationCode = otp;
    await user.save();

    // Send OTP to user's email
    try {
      await SendVerificationCode(email, otp);
      console.log("Password reset OTP sent to email:", email);
    } catch (error) {
      console.error("Error sending OTP email:", error);
      return res.status(500).json({
        success: false,
        message: "Error sending OTP email.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email. Use it to reset your password.",
    });
  } catch (error) {
    console.error("Forgot Password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const ConfirmPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Validate input
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, new password, and confirm password are required.",
      });
    }

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is not verified. Please verify your email first.",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    user.password = hashedPassword;

    try {
      await user.save();
      console.log("Password updated for user:", email);
    } catch (saveError) {
      console.error("Error updating password:", saveError);
      return res.status(500).json({
        success: false,
        message: "Error updating password.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Confirm Password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteUserAndProfile = async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from request parameters

    // Check if the user exists
    const user = await UserModel.findById(userId).populate("profile");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check if the user has a profile
    if (user.profile) {
      // Delete the user's profile first
      await UserProfileModel.findByIdAndDelete(user.profile._id);
    }

    // Delete the user
    await UserModel.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "User and profile deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting user and profile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const saveUserProfileDetails = async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from request parameters
    const {
      skillSet,
      industries,
      priorStartupExperience,
      commitmentLevel,
      equityExpectation,
      status,
    } = req.body; // Extract profile details from request body

    // Check if the user exists
    const user = await UserModel.findById(userId).populate("profile");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check if the user has a profile
    if (!user.profile) {
      // If no profile exists, create a new profile
      const newProfile = new UserProfileModel({
        skillSet,
        industries,
        priorStartupExperience,
        commitmentLevel,
        equityExpectation,
        status,
      });

      // Save the new profile and link it to the user
      await newProfile.save();
      user.profile = newProfile._id;
      await user.save();

      return res.status(201).json({
        success: true,
        message: "Profile created successfully.",
        profile: newProfile,
      });
    }

    // If a profile exists, update it
    const userProfile = user.profile;
    userProfile.skillSet = skillSet || userProfile.skillSet;
    userProfile.industries = industries || userProfile.industries;
    userProfile.priorStartupExperience =
      priorStartupExperience ?? userProfile.priorStartupExperience;
    userProfile.commitmentLevel =
      commitmentLevel || userProfile.commitmentLevel;
    userProfile.equityExpectation =
      equityExpectation || userProfile.equityExpectation;
    userProfile.status = status || userProfile.status;

    // Save the updated profile
    await userProfile.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      profile: userProfile,
    });
  } catch (error) {
    console.error("Error saving user profile details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Controller for LinkedIn OAuth callback
export const LinkedInCallback = async (req, res) => {
  try {
    const { code } = req.query; // LinkedIn sends the authorization code via query string

    // Check if the code is provided
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is missing.",
      });
    }

    // Step 1: Exchange the authorization code for an access token
    const accessTokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI, // Make sure this matches your callback URL in LinkedIn app settings
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        },
      }
    );

    const accessToken = accessTokenResponse.data.access_token;

    // Step 2: Fetch user profile details using the access token
    const userProfileResponse = await axios.get(
      "https://api.linkedin.com/v2/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userEmailResponse = await axios.get(
      "https://api.linkedin.com/v2/emailAddress",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Get user profile data
    const userProfile = userProfileResponse.data;
    const userEmail = userEmailResponse.data.elements[0].handle.emailAddress;

    // Step 3: Check if the user already exists in the database
    let user = await UserModel.findOne({ email: userEmail });

    if (!user) {
      // If user doesn't exist, create a new user
      user = new UserModel({
        email: userEmail,
        name:
          userProfile.localizedFirstName + " " + userProfile.localizedLastName,
        isVerified: true, // You can set this to true or false depending on your logic
      });

      // Create a UserProfile document
      const userProfileDoc = new UserProfileModel({
        location: userProfile.location
          ? userProfile.location.name
          : "Not Available",
        birthday: "Not Available", // LinkedIn doesn't provide birthday by default
      });

      // Save UserProfile to the database
      await userProfileDoc.save();
      user.profile = userProfileDoc._id;

      // Save the new user to the database
      await user.save();
    }

    // Step 4: Generate a JWT token
    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Step 5: Send the user details and JWT token in the response
    return res.status(200).json({
      success: true,
      message: "LinkedIn login successful.",
      jwtToken,
      user: {
        name: user.name,
        email: user.email,
        profile: user.profile,
        id: user._id,
      },
    });
  } catch (error) {
    console.error("LinkedIn OAuth error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
