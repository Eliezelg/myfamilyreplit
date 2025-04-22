import { db } from "../db";
import { families, familyMembers, type Family, type FamilyMember, type InsertFamily, type InsertFamilyMember } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Service pour gérer les opérations liées aux familles
 */
class FamilyService {
  /**
   * Crée une nouvelle famille
   */
  async createFamily(family: InsertFamily): Promise<Family> {
    const [newFamily] = await db.insert(families)
      .values(family)
      .returning();

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
   * Récupère une famille par son code d'invitation
   */
  async getFamilyByInviteCode(inviteCode: string): Promise<Family | undefined> {
    const [family] = await db.select()
      .from(families)
      .where(eq(families.inviteCode, inviteCode));

    return family || undefined;
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
   * Récupère tous les membres d'une famille
   */
  async getFamilyMembers(familyId: number): Promise<FamilyMember[]> {
    return db.select()
      .from(familyMembers)
      .where(eq(familyMembers.familyId, familyId));
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
  async getFamilyFund(familyId: number): Promise<any | undefined> {
    // Implémenter selon votre schéma de base de données
    // Exemple:
    // const [fund] = await db.select()
    //   .from(familyFunds)
    //   .where(eq(familyFunds.familyId, familyId));
    
    // return fund || undefined;
    
    // Pour le moment, renvoyer un objet fictif pour éviter les erreurs
    return {
      id: familyId,
      balance: 0,
      currency: "ILS",
      familyId: familyId
    };
  }
}

export const familyService = new FamilyService();