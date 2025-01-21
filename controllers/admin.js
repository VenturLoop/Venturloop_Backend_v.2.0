import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import express from "express";
import Admin from "../models/admin.js";

export const createAdmion = async (req, res) => {
  const { email, password } = req.body;

  const adminExists = await Admin.findOne({ email });
  if (adminExists) {
    return res.status(400).json({ message: "Admin already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = new Admin({ email, password: hashedPassword, role: "admin" });
  await admin.save();

  res.status(201).json({ message: "Admin user created" });
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(400).json({ message: "Admin not found" });
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { adminId: admin._id, role: admin.role },
    "your_jwt_secret",
    { expiresIn: "1h" }
  );

  res.json({ token });
};
