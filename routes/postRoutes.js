import express from "express";
import {
  createPost,
  applyForRole,
  deletePost,
  acceptApplyRole,
  declineApplyRole,
  getallPostComments,
  isPostSavedByUser,
  getPostDetails,
  getApplicantsByPost,
  getUserApplyRoles,
  updatePost,
  getFeedPosts,
  getPopularUsers,
  searchUsers,
  searchInvestors,
  searchPosts,
  getConnectedUserFeedPosts,
  getUserOtherPosts,
  getUserProjectPosts,
  deleteProjectPost,
  deleteOtherPosts,
  savePost,
  getSavedPostsByUserId,
  getSavedProjectsByUserId,
  applyForSkillSwap,
  deleteSkillSwapApplication,
  acceptSkillSwap,
  declineSkillSwap,
  fetchSkillSwapApplications,
  fetchSkillSwapPostsByUser,
  fetchSavedSkillSwapPosts,
  myskillSwapPost,
} from "../controllers/post.js";

const router = express.Router();

// Route to create a post (with userId in the params)
router.post("/posts/:userId", createPost);

// Route to get 10 random posts
// router.get("/random-posts", getAllPosts);

// Route to get all posts of a specific user by userId
// router.get("/user-posts/:userId", getUserPosts);  //changed

router.get("/user/:userId/projects", getUserProjectPosts); //new

router.get("/user/:userId/others", getUserOtherPosts); //new

// Route to get the latest 10 posts
// router.get("/latest-posts", getLatestPosts);

// router.get("/latest-ten-posts", getPaginatedPosts);

router.post("/apply-role", applyForRole);

router.get("/roles/:postId", getApplicantsByPost);

router.get("/user-apply-roles/:userId", getUserApplyRoles);

// router.post("/like", likePosts);

// router.post("/comment", commentPost);

// router.post("/save", savePost);

// router.get("/popular-posts", getPopularPost);

router.get("/posts/:postId", getPostDetails);

router.delete("/delete-post/:postId", deletePost);

// router.get("/saved/:userId", getSavePosts); // changed

router.put("/save-post/:userId/:postId", savePost); //new

router.get("/user/:userId/saved/projects", getSavedProjectsByUserId); // new

router.get("/user/:userId/saved/others", getSavedPostsByUserId);

router.put("/update/:postId", updatePost); // New

router.get("/feed", getFeedPosts); //new

router.get("/connected-user-feed/:userId", getConnectedUserFeedPosts); //new

router.get("/popular-users", getPopularUsers); // new
// GET http://localhost:5000/api/popular-users?page=1&limit=10

router.post("/accept-apply-role", acceptApplyRole);

router.post("/decline-apply-role", declineApplyRole);

router.get("/comments/:postId", getallPostComments);

// router.get("/total-comments/:postId", getTotalComments);

// router.get("/total-likes/:postId", getTotalLikes);

router.get("/is-user/:postId/saved/:userId", isPostSavedByUser);

router.get("/search/users", searchUsers); // new

router.get("/search/investors", searchInvestors); //new

router.get("/search/posts", searchPosts); //new

router.delete("/posts/:userId/:postId", deleteOtherPosts);

router.delete("/posts/project/:userId/:postId", deleteProjectPost); //new

router.post("/apply-skill-swap/:postId/:userId", applyForSkillSwap); // new  (in home)

router.delete("/delete-skill-swap/:postId/:userId", deleteSkillSwapApplication); //new (in manage post)

router.put("/accept-skill-swap/:postId/:userId", acceptSkillSwap); //new (in manage post)

router.delete("/decline-skill-swap/:postId/:userId", declineSkillSwap); //new  (in manage post)

router.get(
  "/get-skillSwap-Applications/:postId/:userId",
  fetchSkillSwapApplications
); //new   (in manage post)

router.get("/get-skillSwap-posts/:userId", fetchSkillSwapPostsByUser); //new  (in invite)

router.get("/get-saved-skillswap-posts/:userId", fetchSavedSkillSwapPosts); //new (in Bookmark)

router.get("/my-skillSwap/:userId", myskillSwapPost); //new  (in myprofile)

router.post("/:postId/vote/:pollOptionId", votePollOption); //new

router.get("/:postId/user-vote", getUserPollSelection); //new

export default router;
