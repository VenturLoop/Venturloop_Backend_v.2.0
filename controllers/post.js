import ConnectedUsers from "../models/connectedUsers.js";
import Investor from "../models/investor.js";
import Post from "../models/post.js";
import UserModel from "../models/user.js";

export const createPost = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from the route parameters
    const {
      title,
      description,
      openRoles,
      teamMates,
      websiteLink,
      category,
      startupStage,
      startupDetails,
      problemStatement,
      marketDescription,
      competition,
      postType,
      videoUrl,
      polls,
      offeredSkills,
      requiredSkills, // For skillSwap
    } = req.body;

    // Validate required fields
    if (!userId || !description || !postType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, description, or postType.",
      });
    }

    let newPostData = { userData: userId, postType, description }; // Base structure

    // Handle different post types
    if (postType === "project") {
      newPostData = {
        ...newPostData,
        title,
        openRoles,
        teamMates,
        websiteLink,
        category,
        startupStage,
        startupDetails,
        problemStatement,
        marketDescription,
        competition,
      };
    } else if (postType === "poles") {
      newPostData.polls = polls || [];
    } else if (postType === "youtubeUrl") {
      newPostData.videoUrl = videoUrl || "";
    } else if (postType === "skillSwap") {
      // Validate skillSwap specific fields
      if (!offeredSkills || !requiredSkills) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields for skillSwap: offeredSkills or requiredSkills.",
        });
      }

      newPostData.skillSwap = {
        offeredSkills,
        requiredSkills,
      };

      newPostData.applyUsersOnSkillSwap = []; // Initialize the array for skill swap applicants
    }

    // Create new post
    const newPost = new Post(newPostData);

    // Save post to the database
    const savedPost = await newPost.save();

    // Update user's posts array with the new post ID
    await UserModel.findByIdAndUpdate(
      userId,
      { $push: { posts: { postId: savedPost._id, createdAt: new Date() } } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Post created successfully.",
      post: savedPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      success: false,
      message: `0Server error. Unable to create post.${error}`,
    });
  }
};

export const getUserProjectPosts = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from route parameters

    const userProjectPosts = await Post.find({
      userData: userId,
      postType: "project",
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "userData",
        select: "name profile", // Select sender's name, status, and profile reference
        populate: {
          path: "profile", // Nested populate for profile details
          select: "profilePhoto", // Fetch only profilePhoto and status
        },
      }); // Sort by latest

    res.status(200).json({ success: true, posts: userProjectPosts });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user project posts." });
  }
};

export const getUserOtherPosts = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from route parameters

    const userOtherPosts = await Post.find({
      userData: userId,
      postType: { $in: ["posts", "poles", "youtubeUrl"] },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "userData",
        select: "name profile", // Select sender's name, status, and profile reference
        populate: {
          path: "profile", // Nested populate for profile details
          select: "profilePhoto", // Fetch only profilePhoto and status
        },
      }); // Sort by latest

    res.status(200).json({ success: true, posts: userOtherPosts });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user other posts." });
  }
};

export const getPostDetails = async (req, res) => {
  try {
    const { postId } = req.params; // Get postId from route parameters

    const postDetails = await Post.findById(postId)
      .sort({ createdAt: -1 })
      .populate({
        path: "userData",
        select: "name profile", // Select sender's name, status, and profile reference
        populate: {
          path: "profile", // Nested populate for profile details
          select: "profilePhoto", // Fetch only profilePhoto and status
        },
      }); // Sort by latest

    if (!postDetails) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    res.status(200).json({
      success: true,
      post: postDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch post details.",
    });
  }
};

// Function to get paginated posts
// Function to get feed posts with infinite scroll and new posts at the top
export const getFeedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default to fetching 10 posts per request
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Calculate the total number of posts
    const totalPosts = await Post.countDocuments(); // Total count of posts in the DB

    // Fetch the latest posts and the newest 5 posts at once
    const posts = await Post.find()
      .sort({ createdAt: -1 }) // Sort by latest posts first
      .skip((pageNum - 1) * limitNum) // Pagination
      .limit(limitNum)
      .populate({
        path: "userData",
        select: "name profile", // Select sender's name, status, and profile reference
        populate: {
          path: "profile", // Nested populate for profile details
          select: "profilePhoto", // Fetch only profilePhoto and status
        },
      });

    // Check if there are more posts to load
    const hasMore = pageNum * limitNum < totalPosts;

    // Fetch the 5 newest posts to show on top of the feed
    const newPosts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: "userData",
        select: "name profile", // Select sender's name, status, and profile reference
        populate: {
          path: "profile", // Nested populate for profile details
          select: "profilePhoto", // Fetch only profilePhoto and status
        },
      });

    res.status(200).json({
      success: true,
      posts: {
        feed: posts,
        newPosts: newPosts, // New posts to be displayed at the top
      },
      page: pageNum,
      totalPosts, // Return the total count of posts for the client to use in pagination
      hasMore, // Indicate whether there are more posts to load
    });
  } catch (error) {
    console.error("Error fetching feed posts:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch posts." });
  }
};

export const getAllProjectInSearch = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default to fetching 10 posts per request
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Calculate skip value based on the page and limit
    const skip = (pageNum - 1) * limitNum;

    // Fetch total number of posts and the posts themselves
    const [totalPosts, posts] = await Promise.all([
      Post.countDocuments(), // Count of total posts in the DB
      Post.find({ postType: "project" })
        .sort({ createdAt: -1 }) // Sort by latest posts first
        .skip(skip) // Pagination
        .limit(limitNum) // Fetch only the number of posts based on the limit
        .populate({
          path: "userData",
          select: "name profile", // Select sender's name & profile reference
          populate: {
            path: "profile",
            select: "profilePhoto", // Fetch only profilePhoto and status
          },
        }),
    ]);

    // Determine if more posts are available for pagination
    const hasMore = pageNum * limitNum < totalPosts;

    return res.status(200).json({
      success: true,
      message: "Projects fetched successfully.",
      data: posts,
      hasMore, // More posts available if true
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllPostInSearch = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default to fetching 10 posts per request
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Calculate skip value based on the page and limit
    const skip = (pageNum - 1) * limitNum;

    // Fetch total number of posts and the posts themselves
    const [totalPosts, posts] = await Promise.all([
      Post.countDocuments(), // Count of total posts in the DB
      Post.find({ postType: { $in: ["post", "poles", "youtubeUrl"] } })
        .sort({ createdAt: -1 }) // Sort by latest posts first
        .skip(skip) // Pagination
        .limit(limitNum) // Fetch only the number of posts based on the limit
        .populate({
          path: "userData",
          select: "name profile", // Select sender's name & profile reference
          populate: {
            path: "profile",
            select: "profilePhoto", // Fetch only profilePhoto and status
          },
        }),
    ]);

    // Determine if more posts are available for pagination
    const hasMore = pageNum * limitNum < totalPosts;

    return res.status(200).json({
      success: true,
      message: "Posts fetched successfully.",
      data: posts,
      hasMore, // More posts available if true
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllSkillSwapInSearch = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default to fetching 10 posts per request
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Calculate skip value based on the page and limit
    const skip = (pageNum - 1) * limitNum;

    // Fetch total number of posts and the posts themselves
    const [totalPosts, posts] = await Promise.all([
      Post.countDocuments(), // Count of total posts in the DB
      Post.find({ postType: "skillSwap" })
        .sort({ createdAt: -1 }) // Sort by latest posts first
        .skip(skip) // Pagination
        .limit(limitNum) // Fetch only the number of posts based on the limit
        .populate({
          path: "userData",
          select: "name profile", // Select sender's name & profile reference
          populate: {
            path: "profile",
            select: "profilePhoto", // Fetch only profilePhoto and status
          },
        }),
    ]);

    // Determine if more posts are available for pagination
    const hasMore = pageNum * limitNum < totalPosts;

    return res.status(200).json({
      success: true,
      message: "SkillSwap fetched successfully.",
      data: posts,
      hasMore, // More posts available if true
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const searchController = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const regex = new RegExp(query, "i");

    // Search Users with transformed data
    const users = await UserModel.find({ name: { $regex: regex } })
      .populate({
        path: "profile",
        select: "status profilePhoto",
        match: {
          status: { $exists: true, $ne: null },
          profilePhoto: { $exists: true, $ne: null },
        },
      })
      .select("_id name")
      .lean();

    const transformedUsers = users.map((user) => ({
      _id: user._id,
      name: user.name,
      profilePhoto: user.profile?.profilePhoto || null,
      status: user.profile?.status || null,
    }));

    // Search Investors by name or investorType
    const investors = await Investor.find({
      $or: [{ name: { $regex: regex } }, { investorType: { $regex: regex } }],
    }).select("name image investorType");

    // Search Projects by title
    const projects = await Post.find({
      postType: "project",
      title: { $regex: regex },
    })
      .sort({ createdAt: -1 }) // Sort by latest posts first
      .populate({
        path: "userData",
        select: "name profile", // Select sender's name & profile reference
        populate: {
          path: "profile",
          select: "profilePhoto", // Fetch only profilePhoto and status
        },
      });

    // Search Posts of type "posts", "polls", "youtubeUrl" by description
    const posts = await Post.find({
      postType: { $in: ["posts", "polls", "youtubeUrl"] },
      description: { $regex: regex },
    })
      .sort({ createdAt: -1 }) // Sort by latest posts first
      .populate({
        path: "userData",
        select: "name profile", // Select sender's name & profile reference
        populate: {
          path: "profile",
          select: "profilePhoto", // Fetch only profilePhoto and status
        },
      });

    // Search SkillSwaps by title
    const skillSwapsByTitle = await Post.find({
      postType: "skillSwap",
      title: { $regex: regex },
    })
      .sort({ createdAt: -1 }) // Sort by latest posts first
      .populate({
        path: "userData",
        select: "name profile", // Select sender's name & profile reference
        populate: {
          path: "profile",
          select: "profilePhoto", // Fetch only profilePhoto and status
        },
      });

    // Search SkillSwaps by offered and required skills
    const skillSwapsBySkills = await Post.find({
      postType: "skillSwap",
      $or: [
        { "skillSwap.offeredSkills": { $elemMatch: { $regex: regex } } },
        { "skillSwap.requiredSkills": { $elemMatch: { $regex: regex } } },
      ],
    })
      .sort({ createdAt: -1 }) // Sort by latest posts first
      .populate({
        path: "userData",
        select: "name profile", // Select sender's name & profile reference
        populate: {
          path: "profile",
          select: "profilePhoto", // Fetch only profilePhoto and status
        },
      });

    // Combine skillSwap results
    const skillSwaps = [...skillSwapsByTitle, ...skillSwapsBySkills];

    return res.status(200).json({
      users: transformedUsers, // Returning transformed user data
      investors,
      projects,
      posts,
      skillSwaps,
    });
  } catch (error) {
    console.error("Search Error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Apply for a Role
export const applyForRole = async (req, res) => {
  const { postId, userId, role, whyJoin, expertise } = req.body;

  try {
    // Find the post where the user is applying
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    // Check if the user has already applied for this role
    const existingApplication = post.appliedUsers.find(
      (application) =>
        application.applicant.toString() === userId && application.role === role
    );

    if (existingApplication) {
      if (existingApplication.status === "Pending") {
        return res.status(400).json({
          success: false,
          message: "You already have a pending application for this role.",
        });
      }
    }

    // Add new application to the appliedUsers array
    post.appliedUsers.push({
      applicant: userId,
      role,
      whyJoin,
      expertise,
      status: "Pending", // Default status is "Pending"
    });

    // Save the post with the new application
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Application submitted successfully.",
      post,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Roles Applied by a User
export const getUserApplyRoles = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find posts where the user has applied for roles
    const posts = await Post.find({
      "appliedUsers.applicant": userId,
    }).populate("appliedUsers.applicant");

    if (!posts || posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No posts found for this user.",
      });
    }

    // Filter the applied users based on the userId to return only the relevant applications
    const userApplications = posts.map((post) => {
      return post.appliedUsers.filter(
        (application) => application.applicant._id.toString() === userId
      );
    });

    return res.status(200).json({
      success: true,
      message: "Roles fetched successfully.",
      applications: userApplications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getApplicantsByPost = async (req, res) => {
  const { postId } = req.params;

  try {
    // Find the post by ID and populate the appliedUsers array
    const post = await Post.findById(postId).populate({
      path: "appliedUsers.applicant", // Populate the applicant field in the appliedUsers array
      select: "name profile", // Select the name and profile fields from the User model
      populate: {
        path: "profile", // Populate the profile field within User
        select: "profilePhoto", // Select only the profilePhoto from UserProfile
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    // Extract the appliedUsers from the post
    const applicants = post.appliedUsers;

    if (!applicants || applicants.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No applicants found for this post.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Applicants fetched successfully.",
      applicants,
    });
  } catch (error) {
    console.error("Error fetching applicants:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

// Update specific fields of a post
export const updatePost = async (req, res) => {
  const { postId } = req.params; // Get the post ID from params
  const {
    title,
    description,
    openRoles,
    teamMates,
    websiteLink,
    category,
    startupStage,
    startupDetails,
    problemStatement,
    marketDescription,
    competition,
  } = req.body;

  try {
    // Find the post by ID
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    // Only update the allowed fields
    post.title = title || post.title;
    post.description = description || post.description;
    post.openRoles = openRoles || post.openRoles;
    post.teamMates = teamMates || post.teamMates;
    post.websiteLink = websiteLink || post.websiteLink;
    post.category = category || post.category;
    post.startupStage = startupStage || post.startupStage;
    post.startupDetails = startupDetails || post.startupDetails;
    post.problemStatement = problemStatement || post.problemStatement;
    post.marketDescription = marketDescription || post.marketDescription;
    post.competition = competition || post.competition;

    // Save the updated post
    const updatedPost = await post.save();

    return res.status(200).json({
      success: true,
      message: "Post updated successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error. Unable to update the post.",
    });
  }
};

export const isPostSavedByUser = async (req, res) => {
  const { postId, userId } = req.params;

  try {
    const save = await Post.findOne({ post: postId, userData: userId });
    const isSaved = !!save;

    res.status(200).json({ saved: isSaved });
  } catch (error) {
    console.error("Error checking if post is saved:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deletePost = async (req, res) => {
  const { postId } = req.params;

  try {
    // Validate the postId format
    if (!postId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Post ID format.",
      });
    }

    // Find and delete the post
    const deletedPost = await Post.findByIdAndDelete(postId);

    if (!deletedPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found. It may have already been deleted.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the post.",
      error: error.message,
    });
  }
};

// Controller to save a post for a user
export const savePost = async (req, res) => {
  const { userId, postId } = req.params; // Get userId and postId from route parameters

  try {
    // Find the post by postId
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    // Check if user already saved the post
    const isAlreadySaved = post.saves.includes(userId);

    if (isAlreadySaved) {
      return res.status(400).json({
        success: false,
        message: "Post is already saved by the user.",
      });
    }

    // Add the userId to the saves array
    post.saves.push(userId);
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Post saved successfully.",
    });
  } catch (error) {
    console.error("Error saving post:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while saving the post.",
    });
  }
};

export const getSavedProjectsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    // Query to find posts where the userId is in the saves array
    const savedPosts = await Post.find({
      saves: userId, // Match the userId in the 'saves' array
      postType: "project",
    })
      .sort({ createdAt: -1 }) // Sort by the most recent posts
      .populate({
        path: "userData",
        select: "name profile", // Select sender's name, status, and profile reference
        populate: {
          path: "profile", // Nested populate for profile details
          select: "profilePhoto", // Fetch only profilePhoto and status
        },
      })
      .lean(); // Convert to plain JavaScript object for easier manipulation

    if (savedPosts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No saved posts found for this user.",
      });
    }

    // Returning the saved posts
    res.status(200).json({
      success: true,
      posts: savedPosts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error. Unable to fetch saved posts.",
    });
  }
};

export const getSavedPostsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    // Query to find posts where the userId is in the saves array
    const savedPosts = await Post.find({
      saves: userId, // Match the userId in the 'saves' array
      postType: { $in: ["post", "poles", "youtubeUrl"] },
    })
      .sort({ createdAt: -1 }) // Sort by the most recent posts
      .populate({
        path: "userData",
        select: "name profile", // Select sender's name, status, and profile reference
        populate: {
          path: "profile", // Nested populate for profile details
          select: "profilePhoto", // Fetch only profilePhoto and status
        },
      }) // Populate userData (creator's name, profileImage)
      .lean(); // Convert to plain JavaScript object for easier manipulation

    if (savedPosts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No saved posts found for this user.",
      });
    }

    // Returning the saved posts
    res.status(200).json({
      success: true,
      posts: savedPosts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error. Unable to fetch saved posts.",
    });
  }
};

export const acceptApplyRole = async (req, res) => {
  const { postId, applicationId } = req.body; // Post ID and application ID

  try {
    // Find the post by ID
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    // Find the application in the post's appliedUsers array
    const applicationIndex = post.appliedUsers.findIndex(
      (application) => application._id.toString() === applicationId
    );

    if (applicationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    const application = post.appliedUsers[applicationIndex];

    // Check if the application is pending
    if (application.status === "Pending") {
      application.status = "Accepted"; // Update status to Accepted
      await post.save(); // Save the post

      // Add the post to the user's `workingWith` field
      const user = await UserModel.findById(application.applicant);
      if (user) {
        user.workingWith.push({ postId: post._id }); // Add post ID to the workingWith array
        await user.save(); // Save changes to the user
      }

      // Add connection to the ConnectedUsers schema
      let connection = await ConnectedUsers.findOne({
        userId: post.userData, // The post creator
        "connections.user": application.applicant, // The applicant user
      });

      // If the user and the applicant are not already connected, add them
      if (!connection) {
        // Add to the post creator's connections
        await ConnectedUsers.findOneAndUpdate(
          { userId: post.userData }, // Post creator
          {
            $push: {
              connections: {
                user: application.applicant,
                connectedAt: new Date(),
              },
            },
          },
          { new: true, upsert: true }
        );

        // Add to the applicant's connections
        await ConnectedUsers.findOneAndUpdate(
          { userId: application.applicant }, // Applicant
          {
            $push: {
              connections: { user: post.userData, connectedAt: new Date() },
            },
          },
          { new: true, upsert: true }
        );
      }

      // Schedule auto-deletion after 24 hours
      setTimeout(async () => {
        post.appliedUsers = post.appliedUsers.filter(
          (app) => app._id.toString() !== applicationId
        ); // Remove application from appliedUsers
        await post.save(); // Save changes
      }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

      return res.status(200).json({
        success: true,
        message: "Application accepted. User is now working with the post.",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Application is not in a pending state.",
      });
    }
  } catch (error) {
    console.error("Error accepting application:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Unable to accept application.",
    });
  }
};

export const declineApplyRole = async (req, res) => {
  const { postId, applicationId } = req.body; // Post ID and application ID

  try {
    // Find the post by ID
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    // Find the application in the post's appliedUsers array
    const applicationIndex = post.appliedUsers.findIndex(
      (application) => application._id.toString() === applicationId
    );

    if (applicationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    const application = post.appliedUsers[applicationIndex];

    // Delete the application immediately from appliedUsers array
    post.appliedUsers.splice(applicationIndex, 1);
    await post.save(); // Save changes to the post

    return res.status(200).json({
      success: true,
      message: "Application declined and removed.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getallPostComments = async (req, res) => {
  const { postId } = req.params; // Extract postId from the request parameters

  try {
    // Find the post by postId and populate the comments' user details
    const post = await Post.findById(postId)
      .populate({
        path: "comments.userId", // Populate user details of the comment
        select: "profile", // Only fetch profile details
        populate: {
          path: "profile", // Populate profile details
          select: "profilePhoto", // Only fetch the profilePhoto field
        },
      })
      .exec();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    // Format the response to include necessary details from the comments
    const formattedComments = post.comments.map((comment) => ({
      _id: comment._id,
      post: comment.post,
      user: comment.userId._id,
      profilePhoto: comment.userId.profile?.profilePhoto || null, // Check if profile exists
      comment: comment.text, // Assuming comment text is stored in `text`
      createdAt: comment.createdAt,
    }));

    return res.status(200).json({
      success: true,
      message: "Comments fetched successfully.",
      comments: formattedComments,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getConnectedUserFeedPosts = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from request params
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Find connected users from the ConnectedUsers model
    const userConnections = await ConnectedUsers.findOne({ userId }).select(
      "connections.user"
    );

    if (!userConnections) {
      return res.status(200).json({
        success: true,
        posts: {
          feed: [],
          newPosts: [],
        },
        page: pageNum,
        totalPosts: 0,
      });
    }

    // Extract connected user IDs
    const connectedUserIds = userConnections.connections.map(
      (conn) => conn.user
    );

    // Fetch posts from connected users
    const posts = await Post.find({ userData: { $in: connectedUserIds } })
      .sort({ createdAt: -1 }) // Latest posts first
      .skip((pageNum - 1) * limitNum) // Pagination
      .limit(limitNum)
      .populate({
        path: "userData",
        select: "name profile", // Select sender's name, status, and profile reference
        populate: {
          path: "profile", // Nested populate for profile details
          select: "profilePhoto", // Fetch only profilePhoto and status
        },
      }); // Limit the number of posts per page

    // Fetch the 5 newest posts from connected users
    const newPosts = await Post.find({ userData: { $in: connectedUserIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: "userData",
        select: "name profile", // Select sender's name, status, and profile reference
        populate: {
          path: "profile", // Nested populate for profile details
          select: "profilePhoto", // Fetch only profilePhoto and status
        },
      });

    res.status(200).json({
      success: true,
      posts: {
        feed: posts,
        newPosts: newPosts, // New posts to be displayed at the top
      },
      page: pageNum,
      totalPosts: posts.length,
    });
  } catch (error) {
    console.error("Error fetching feed posts:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch posts." });
  }
};

export const getPopularUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Aggregate users based on post count and connection count
    const popularUsers = await UserModel.aggregate([
      {
        $lookup: {
          from: "connectedusers",
          localField: "_id",
          foreignField: "userId",
          as: "connectionsData",
        },
      },
      {
        $addFields: {
          postCount: { $size: { $ifNull: ["$posts", []] } }, // Count number of posts
          connectionCount: {
            $size: {
              $ifNull: [
                { $arrayElemAt: ["$connectionsData.connections", 0] },
                [],
              ],
            },
          }, // Count number of connections
        },
      },
      {
        $lookup: {
          from: "userprofiles", // Reference to the UserProfile model
          localField: "profile", // Reference to UserProfile by ObjectId
          foreignField: "_id",
          as: "profileData",
        },
      },
      {
        $unwind: {
          path: "$profileData", // Unwind to get the profile fields
          preserveNullAndEmptyArrays: true, // In case there's no profile data
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          postCount: 1,
          connectionCount: 1,
          profilePhoto: "$profileData.profilePhoto", // Populate profilePhoto
          location: "$profileData.location", // Populate location
          totalScore: { $sum: ["$postCount", "$connectionCount"] }, // Sum of posts and connections
        },
      },
      { $sort: { totalScore: -1 } }, // Sort by most popular users
      { $skip: (pageNum - 1) * limitNum }, // Pagination
      { $limit: limitNum }, // Limit to 10 users per fetch
    ]);

    return res.status(200).json({
      success: true,
      popularUsers,
      page: pageNum,
    });
  } catch (error) {
    console.error("Error fetching popular users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch popular users.",
    });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res
        .status(400)
        .json({ success: false, message: "Query parameter is required" });
    }

    // Search for users whose name matches the query using regex (case-insensitive)
    const users = await UserModel.find({
      name: { $regex: query, $options: "i" },
    }).select("name"); // Select only necessary fields

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search users",
    });
  }
};

export const searchInvestors = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res
        .status(400)
        .json({ success: false, message: "Query is required" });
    }

    const investors = await Investor.find({
      name: { $regex: query, $options: "i" },
    }).select("name"); // Select only necessary fields

    res.json({ success: true, investors });
  } catch (error) {
    console.error("Error searching investors:", error);
    res
      .status(500)
      .json({ success: false, message: "Error searching investors" });
  }
};

export const searchPosts = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res
        .status(400)
        .json({ success: false, message: "Query is required" });
    }

    const posts = await Post.find({
      name: { $regex: query, $options: "i" },
    }).select("title"); // Select only necessary fields

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Error searching posts:", error);
    res.status(500).json({ success: false, message: "Error searching posts" });
  }
};

export const deleteProjectPost = async (req, res) => {
  try {
    const { userId, postId } = req.params;

    // Find the post by its ID and ensure the postType is 'project' and the user is the creator
    const post = await Post.findOne({
      _id: postId,
      userData: userId,
      postType: "project",
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message:
          "Project post not found or you are not the creator of this post.",
      });
    }

    // Delete the post
    await post.remove();

    return res.status(200).json({
      success: true,
      message: "Project post deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting project post:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const deleteOtherPosts = async (req, res) => {
  try {
    const { userId, postId } = req.params;

    // Find the post by its ID and ensure the postType is either "poles", "posts", or "youtubeUrl" and the user is the creator
    const post = await Post.findOne({
      _id: postId,
      userData: userId,
      postType: { $in: ["poles", "posts", "youtubeUrl"] },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or you are not the creator of this post.",
      });
    }

    // Delete the post
    await post.remove();

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const applyForSkillSwap = async (req, res) => {
  try {
    const { postId, userId } = req.params;
    const { requiredFor } = req.body; // Skill or role the user is applying for

    // Validate if postId and userId are valid ObjectIds
    if (!postId || !userId) {
      return res
        .status(400)
        .json({ message: "Post ID and User ID are required." });
    }

    // Find the post by ID
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Find the user by ID to ensure they exist
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Create the application object
    const application = {
      applicantUser: userId,
      requiredFor,
      status: "Pending",
      appliedAt: new Date(),
    };

    // Add the application to the 'applyUsersOnSkillSwap' array
    post.applyUsersOnSkillSwap.push(application);

    // Save the post with the updated applications
    await post.save();

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again later." });
  }
};

export const deleteSkillSwapApplication = async (req, res) => {
  try {
    const { postId, userId } = req.params;

    // Validate if postId and userId are valid ObjectIds
    if (!postId || !userId) {
      return res
        .status(400)
        .json({ message: "Post ID and User ID are required." });
    }

    // Find the post by ID
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Find the application to delete by the userId in the skillSwap array
    const applicationIndex = post.applyUsersOnSkillSwap.findIndex(
      (app) => app.applicantUser.toString() === userId
    );

    // If application doesn't exist
    if (applicationIndex === -1) {
      return res.status(404).json({ message: "Application not found." });
    }

    // Remove the application from the array
    post.applyUsersOnSkillSwap.splice(applicationIndex, 1);

    // Save the post with the updated applications
    await post.save();

    return res
      .status(200)
      .json({ success: true, message: "Application removed successfully." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again later." });
  }
};

export const acceptSkillSwap = async (req, res) => {
  try {
    const { postId, userId } = req.params;

    // Validate if postId and userId are provided
    if (!postId || !userId) {
      return res
        .status(400)
        .json({ message: "Post ID and User ID are required." });
    }

    // Find the post by ID
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Find the application to accept in the 'applyUsersOnSkillSwap' array
    const application = post.applyUsersOnSkillSwap.find(
      (app) => app.applicantUser.toString() === userId
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    // Change the application status to "Accepted"
    application.status = "Accepted";

    // Save the post with the updated application status
    await post.save();

    // Now add the users to the connections array in ConnectedUsers collection
    let connectedUser = await ConnectedUsers.findOne({ userId });

    if (!connectedUser) {
      // If the user doesn't have a connected user list, create one
      connectedUser = new ConnectedUsers({
        userId,
        connections: [],
      });
    }

    // Add the other user (the user who posted the post) to the connections array
    const otherUserId = post.userData; // The creator of the post (the one who accepted the skill swap)

    // Avoid adding the same user twice
    if (
      !connectedUser.connections.some(
        (conn) => conn.user.toString() === otherUserId.toString()
      )
    ) {
      connectedUser.connections.push({ user: otherUserId });
    }

    // Save the connected user information
    await connectedUser.save();

    return res.status(200).json({
      success: true,
      message: "Skill swap accepted and connection added.",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again later." });
  }
};

export const declineSkillSwap = async (req, res) => {
  try {
    const { postId, userId } = req.params;

    // Validate if postId and userId are valid ObjectIds
    if (!postId || !userId) {
      return res
        .status(400)
        .json({ message: "Post ID and User ID are required." });
    }

    // Find the post by ID
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Find the application to decline by userId in the skillSwap array
    const applicationIndex = post.applyUsersOnSkillSwap.findIndex(
      (app) => app.applicantUser.toString() === userId
    );

    // If application doesn't exist
    if (applicationIndex === -1) {
      return res.status(404).json({ message: "Application not found." });
    }

    // Remove the application from the array
    post.applyUsersOnSkillSwap.splice(applicationIndex, 1);

    // Save the post with the updated applications
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Application declined and removed successfully.",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again later." });
  }
};

export const fetchSkillSwapApplications = async (req, res) => {
  try {
    const { userId, postId } = req.params; // Get userId and postId from request parameters

    // Build the query based on the presence of postId
    const query = { userData: userId };
    if (postId) {
      query._id = postId; // Filter by specific postId if provided
    }

    const posts = await Post.find(query)
      .populate({
        path: "applyUsersOnSkillSwap.applicantUser", // Populate the applicantUser field
        select: "name profile", // Select only the 'name' and 'profile' fields
        populate: {
          path: "profile", // Populate the profile details from the UserProfile model
          select: "profilePhoto", // Select only the 'profilePhoto' field
        },
      })
      .exec();

    if (!posts.length) {
      return res
        .status(404)
        .json({ success: false, message: "No applications found." });
    }

    // Format the response
    const formattedPosts = posts.map((post) => ({
      postId: post._id,
      applyUsersOnSkillSwap: post.applyUsersOnSkillSwap.map((application) => ({
        applicantUser: {
          name: application.applicantUser?.name,
          profilePhoto: application.applicantUser?.profile?.profilePhoto, // Access the profile photo safely
        },
        requiredFor: application.requiredFor,
        status: application.status,
        appliedAt: application.appliedAt,
      })),
    }));

    return res.status(200).json({ success: true, posts: formattedPosts });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again later." });
  }
};

export const fetchSkillSwapPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate if userId is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Find posts that are of type "skillSwap" and where the userId is in the applyUsersOnSkillSwap array
    const posts = await Post.find({
      postType: "skillSwap", // Filter posts by 'skillSwap' type
      "applyUsersOnSkillSwap.applicantUser": userId, // Match userId with applicantUser in applyUsersOnSkillSwap array
    })
      .populate({
        path: "userData", // Populate the applicantUser field
        select: "name profile", // Select only 'name' and 'profile'
        populate: {
          path: "profile", // Populate profile details
          select: "profilePhoto", // Select only 'profilePhoto' field
        },
      })
      .exec();

    // If no posts are found, return a message
    if (posts.length === 0) {
      return res
        .status(404)
        .json({ message: "No skill swap posts found for this user." });
    }

    // Return the posts along with populated user data
    return res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again later." });
  }
};

export const fetchSavedSkillSwapPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate if userId is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Find all posts where postType is "skillSwap" and the userId is in the saves array
    const posts = await Post.find({
      postType: "skillSwap", // Only skillSwap posts
      saves: userId, // Check if the user has saved the post
    })
      .populate({
        path: "userData", // Populate userData field to get post creator's data
        select: "name profile", // Select only 'name' and 'profile'
        populate: {
          path: "profile", // Populate profile details
          select: "profilePhoto", // Select only 'profilePhoto' field
        }, // Select name and profilePhoto only
      })
      .exec();

    // If no posts are found, return a message
    if (posts.length === 0) {
      return res.status(404).json({
        message: "No saved skill swap posts found for this user.",
      });
    }

    // Return the posts with populated userData
    return res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

export const myskillSwapPost = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate if userId is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Find all skillSwap posts where userData matches the userId
    const posts = await Post.find({
      postType: "skillSwap", // Only skillSwap posts
      userData: userId, // Match posts where userData is the userId
    })
      .populate({
        path: "userData", // Populate userData field
        select: "name profile", // Select name and profilePhoto from the user
        populate: {
          path: "profile", // Populate the profile sub-document in userData
          select: "profilePhoto", // Ensure profilePhoto is populated
        },
      })
      .exec();

    // If no posts are found, return a message
    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No skill swap posts found for this user.",
      });
    }

    // Return the posts with populated userData
    return res.status(200).json({ success: true, posts: posts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

export const votePollOption = async (req, res) => {
  try {
    const { userId, postId, pollOptionId } = req.params;
    // Find the post by ID
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the post has polls
    if (!post.polls || post.polls.length === 0) {
      return res.status(400).json({ message: "This post has no polls" });
    }

    // Find the poll option by ID
    const pollOption = post.polls.id(pollOptionId);

    if (!pollOption) {
      return res.status(404).json({ message: "Poll option not found" });
    }

    // // Check if the user has already voted in this poll option
    // if (pollOption.votes.includes(userId)) {
    //   return res
    //     .status(400)
    //     .json({ message: "You have already voted for this option" });
    // }

    // // Add the userId to the selected poll option's votes
    // pollOption.votes.push(userId);

    // Increment the vote count for the selected poll option
    pollOption.voteCount += 1;

    // Save the updated post
    await post.save();

    // Return the updated poll options with vote counts
    return res.status(200).json({
      message: "Vote successfully added",
      updatedPolls: post.polls,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get the selected poll option for the current user
export const getUserPollSelection = async (req, res) => {
  try {
    const { userId, postId } = req.params;

    // Find the post by ID
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Find the poll option that the user has voted for
    const userVote = post.polls.filter((poll) => poll.votes.includes(userId));

    if (!userVote || userVote.length === 0) {
      return res
        .status(400)
        .json({ message: "You haven't voted in this poll" });
    }

    // Return the user's selected poll option
    return res.status(200).json({
      message: "User poll selection",
      userVote,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
