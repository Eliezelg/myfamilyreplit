
import { Express } from "express";
import { paymentController } from "../controllers/payment-controller";

export function registerPaymentRoutes(app: Express) {
  // Route pour enregistrer une carte (tokenization)
  app.post("/api/payments/store-card", paymentController.storeCard.bind(paymentController));
  
  // Route pour traiter un paiement avec un token de carte
  app.post("/api/payments/process-with-token", paymentController.processWithToken.bind(paymentController));
  
  // Route pour ajouter des fonds au pot collectif familial
  app.post("/api/payments/add-funds", paymentController.addFunds.bind(paymentController));
}
