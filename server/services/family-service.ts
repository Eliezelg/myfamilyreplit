
import { db } from "../db";
import { 
  families, 
  type Family, 
  type InsertFamily,
  familyMembers,
  familyFunds,
  type FamilyMember,
  type FamilyFund,
  users,
  type User
} from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Service pour gérer les opérations liées aux familles
 */
class FamilyService {
  /**
   * Récupère une famille par son ID
   */
  async getFamily(id: number): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family || undefined;
  }
  
  /**
   * Récupère toutes les familles d'un utilisateur
   */
  async getFamiliesForUser(userId: number): Promise<Family[]> {
    const result = await db
      .select({ family: families })
      .from(familyMembers)
      .innerJoin(families, eq(familyMembers.familyId, families.id))
      .where(eq(familyMembers.userId, userId));
    
    return result.map(r => r.family);
  }
  
  /**
   * Crée une nouvelle famille et ajoute le créateur comme administrateur
   */
  async createFamily(family: InsertFamily, userId: number): Promise<Family> {
    // Create family
    const [newFamily] = await db.insert(families).values(family).returning();
    
    // Add creator as admin
    await db.insert(familyMembers).values({
      familyId: newFamily.id,
      userId,
      role: "admin",
    });
    
    // Create family fund
    await db.insert(familyFunds).values({
      familyId: newFamily.id,
      balance: 0,
      currency: "ILS",
    });
    
    return newFamily;
  }
  
  /**
   * Récupère les membres d'une famille
   */
  async getFamilyMembers(familyId: number): Promise<(FamilyMember & { user?: User })[]> {
    const members = await db.select({
      member: familyMembers,
      user: users
    })
    .from(familyMembers)
    .leftJoin(users, eq(familyMembers.userId, users.id))
    .where(eq(familyMembers.familyId, familyId));
    
    return members.map(({ member, user }) => ({
      ...member,
      user
    }));
  }
  
  /**
   * Récupère le fond familial
   */
  async getFamilyFund(familyId: number): Promise<FamilyFund | undefined> {
    const [fund] = await db.select()
      .from(familyFunds)
      .where(eq(familyFunds.familyId, familyId));
    
    return fund || undefined;
  }
  
  /**
   * Vérifie si un utilisateur est membre d'une famille
   */
  async isUserMemberOfFamily(userId: number, familyId: number): Promise<boolean> {
    const [member] = await db.select()
      .from(familyMembers)
      .where(eq(familyMembers.userId, userId))
      .where(eq(familyMembers.familyId, familyId));
    
    return !!member;
  }
}

export const familyService = new FamilyService();milyService();
