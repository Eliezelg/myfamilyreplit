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
  
  // Create another test directory specifically for testing captions
  const testCaptionDir = path.join(process.cwd(), 'uploads/test-caption');
  if (!fs.existsSync(testCaptionDir)) {
    fs.mkdirSync(testCaptionDir, { recursive: true });
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
  
  // Configure storage for caption test uploads
  const captionTestStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, testCaptionDir);
    },
    filename: (req, file, cb) => {
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    }
  });
  
  // Create upload middleware instances
  const testUpload = multer({ 
    storage: testStorage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
  });
  
  const captionTestUpload = multer({ 
    storage: captionTestStorage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
  });
  
  // Basic test upload route
  app.post('/api/basic-test-upload', testUpload.single('file'), (req, res) => {
    try {
      console.log('BASIC TEST UPLOAD received request', {
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
      console.log('BASIC TEST UPLOAD file details:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
      
      // Log form fields
      console.log('BASIC TEST UPLOAD form fields:', req.body);
      
      return res.status(200).json({
        success: true,
        filename: req.file.filename,
        caption: req.body.caption || '',
        message: 'File uploaded successfully'
      });
    } catch (error: any) {
      console.error('BASIC TEST UPLOAD error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'An unknown error occurred'
      });
    }
  });
  
  // Test route specifically focusing on captions
  app.post('/api/caption-test-upload', captionTestUpload.single('file'), (req, res) => {
    try {
      console.log('CAPTION TEST UPLOAD received request', {
        body: JSON.stringify(req.body),
        hasFile: !!req.file,
        bodyKeys: Object.keys(req.body || {})
      });
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file was uploaded'
        });
      }
      
      // Extract the caption from the request body
      const caption = req.body.caption || '';
      const familyId = req.body.familyId || '3'; // Default for testing
      
      console.log('CAPTION TEST UPLOAD values:', {
        caption,
        familyId,
        captionType: typeof caption,
        familyIdType: typeof familyId
      });
      
      // Log file details
      console.log('CAPTION TEST UPLOAD file details:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
      
      // Store the caption in a JSON file alongside the image
      const metadataPath = path.join(testCaptionDir, `${req.file.filename}.json`);
      const metadata = {
        caption,
        familyId: parseInt(familyId),
        uploadedAt: new Date().toISOString(),
        filename: req.file.filename,
        originalname: req.file.originalname
      };
      
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      console.log('CAPTION TEST UPLOAD metadata saved to:', metadataPath);
      
      return res.status(200).json({
        success: true,
        filename: req.file.filename,
        caption,
        familyId,
        message: 'File uploaded successfully with caption'
      });
    } catch (error: any) {
      console.error('CAPTION TEST UPLOAD error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'An unknown error occurred'
      });
    }
  });
  
  // Simple route to test if upload endpoints are active
  app.get('/api/test-upload-status', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Test upload endpoints are active',
      endpoints: [
        '/api/basic-test-upload',
        '/api/caption-test-upload'
      ]
    });
  });
}