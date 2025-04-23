import { storage } from "../storage";
import { Invitation, InsertInvitation, User } from "../../shared/schema";
import { v4 as uuidv4 } from "uuid";
import { emailController } from "../controllers/email-controller";

/**
 * Service pour gérer les invitations aux familles
 */
export class InvitationService {
  /**
   * Récupère l'invitation active pour une famille donnée
   */
  async getFamilyInvitation(familyId: number): Promise<Invitation | undefined> {
    return await storage.getFamilyInvitation(familyId);
  }

  /**
   * Crée une nouvelle invitation pour rejoindre une famille
   */
  async createInvitation(familyId: number, userId: number): Promise<Invitation> {
    // Génération d'un token unique aléatoire (6 caractères alphanum)
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Date d'expiration (30 jours à partir de maintenant)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const invitation: InsertInvitation = {
      familyId,
      invitedByUserId: userId,
      token,
      expiresAt,
      status: "pending",
      type: "code"
    };
    
    return await storage.createInvitation(invitation);
  }

  /**
   * Crée une invitation par email
   */
  async createEmailInvitation(
    familyId: number, 
    userId: number, 
    email: string,
    familyName: string
  ): Promise<Invitation> {
    // Génération d'un token unique
    const token = uuidv4();
    
    // Date d'expiration (7 jours à partir de maintenant)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const invitation: InsertInvitation = {
      familyId,
      invitedByUserId: userId,
      email,
      token,
      expiresAt,
      status: "pending",
      type: "email"
    };
    
    const newInvitation = await storage.createInvitation(invitation);
    
    // Envoyer l'email d'invitation
    try {
      // Récupérer les informations sur l'utilisateur qui invite
      const inviter = await storage.getUser(userId);
      if (inviter) {
        await emailController.sendFamilyInvitation(email, inviter.username, newInvitation, familyName);
        console.log(`Email d'invitation à la famille envoyé à ${email}`);
      }
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email d\'invitation:', emailError);
      // Continuer le processus même si l'email échoue
    }
    
    return newInvitation;
  }

  /**
   * Récupère une invitation par son token
   */
  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    return await storage.getInvitationByToken(token);
  }

  /**
   * Met à jour le statut d'une invitation
   */
  async updateInvitationStatus(id: number, status: string): Promise<Invitation> {
    return await storage.updateInvitationStatus(id, status);
  }

  /**
   * Rejoint une famille en utilisant un token d'invitation
   */
  async joinFamilyWithToken(userId: number, token: string): Promise<{familyId: number, name: string}> {
    // Récupérer l'invitation
    const invitation = await storage.getInvitationByToken(token);
    
    if (!invitation) {
      throw new Error("Code d'invitation invalide ou expiré");
    }
    
    if (invitation.status !== "pending") {
      throw new Error("Cette invitation a déjà été utilisée");
    }
    
    if (new Date(invitation.expiresAt) < new Date()) {
      throw new Error("Cette invitation a expiré");
    }
    
    // Récupérer la famille
    const family = await storage.getFamily(invitation.familyId);
    
    if (!family) {
      throw new Error("La famille n'existe plus");
    }
    
    // Vérifier si l'utilisateur est déjà membre de cette famille
    const isAlreadyMember = await storage.userIsFamilyMember(userId, family.id);
    
    if (isAlreadyMember) {
      throw new Error("Vous êtes déjà membre de cette famille");
    }
    
    // Ajouter l'utilisateur comme membre de la famille
    await storage.addFamilyMember({
      familyId: family.id,
      userId,
      role: "member"
    });
    
    // Marquer l'invitation comme acceptée
    await storage.updateInvitationStatus(invitation.id, "accepted");
    
    // Envoyer un email de confirmation de rejoindre la famille
    try {
      const user = await storage.getUser(userId);
      if (user) {
        await emailController.sendFamilyJoinConfirmation(user, family);
        console.log(`Email de confirmation de rejoindre la famille envoyé à ${user.email}`);
      }
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation de rejoindre la famille:', emailError);
      // Continuer le processus même si l'email échoue
    }
    
    return {
      familyId: family.id,
      name: family.name
    };
  }
}

export const invitationService = new InvitationService();