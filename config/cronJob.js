import cron from "node-cron";
import { deleteOldNotifications } from "../controllers/notification.js";
import { checkPremiumStatus } from "../controllers/getAllUserData.js";
import ViewerModel from "../models/viewUser.js";

// Run the deletion job every hour
cron.schedule("0 * * * *", async () => {
  try {
    console.log("Running notification cleanup...");
    await deleteOldNotifications();
    console.log("Notification cleanup completed.");
  } catch (error) {
    console.error("Error in notification cleanup cron job:", error);
  }
});

// Run the premium status check job once a day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Checking premium status for all users...");
    await checkPremiumStatus();
    console.log("Premium status check complete.");
  } catch (error) {
    console.error("Error in premium status check cron job:", error);
  }
});

// Schedule cleanup job to run daily
cron.schedule("0 0 * * *", async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Remove viewers older than 30 days
    await ViewerModel.updateMany(
      {},
      { $pull: { viewers: { viewedAt: { $lt: thirtyDaysAgo } } } }
    );

    console.log("Old viewers cleaned up successfully.");
  } catch (error) {
    console.error("Error during viewer cleanup:", error);
  }
});
