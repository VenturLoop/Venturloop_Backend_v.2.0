import express from "express";
import { fileUpload } from "../controllers/fileUpload.js";
import uploadMiddleWare from "../middlewaers/fileUplopader.js";

const router = express.Router();

router.post("/fileUpload", uploadMiddleWare.array("file"), fileUpload);

export default router;
