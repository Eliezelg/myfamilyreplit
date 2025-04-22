
import { Express } from "express";
import { familyController } from "../controllers/family-controller";

export function registerFamilyRoutes(app: Express) {
  // Récupérer toutes les familles de l'utilisateur
  app.get("/api/families", familyController.getUserFamilies.bind(familyController));
  
  // Créer une nouvelle famille
  app.post("/api/families", familyController.createFamily.bind(familyController));
  
  // Créer une nouvelle famille avec paiement intégré
  app.post("/api/families/create-with-payment", familyController.createFamilyWithPayment.bind(familyController));
  
  // Récupérer les détails d'une famille
  app.get("/api/families/:id", familyController.getFamily.bind(familyController));
  
  // Récupérer les membres d'une famille
  app.get("/api/families/:id/members", familyController.getFamilyMembers.bind(familyController));
  
  // Récupérer le fond d'une famille
  app.get("/api/families/:id/fund", familyController.getFamilyFund.bind(familyController));
}
