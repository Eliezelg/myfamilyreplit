import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Create multer instance
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, callback) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return callback(null, true);
    }
    
    callback(
      new Error("Only image files (jpeg, jpg, png, gif) are allowed")
    );
  },
});

export function setupTestUploadRoutes(app: express.Express) {
  // Basic test upload route
  app.post("/api/basic-test-upload", upload.single("file"), (req, res) => {
    console.log("BASIC TEST UPLOAD - Auth status:", req.isAuthenticated ? req.isAuthenticated() : "No auth function");
    console.log("BASIC TEST UPLOAD - Headers:", req.headers);
    
    try {
      // Check if file was uploaded
      if (!req.file) {
        console.log("BASIC TEST UPLOAD - No file received");
        return res.status(400).json({
          success: false,
          message: "No file received"
        });
      }
      
      // Log details
      console.log("BASIC TEST UPLOAD - File received:", {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
      
      console.log("BASIC TEST UPLOAD - Body:", req.body);
      
      // Success response
      return res.status(200).json({
        success: true,
        file: req.file.filename,
        message: "File uploaded successfully"
      });
    } catch (error: any) {
      console.error("BASIC TEST UPLOAD - Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "An unknown error occurred"
      });
    }
  });
}