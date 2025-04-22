
import { Request, Response, NextFunction } from "express";
import { paymentService } from "../services/payment-service";

export class PaymentController {
  /**
   * Enregistre une carte de crédit (tokenization)
   */
  async storeCard(req: Request, res: Response, next: NextFunction) {
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
      
      const result = await paymentService.tokenizeCard(cardDetails);
      
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
  }
  
  /**
   * Traite un paiement avec un token de carte
   */
  async processWithToken(req: Request, res: Response, next: NextFunction) {
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
      const isMember = await paymentService.userIsFamilyMember(req.user.id, familyId);
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
  }
  
  /**
   * Ajoute des fonds au pot collectif familial
   */
  async addFunds(req: Request, res: Response, next: NextFunction) {
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
      const isMember = await paymentService.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).json({ 
          success: false, 
          message: "You are not a member of this family" 
        });
      }
      
      // Ajouter des fonds
      const result = await paymentService.addFundsToFamily({
        userId: req.user.id,
        familyId,
        amount,
        token
      });
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error in add-funds:", error);
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
import { Request, Response, NextFunction } from "express";
import { paymentService } from "../services/payment-service";

export class PaymentController {
  /**
   * Enregistre une carte de crédit (tokenization)
   */
  async storeCard(req: Request, res: Response, next: NextFunction) {
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
      
      const result = await paymentService.tokenizeCard(cardDetails);
      
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
  }
  
  /**
   * Traite un paiement avec un token de carte
   */
  async processWithToken(req: Request, res: Response, next: NextFunction) {
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
      const isMember = await paymentService.userIsFamilyMember(req.user.id, familyId);
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
  }
  
  /**
   * Ajoute des fonds au pot collectif familial
   */
  async addFunds(req: Request, res: Response, next: NextFunction) {
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
      const isMember = await paymentService.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).json({ 
          success: false, 
          message: "You are not a member of this family" 
        });
      }
      
      // Ajouter des fonds
      const result = await paymentService.addFundsToFamily({
        userId: req.user.id,
        familyId,
        amount,
        token
      });
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error in add-funds:", error);
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
