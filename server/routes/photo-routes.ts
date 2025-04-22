import { Express } from "express";
import { photoController } from "../controllers/photo-controller";
import { photoService } from "../services/photo-service";

export function registerPhotoRoutes(app: Express) {
  // Télécharger une photo en utilisant le middleware d'upload du service
  app.post(
    "/api/photos/upload", 
    photoService.upload.single("file"), 
    photoController.uploadPhoto.bind(photoController)
  );
  
  // Récupérer les photos d'une famille
  app.get(
    "/api/families/:id/photos", 
    photoController.getFamilyPhotos.bind(photoController)
  );
}