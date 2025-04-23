import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { insertRecipientSchema } from "@shared/schema";
import { z } from "zod";

/**
 * Contrôleur pour gérer les requêtes liées aux destinataires
 */
class RecipientController {
  /**
   * Récupère les destinataires d'une famille
   */
  async getFamilyRecipients(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const familyId = parseInt(req.params.id);
      
      // Vérifier que l'utilisateur est membre de la famille
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Forbidden");
      }
      
      const recipients = await storage.getFamilyRecipients(familyId);
      res.json(recipients);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Ajoute un nouveau destinataire
   */
  async addRecipient(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const familyId = parseInt(req.params.id);
      
      // Vérifier que l'utilisateur est administrateur de la famille
      const isAdmin = await storage.userIsFamilyAdmin(req.user.id, familyId);
      if (!isAdmin) {
        return res.status(403).send("Forbidden - Admin access required");
      }
      
      // Valider les données reçues
      const validatedData = insertRecipientSchema.safeParse({
        ...req.body,
        familyId
      });
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validatedData.error.format() 
        });
      }
      
      // Ajouter le destinataire
      const recipient = await storage.addRecipient(validatedData.data);
      res.status(201).json(recipient);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Met à jour un destinataire existant
   */
  async updateRecipient(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const familyId = parseInt(req.params.id);
      const recipientId = parseInt(req.params.recipientId);
      
      // Vérifier que l'utilisateur est administrateur de la famille
      const isAdmin = await storage.userIsFamilyAdmin(req.user.id, familyId);
      if (!isAdmin) {
        return res.status(403).send("Forbidden - Admin access required");
      }
      
      // S'assurer que le destinataire appartient à la famille
      const recipients = await storage.getFamilyRecipients(familyId);
      const recipientExists = recipients.some(r => r.id === recipientId);
      
      if (!recipientExists) {
        return res.status(404).send("Recipient not found or does not belong to this family");
      }
      
      // Valider les données de mise à jour
      const schema = z.object({
        name: z.string().min(2).optional(),
        streetAddress: z.string().min(3).optional(),
        city: z.string().min(2).optional(),
        postalCode: z.string().min(1).optional(),
        country: z.string().min(2).optional(),
        imageUrl: z.string().optional(),
        active: z.boolean().optional()
      });
      
      const validatedData = schema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validatedData.error.format() 
        });
      }
      
      // Mettre à jour le destinataire
      const updatedRecipient = await storage.updateRecipient(recipientId, validatedData.data);
      res.json(updatedRecipient);
    } catch (error) {
      next(error);
    }
  }
}

export const recipientController = new RecipientController();