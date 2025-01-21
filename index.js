import express from "express";
import http from "http";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { SocketManager } from "./services/SocketManager.js";
import AuthRoutes from "./routes/authRoutes.js";
import fileUpload from "./routes/fileUploader.js";
import profile from "./routes/profileroutes.js";
import userPreference from "./routes/userPreference.js";
import connection from "./routes/connectionRoutes.js";
import investor from "./routes/investorRoute.js";
import post from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoute.js";
import adminRoute from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import messageRequestRoutes from "./routes/messageRequestRoutes.js";
import { LinkedInCallback } from "./controllers/auth.js";

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();
  
const app = express();
const server = http.createServer(app);

// Configure CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.json());

// Initialize Socket.IO
const socketManager = new SocketManager(server, {
  cors: {
    origin: corsOptions.origin,
    methods: corsOptions.methods,
    allowedHeaders: corsOptions.allowedHeaders,
    credentials: corsOptions.credentials,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  path: "/socket.io",
});

// Define routes
app.use("/auth", AuthRoutes);
app.use("/api", fileUpload);
app.use("/api", profile);
app.use("/api", userPreference);
app.use("/api", connection);
app.use("/api", investor);
app.use("/api", post);
app.use("/api/messages", messageRoutes);
app.use("/notifications", notificationRoutes);
app.use("/admin-auth", adminRoute);
app.use("/message-request", messageRequestRoutes);

// Protected route example
app.get("/protected", (req, res) => {
  res.json({ message: "This is a protected route", userId: req.userId });
});

app.get("/linkedin/callback", LinkedInCallback);

// Basic health check route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Log all routes
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(
      `Route: ${middleware.route.path} | Methods: ${Object.keys(
        middleware.route.methods
      )
        .join(", ")
        .toUpperCase()}`
    );
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).send("Something went wrong!");
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(
    `✅ WebSocket server listening at ws://localhost:${PORT}/socket.io`
  );
});
