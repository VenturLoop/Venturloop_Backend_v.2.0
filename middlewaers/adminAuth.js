import jwt from "jsonwebtoken";

const adminAuth = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, "your_jwt_secret");
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};

export default adminAuth;
