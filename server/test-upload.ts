import express, { Express } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

export function setupTestUploadRoutes(app: Express) {
  // Create test upload directory
  const testUploadDir = path.join(process.cwd(), 'uploads/test');
  if (!fs.existsSync(testUploadDir)) {
    fs.mkdirSync(testUploadDir, { recursive: true });
  }
  
  // Configure storage for test uploads
  const testStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, testUploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    }
  });
  
  // Create upload middleware
  const testUpload = multer({ 
    storage: testStorage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
  });
  
  // Add test routes
  app.post('/api/basic-test-upload', testUpload.single('file'), (req, res) => {
    try {
      console.log('TEST UPLOAD received request', {
        body: req.body,
        hasFile: !!req.file
      });
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file was uploaded'
        });
      }
      
      // Log file details
      console.log('TEST UPLOAD file details:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
      
      // Log form fields
      console.log('TEST UPLOAD form fields:', req.body);
      
      return res.status(200).json({
        success: true,
        filename: req.file.filename,
        caption: req.body.caption || '',
        message: 'File uploaded successfully'
      });
    } catch (error: any) {
      console.error('TEST UPLOAD error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'An unknown error occurred'
      });
    }
  });
  
  // Simple text-only route for testing connectivity
  app.get('/api/test-upload-status', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Test upload endpoint is active'
    });
  });
}