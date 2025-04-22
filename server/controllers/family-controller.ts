import { Request, Response, NextFunction } from "express";
import { familyService } from "../services/family-service";
import { paymentService } from "../services/payment-service";
import { storage } from "../storage";

/**
 * Contrôleur pour gérer les requêtes liées aux familles
 */
class FamilyController {
  /**
   * Récupère toutes les familles de l'utilisateur connecté
   */
  async getUserFamilies(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const families = await familyService.getUserFamilies(req.user.id);
      res.json(families);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les détails d'une famille
   */
  async getFamily(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);

      // Vérifier que l'utilisateur est membre de la famille
      const isMember = await familyService.isUserFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Forbidden");
      }

      const family = await familyService.getFamily(familyId);
      if (!family) {
        return res.status(404).send("Family not found");
      }

      res.json(family);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crée une nouvelle famille
   */
  async createFamily(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      // Utiliser le storage service qui ajoute aussi l'utilisateur comme admin
      const family = await storage.createFamily(req.body, req.user.id);
      res.status(201).json(family);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crée une nouvelle famille avec paiement intégré
   */
  async createFamilyWithPayment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: "Unauthorized" });

      const { familyData, paymentToken, recipientData, addRecipientLater } = req.body;

      if (!familyData || !paymentToken) {
        return res.status(400).json({ 
          success: false, 
          message: "Données manquantes: familyData et paymentToken sont requis" 
        });
      }

      // Prix de l'abonnement en shekels (en agorot)
      const SUBSCRIPTION_PRICE = 7000; // 70 shekels

      try {
        // 1. Traiter le paiement d'abord
        const paymentResult = await paymentService.processPaymentWithToken({
          userId: req.user.id,
          familyId: 0, // temporaire, sera mis à jour après création
          amount: SUBSCRIPTION_PRICE,
          description: "Abonnement annuel à une famille",
          token: paymentToken
        });

        if (!paymentResult.success) {
          return res.status(400).json({ 
            success: false, 
            paymentError: true,
            message: paymentResult.message || "Échec du paiement" 
          });
        }

        // 2. Créer la famille (via storage pour gérer l'utilisateur membre)
        const family = await storage.createFamily(familyData, req.user.id);
        
        // 3. Créer le pot de la famille
        const familyFund = await storage.createFamilyFund({
          familyId: family.id,
          balance: 0,
          currency: "ILS"
        });

        // 4. Si des détails de destinataire sont fournis, les ajouter
        if (recipientData && !addRecipientLater) {
          const recipient = await storage.addRecipient({
            ...recipientData,
            familyId: family.id,
            active: true
          });
        }

        // Retourner la réponse combinée
        return res.status(201).json({
          success: true,
          family,
          payment: {
            success: true,
            amount: SUBSCRIPTION_PRICE / 100,
            referenceNumber: paymentResult.referenceNumber
          }
        });

      } catch (paymentError) {
        console.error("Erreur de paiement lors de la création de famille:", paymentError);
        return res.status(400).json({
          success: false,
          paymentError: true,
          message: paymentError instanceof Error ? paymentError.message : "Échec lors du traitement du paiement"
        });
      }
    } catch (error) {
      console.error("Erreur générale lors de la création de famille avec paiement:", error);
      next(error);
    }
  }

  /**
   * Récupère les membres d'une famille
   */
  async getFamilyMembers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);

      // Vérifier que l'utilisateur est membre de la famille
      const isMember = await familyService.isUserFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Forbidden");
      }

      const members = await familyService.getFamilyMembers(familyId);
      res.json(members);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère le fond d'une famille
   */
  async getFamilyFund(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);

      // Vérifier que l'utilisateur est membre de la famille
      const isMember = await familyService.isUserFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Forbidden");
      }

      const fund = await familyService.getFamilyFund(familyId);
      if (!fund) {
        return res.status(404).send("Family fund not found");
      }

      res.json(fund);
    } catch (error) {
      next(error);
    }
  }
}

export const familyController = new FamilyController();