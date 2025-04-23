
import { Express } from "express";
import { childController } from "../controllers/child-controller";

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
    childController.uploadChildPhoto,
    childController.updateProfilePicture.bind(childController)
  );
}
