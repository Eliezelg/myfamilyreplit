
import { Express } from "express";
import { childController } from "../controllers/child-controller";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

// Configuration de Multer pour les uploads d'images
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG and PNG files are allowed'));
    }
    cb(null, true);
  }
});

export function registerChildRoutes(app: Express) {
  // Récupérer les enfants de l'utilisateur
  app.get("/api/children", childController.getUserChildren.bind(childController));
  
  // Ajouter un enfant
  app.post("/api/children", childController.addChild.bind(childController));
  
  // Mettre à jour un enfant
  app.put("/api/children/:id", childController.updateChild.bind(childController));
  
  // Supprimer un enfant
  app.delete("/api/children/:id", childController.deleteChild.bind(childController));
  
  // Ajouter une photo de profil
  app.post(
    "/api/children/:id/picture", 
    upload.single("profileImage"), 
    childController.updateProfilePicture.bind(childController)
  );
}
