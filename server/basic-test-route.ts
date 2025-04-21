import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads/test-basic");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});

// Create multer instance
const upload = multer({ storage });

// Test route for handling file uploads
export const basicTestRoute = express.Router();

// Simple upload route
basicTestRoute.post("/api/basic-test-upload", upload.single("file"), (req, res) => {
  console.log("BASIC TEST received request");
  
  try {
    if (!req.file) {
      console.log("BASIC TEST no file");
      return res.status(400).json({ success: false, message: "No file received" });
    }
    
    console.log("BASIC TEST file:", {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    console.log("BASIC TEST body:", req.body);
    
    return res.status(200).json({
      success: true,
      file: req.file.filename,
      caption: req.body.caption || "",
      message: "Upload successful"
    });
  } catch (error: any) {
    console.error("BASIC TEST error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Unknown error occurred"
    });
  }
});