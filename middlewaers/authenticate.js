import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// middlewares/authenticate.js
export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify token (use your preferred JWT library, e.g., jsonwebtoken)
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = user.id;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
