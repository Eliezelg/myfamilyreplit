import { db } from "../db";
import { families, familyMembers, type Family, type FamilyMember, type InsertFamily, type InsertFamilyMember, type FamilyFund, type User } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { storage } from "../storage";
import { emailController } from "../controllers/email-controller";

/**
 * Service pour gérer les opérations liées aux familles
 */
class FamilyService {
  /**
   * Crée une nouvelle famille
   */
  async createFamily(family: InsertFamily, userId?: number): Promise<Family> {
    const [newFamily] = await db.insert(families)
      .values(family)
      .returning();

    // Si un userId est fourni, ajouter également l'utilisateur comme admin
    if (userId) {
      await this.addFamilyMember({
        familyId: newFamily.id,
        userId: userId,
        role: "admin"
      });
      
      // Envoyer un email de confirmation de création de famille
      try {
        const user = await storage.getUser(userId);
        if (user) {
          await emailController.sendFamilyCreationConfirmation(user, newFamily);
          console.log(`Email de confirmation de création de famille envoyé à ${user.email}`);
        }
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email de confirmation de création de famille:', emailError);
        // Continuer le processus même si l'email échoue
      }
    }

    return newFamily;
  }

  /**
   * Ajoute un membre à une famille
   */
  async addFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    const [newMember] = await db.insert(familyMembers)
      .values(member)
      .returning();

    return newMember;
  }

  /**
   * Récupère une famille par son ID
   */
  async getFamily(id: number): Promise<Family | undefined> {
    const [family] = await db.select()
      .from(families)
      .where(eq(families.id, id));

    return family || undefined;
  }

  /**
   * Récupère une famille par son code d'invitation (si implémenté)
   * Note: cette méthode est conservée pour la compatibilité, 
   * car le schéma actuel ne contient pas de champ inviteCode
   */
  async getFamilyByInviteCode(inviteCode: string): Promise<Family | undefined> {
    // Cette méthode sera implémentée quand le champ inviteCode sera ajouté
    console.warn("getFamilyByInviteCode appelé mais le champ inviteCode n'existe pas dans le modèle");
    return undefined;
  }

  /**
   * Met à jour les informations d'une famille
   */
  async updateFamily(id: number, familyData: Partial<Family>): Promise<Family> {
    const [updatedFamily] = await db.update(families)
      .set(familyData)
      .where(eq(families.id, id))
      .returning();

    return updatedFamily;
  }

  /**
   * Supprime une famille
   */
  async deleteFamily(id: number): Promise<void> {
    // Supprime d'abord tous les membres de la famille
    await db.delete(familyMembers)
      .where(eq(familyMembers.familyId, id));

    // Puis supprime la famille elle-même
    await db.delete(families)
      .where(eq(families.id, id));
  }

  /**
   * Récupère toutes les familles d'un utilisateur
   */
  async getUserFamilies(userId: number): Promise<Family[]> {
    // Récupérer les familles où l'utilisateur est membre
    const result = await db.select({
      family: families
    })
    .from(familyMembers)
    .innerJoin(families, eq(familyMembers.familyId, families.id))
    .where(eq(familyMembers.userId, userId));

    return result.map(r => r.family);
  }

  /**
   * Récupère le rôle d'un utilisateur dans une famille
   */
  async getUserFamilyRole(userId: number, familyId: number): Promise<string | null> {
    const [member] = await db.select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.userId, userId),
          eq(familyMembers.familyId, familyId)
        )
      );

    return member?.role || null;
  }

  /**
   * Vérifie si un utilisateur est membre d'une famille
   */
  async isUserFamilyMember(userId: number, familyId: number): Promise<boolean> {
    const [member] = await db.select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.userId, userId),
          eq(familyMembers.familyId, familyId)
        )
      );

    return !!member;
  }

  /**
   * Récupère tous les membres d'une famille avec leurs données utilisateur
   */
  async getFamilyMembers(familyId: number): Promise<(FamilyMember & { user?: User })[]> {
    // Faire une jointure avec la table des utilisateurs pour récupérer les noms
    const members = await db.query.familyMembers.findMany({
      where: eq(familyMembers.familyId, familyId),
      with: {
        user: true
      }
    });
    
    return members;
  }

  /**
   * Met à jour le rôle d'un membre dans une famille
   */
  async updateMemberRole(userId: number, familyId: number, role: string): Promise<FamilyMember> {
    const [updatedMember] = await db.update(familyMembers)
      .set({ role })
      .where(
        and(
          eq(familyMembers.userId, userId),
          eq(familyMembers.familyId, familyId)
        )
      )
      .returning();

    return updatedMember;
  }

  /**
   * Supprime un membre d'une famille
   */
  async removeFamilyMember(userId: number, familyId: number): Promise<void> {
    await db.delete(familyMembers)
      .where(
        and(
          eq(familyMembers.userId, userId),
          eq(familyMembers.familyId, familyId)
        )
      );
  }

  /**
   * Récupère le fond d'une famille
   */
  async getFamilyFund(familyId: number): Promise<FamilyFund | undefined> {
    // Utiliser directement le service storage qui implémente déjà cette fonctionnalité
    return await storage.getFamilyFund(familyId);
  }
}

export const familyService = new FamilyService();