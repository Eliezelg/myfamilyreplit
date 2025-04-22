import { Express } from "express";
import { photoController } from "../controllers/photo-controller";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

// S'assurer que le dossier d'uploads existe
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Dossier d'uploads créé:", uploadDir);
}

// Configuration de multer pour l'upload de fichiers
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      console.log("Upload directory (photo routes):", uploadDir);
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      console.log("Generated filename (photo routes):", uniqueFilename);
      cb(null, uniqueFilename);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    console.log("Checking file mimetype (photo routes):", file.mimetype);
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG and PNG files are allowed'));
    }
    cb(null, true);
  }
});

export function registerPhotoRoutes(app: Express) {
  // Télécharger une photo
  app.post("/api/photos/upload", upload.single("file"), photoController.uploadPhoto.bind(photoController));
  
  // Récupérer les photos d'une famille
  app.get("/api/families/:id/photos", photoController.getFamilyPhotos.bind(photoController));
}