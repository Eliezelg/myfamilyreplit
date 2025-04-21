import { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { ZCreditAPI } from "./zcredit-api";
import { PaymentService } from "./payment-service";

export function registerPaymentRoutes(app: Express) {
  const zCreditAPI = new ZCreditAPI();
  const paymentService = new PaymentService(zCreditAPI, storage);
  
  // Route pour enregistrer une carte (tokenization)
  app.post("/api/payments/store-card", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const { cardDetails } = req.body;
      
      if (!cardDetails || !cardDetails.cardNumber || !cardDetails.expDate || !cardDetails.cvv) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid card details. Required: cardNumber, expDate, cvv" 
        });
      }
      
      const result = await zCreditAPI.tokenizeCard(cardDetails);
      
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          message: result.message || "Failed to tokenize card" 
        });
      }
      
      return res.status(200).json({
        success: true,
        card: {
          cardNumberMask: result.cardMask,
          expiration: cardDetails.expDate,
          token: result.token
        }
      });
    } catch (error) {
      console.error("Error in store-card:", error);
      next(error);
    }
  });
  
  // Route pour traiter un paiement avec un token de carte
  app.post("/api/payments/process-with-token", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const { token, amount, description, familyId } = req.body;
      
      if (!token || !amount || amount <= 0 || !familyId) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid payment details. Required: token, amount, familyId" 
        });
      }
      
      // Vérifier si l'utilisateur est membre de cette famille
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).json({ 
          success: false, 
          message: "You are not a member of this family" 
        });
      }
      
      // Traiter le paiement avec le système de cascade
      const paymentResult = await paymentService.processPaymentWithToken({
        userId: req.user.id,
        familyId,
        amount,
        description: description || "Family payment",
        token
      });
      
      return res.status(200).json(paymentResult);
    } catch (error) {
      console.error("Error in process-with-token:", error);
      next(error);
    }
  });
  
  // Route pour ajouter des fonds au pot collectif familial
  app.post("/api/payments/add-funds", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const { token, amount, familyId } = req.body;
      
      if (!token || !amount || amount <= 0 || !familyId) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid details. Required: token, amount, familyId" 
        });
      }
      
      // Vérifier si l'utilisateur est membre de cette famille
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).json({ 
          success: false, 
          message: "You are not a member of this family" 
        });
      }
      
      // Effectuer le paiement direct via carte de crédit
      const paymentResult = await zCreditAPI.chargeWithToken(token, amount);
      
      if (!paymentResult.success) {
        return res.status(400).json({ 
          success: false, 
          message: paymentResult.message || "Failed to process payment" 
        });
      }
      
      // Récupérer le fonds familial
      let familyFund = await storage.getFamilyFund(familyId);
      
      // Si le fonds n'existe pas, le créer
      if (!familyFund) {
        familyFund = await storage.createFamilyFund({
          familyId,
          balance: 0,
          currency: "ILS"
        });
      }
      
      // Mettre à jour le solde du fonds
      const newBalance = familyFund.balance + amount;
      await storage.updateFundBalance(familyFund.id, newBalance);
      
      // Enregistrer la transaction
      await storage.addFundTransaction({
        fundId: familyFund.id,
        amount,
        type: "deposit",
        description: "הפקדה לקופה המשפחתית",
        createdAt: new Date(),
        referenceNumber: paymentResult.referenceNumber.toString(),
        userId: req.user.id
      });
      
      return res.status(200).json({
        success: true,
        message: "Fonds ajoutés avec succès",
        amountFromCard: amount,
        referenceNumber: paymentResult.referenceNumber.toString(),
        paymentDetails: {
          cardMask: paymentResult.cardMask || "xxxx"
        }
      });
    } catch (error) {
      console.error("Error in add-funds:", error);
      next(error);
    }
  });
}