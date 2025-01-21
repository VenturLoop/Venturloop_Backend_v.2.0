import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ["admin"] }, // Only admin role
});

const Admin = mongoose.model("Admin", adminSchema); // Changed model name to "Admin"

export default Admin;
