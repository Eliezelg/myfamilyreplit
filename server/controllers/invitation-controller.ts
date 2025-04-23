import { Request, Response, NextFunction } from "express";
import { invitationService } from "../services/invitation-service";
import { storage } from "../storage";

/**
 * Contrôleur pour gérer les requêtes liées aux invitations
 */
class InvitationController {
  /**
   * Récupère l'invitation active d'une famille
   */
  async getFamilyInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const familyId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      
      // Vérifier que l'utilisateur est membre de la famille
      const isMember = await storage.userIsFamilyMember(userId, familyId);
      
      if (!isMember) {
        return res.status(403).json({ message: "Vous n'êtes pas membre de cette famille" });
      }
      
      const invitation = await invitationService.getFamilyInvitation(familyId);
      
      if (!invitation) {
        // Créer une nouvelle invitation si aucune n'existe
        const newInvitation = await invitationService.createInvitation(familyId, userId);
        return res.json(newInvitation);
      }
      
      return res.json(invitation);
    } catch (error: any) {
      next(error);
    }
  }
  
  /**
   * Crée une nouvelle invitation
   */
  async createInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const familyId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      
      // Vérifier que l'utilisateur est membre de la famille
      const isMember = await storage.userIsFamilyMember(userId, familyId);
      
      if (!isMember) {
        return res.status(403).json({ message: "Vous n'êtes pas membre de cette famille" });
      }
      
      // Vérifier si une invitation existe déjà
      const existingInvitation = await invitationService.getFamilyInvitation(familyId);
      
      if (existingInvitation) {
        return res.status(400).json({ 
          message: "Un code d'invitation existe déjà pour cette famille. Il n'est pas possible de le modifier." 
        });
      }
      
      const invitation = await invitationService.createInvitation(familyId, userId);
      
      return res.json(invitation);
    } catch (error: any) {
      next(error);
    }
  }
  
  /**
   * Crée une invitation par email
   */
  async inviteByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const familyId = parseInt(req.params.id);
      const userId = req.user?.id;
      const { email } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      
      if (!email) {
        return res.status(400).json({ message: "L'adresse email est requise" });
      }
      
      // Vérifier que l'utilisateur est membre de la famille
      const isMember = await storage.userIsFamilyMember(userId, familyId);
      
      if (!isMember) {
        return res.status(403).json({ message: "Vous n'êtes pas membre de cette famille" });
      }
      
      // Récupérer le nom de la famille
      const family = await storage.getFamily(familyId);
      
      if (!family) {
        return res.status(404).json({ message: "Famille non trouvée" });
      }
      
      const invitation = await invitationService.createEmailInvitation(
        familyId, 
        userId, 
        email,
        family.name
      );
      
      return res.json(invitation);
    } catch (error: any) {
      next(error);
    }
  }
  
  /**
   * Rejoint une famille avec un token d'invitation
   */
  async joinFamilyWithToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { token } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      
      if (!token) {
        return res.status(400).json({ message: "Le token d'invitation est requis" });
      }
      
      const result = await invitationService.joinFamilyWithToken(userId, token);
      
      return res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
}

export const invitationController = new InvitationController();