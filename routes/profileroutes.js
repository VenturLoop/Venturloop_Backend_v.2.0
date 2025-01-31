import express from "express";
import {
  // saveUserProfileDetails,
  getUserProfileDetails,
  updateUserProfileDetails,
  updateName,
  deleteEducation,
  deleteExperience,
  updateEducation,
  updateExperience,
  blockUser,
  unblockUser,
  reportUser,
  getReportedUsers,
  resolveReport,
  getAllBlockedUsers,
  deleteUserAccount,
  addEducation,
  addExperience,
  searchCompanyByName,
  getExperienceById,
  getAllExperiences,
  getAllEducationByUserId,
  getEducationById,
  addCompanyUrl,
  getCompaniesWithoutUrl,
  getAllCompanies,
  savePushToken,
  saveViewer,
  getViewers,
} from "../controllers/profileController.js";
import {
  getCoFoundersByUserId,
  getInvestorsByUserId,
  addCofounderSavedProfile,
  addInvestorSavedProfile,
  removeCoFounderProfile,
  removeInvestorProfile,
  getAllUsers,
  getUserCount,
  getCofoundersFeed,
  getUserSearchFeed,
} from "../controllers/getAllUserData.js";

const router = express.Router();

router.get("/user/:userId", getUserProfileDetails); // get user profile details by user id

router.put("/user/:userId", updateUserProfileDetails); // update user profile

router.put("/user/:userId/name", updateName); //edit Profile name

router.get("/users", getAllUsers); //admin only

router.get("/users/count", getUserCount); //admin only

router.post("/profiles/:userId/save/cofounder", addCofounderSavedProfile); // save co-founder profile

router.get("/search-user-feed", getUserSearchFeed); // new new

router.post("/profiles/:userId/save/investor", addInvestorSavedProfile); // save Investor profile

router.get("/profiles/:userId/cofounders", getCoFoundersByUserId); //get co-founders by user

router.get("/profiles/:userId/investors", getInvestorsByUserId); //get the invetstor

router.delete("/profiles/:userId/remove-cofounder", removeCoFounderProfile); // from Co-founder save

router.delete("/profiles/:userId/remove-investor", removeInvestorProfile); // from investor save

router.post("/block/:userId", blockUser);

router.delete("/unblock/:userId", unblockUser);

router.get("/blocked/:blockerId", getAllBlockedUsers);

router.post("/report/:userId", reportUser);

router.get("/reports", getReportedUsers);

router.put("/reports/:reportId", resolveReport);

router.get("/users/feed/:userId", getCofoundersFeed); //new

router.put("/delete/:userId", deleteUserAccount); //new

router.get("/search/company/:companyName", searchCompanyByName); // new

router.put("/company/:companyId/url", addCompanyUrl); // new

router.get("/companies/all", getAllCompanies); //new

router.get("/companies/without-url", getCompaniesWithoutUrl); // new

router.post("/user/:userId/education", addEducation); //new

router.put("/:userId/education/:educationId", updateEducation); // new

router.get("/:userId/education", getAllEducationByUserId); //new

router.get("/:userId/education/:educationId", getEducationById); //new

router.delete("/:userId/education/:educationId", deleteEducation); // new

router.post("/user/:userId/experience", addExperience); //new

router.put("/:userId/experience/:experienceId", updateExperience); // new

router.delete("/:userId/experience/:experienceId", deleteExperience); // new

router.get("/:userId/experience", getAllExperiences); // new

router.get("/:userId/experience/:experienceId", getExperienceById); //new

router.post("/save-push-token/:userId", savePushToken); //new

router.post("/save-viewer", saveViewer); //new

router.get("/get-viewers/:userId", getViewers); // new

export default router;
