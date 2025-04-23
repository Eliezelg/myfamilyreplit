import { db } from "../db";
import { 
  users, 
  families, 
  familyMembers, 
  children, 
  fundTransactions, 
  photos,
  gazettes,
  events,
  invitations, 
  adminLogs, 
  recipients
} from "@shared/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { AdminLog, User } from "@shared/schema";

/**
 * Service pour les fonctionnalités d'administration
 */
class AdminService {
  /**
   * Récupère des statistiques générales de la plateforme
   */
  async getStats() {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [familyCount] = await db.select({ count: sql<number>`count(*)` }).from(families);
    const [childCount] = await db.select({ count: sql<number>`count(*)` }).from(children);
    const [photoCount] = await db.select({ count: sql<number>`count(*)` }).from(photos);
    const [transactionCount] = await db.select({ count: sql<number>`count(*)` }).from(fundTransactions);
    
    // Total des fonds (somme de toutes les transactions)
    const [totalFunds] = await db.select({
      sum: sql<number>`sum(amount)`
    }).from(fundTransactions);

    // Nouveaux utilisateurs cette semaine
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const [newUsers] = await db.select({
      count: sql<number>`count(*)`
    })
    .from(users)
    .where(gte(users.createdAt, lastWeek));

    return {
      userCount: userCount.count,
      familyCount: familyCount.count,
      childCount: childCount.count,
      photoCount: photoCount.count,
      transactionCount: transactionCount.count,
      totalFunds: totalFunds.sum || 0,
      newUsersLastWeek: newUsers.count
    };
  }

  /**
   * Récupère tous les utilisateurs de la plateforme
   */
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  /**
   * Met à jour le rôle d'un utilisateur
   */
  async updateUserRole(id: number, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  /**
   * Supprime un utilisateur (attention: opération destructive!)
   */
  async deleteUser(id: number): Promise<void> {
    // Supprimer les enfants de l'utilisateur
    await db.delete(children).where(eq(children.userId, id));
    
    // Supprimer l'appartenance à des familles
    await db.delete(familyMembers).where(eq(familyMembers.userId, id));
    
    // Puis supprimer l'utilisateur
    await db.delete(users).where(eq(users.id, id));
  }

  /**
   * Récupère toutes les familles
   */
  async getAllFamilies() {
    return await db.select().from(families).orderBy(desc(families.createdAt));
  }

  /**
   * Récupère les détails d'une famille avec ses membres
   */
  async getFamilyDetails(id: number) {
    const family = await db.select().from(families).where(eq(families.id, id)).then(rows => rows[0]);
    
    if (!family) {
      return null;
    }
    
    // Récupérer les membres
    const members = await db
      .select({
        member: familyMembers,
        user: users
      })
      .from(familyMembers)
      .leftJoin(users, eq(familyMembers.userId, users.id))
      .where(eq(familyMembers.familyId, id));

    // Récupérer les statistiques
    const [photoCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(photos)
      .where(eq(photos.familyId, id));

    const [eventCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(eq(events.familyId, id));

    const [gazetteCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(gazettes)
      .where(eq(gazettes.familyId, id));

    return {
      ...family,
      members: members.map(m => ({
        ...m.member,
        user: m.user
      })),
      stats: {
        photoCount: photoCount.count,
        eventCount: eventCount.count,
        gazetteCount: gazetteCount.count
      }
    };
  }

  /**
   * Récupère les logs d'administration
   */
  async getAdminLogs(limit = 100): Promise<AdminLog[]> {
    return await db
      .select()
      .from(adminLogs)
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit);
  }
  
  /**
   * Récupère les transactions financières
   */
  async getAllTransactions(limit = 100) {
    return await db
      .select({
        transaction: fundTransactions,
        user: users
      })
      .from(fundTransactions)
      .leftJoin(users, eq(fundTransactions.userId, users.id))
      .orderBy(desc(fundTransactions.createdAt))
      .limit(limit);
  }

  /**
   * Récupère les statistiques financières
   */
  async getFinancialStats() {
    // Total des dépôts
    const [deposits] = await db
      .select({
        sum: sql<number>`sum(amount)`
      })
      .from(fundTransactions)
      .where(eq(fundTransactions.type, "deposit"));

    // Total des paiements
    const [payments] = await db
      .select({
        sum: sql<number>`sum(amount)`
      })
      .from(fundTransactions)
      .where(eq(fundTransactions.type, "payment"));

    // Transactions par mois (derniers 6 mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactionsByMonth = await db
      .select({
        month: sql<string>`to_char(created_at, 'YYYY-MM')`,
        total: sql<number>`sum(amount)`
      })
      .from(fundTransactions)
      .where(gte(fundTransactions.createdAt, sixMonthsAgo))
      .groupBy(sql`to_char(created_at, 'YYYY-MM')`)
      .orderBy(sql`to_char(created_at, 'YYYY-MM')`);

    return {
      totalDeposits: deposits.sum || 0,
      totalPayments: payments.sum || 0,
      netBalance: (deposits.sum || 0) - (payments.sum || 0),
      transactionsByMonth
    };
  }
}

export const adminService = new AdminService();