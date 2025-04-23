import { Express } from "express";
import { recipientController } from "../controllers/recipient-controller";

export function registerRecipientRoutes(app: Express) {
  // Récupérer les destinataires d'une famille
  app.get("/api/families/:id/recipients", recipientController.getFamilyRecipients.bind(recipientController));
  
  // Ajouter un nouveau destinataire
  app.post("/api/families/:id/recipients", recipientController.addRecipient.bind(recipientController));
  
  // Mettre à jour un destinataire existant
  app.put("/api/families/:id/recipients/:recipientId", recipientController.updateRecipient.bind(recipientController));
}