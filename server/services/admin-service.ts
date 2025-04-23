import { db } from "../db";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { 
  users, 
  families, 
  children, 
  photos, 
  familyFunds,
  fundTransactions,
  adminLogs,
  InsertAdminLog
} from "@shared/schema";
import { storage } from "../storage";

/**
 * Service pour les fonctionnalités administrateur
 */
export class AdminService {
  /**
   * Récupère tous les utilisateurs
   */
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.id));
  }

  /**
   * Récupère toutes les familles
   */
  async getAllFamilies() {
    return await db.select().from(families).orderBy(desc(families.id));
  }

  /**
   * Récupère une famille avec ses statistiques
   */
  async getFamilyDetails(familyId: number) {
    // Récupérer la famille
    const [familyData] = await db.select().from(families).where(eq(families.id, familyId));
    
    if (!familyData) {
      return null;
    }

    // Récupérer les membres
    const members = await storage.getFamilyMembers(familyId);
    
    // Compter les photos
    const [photoCount] = await db
      .select({ count: count() })
      .from(photos)
      .where(eq(photos.familyId, familyId));
    
    // Compter les événements
    const [eventCount] = await db
      .select({ count: count(sql`1`) })
      .from(sql`events`)
      .where(sql`family_id = ${familyId}`);
    
    // Compter les gazettes
    const [gazetteCount] = await db
      .select({ count: count(sql`1`) })
      .from(sql`gazettes`)
      .where(sql`family_id = ${familyId}`);
    
    // Récupérer le fonds
    const familyFund = await storage.getFamilyFund(familyId);
    
    return {
      ...familyData,
      members,
      stats: {
        photoCount: photoCount?.count || 0,
        eventCount: eventCount?.count || 0,
        gazetteCount: gazetteCount?.count || 0
      },
      fund: familyFund
    };
  }

  /**
   * Récupère les statistiques globales
   */
  async getDashboardStats() {
    // Compter les utilisateurs
    const [userCount] = await db
      .select({ count: count() })
      .from(users);
    
    // Compter les familles
    const [familyCount] = await db
      .select({ count: count() })
      .from(families);
    
    // Compter les enfants
    const [childCount] = await db
      .select({ count: count() })
      .from(children);
    
    // Compter les photos
    const [photoCount] = await db
      .select({ count: count() })
      .from(photos);
    
    // Compter les transactions
    const [transactionCount] = await db
      .select({ count: count() })
      .from(fundTransactions);
    
    // Calculer le solde total
    const [totalFunds] = await db
      .select({ 
        total: sql<number>`sum(balance)` 
      })
      .from(familyFunds);
    
    // Compter les nouveaux utilisateurs de la semaine dernière
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [newUsersLastWeek] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`created_at >= ${oneWeekAgo.toISOString()}`);
    
    return {
      userCount: userCount?.count || 0,
      familyCount: familyCount?.count || 0,
      childCount: childCount?.count || 0,
      photoCount: photoCount?.count || 0,
      transactionCount: transactionCount?.count || 0,
      totalFunds: totalFunds?.total || 0,
      newUsersLastWeek: newUsersLastWeek?.count || 0
    };
  }

  /**
   * Récupère les statistiques financières
   */
  async getFinancialStats() {
    // Calculer les dépôts totaux
    const [totalDeposits] = await db
      .select({ 
        total: sql<number>`sum(amount)` 
      })
      .from(fundTransactions)
      .where(eq(fundTransactions.type, "deposit"));
    
    // Calculer les paiements totaux
    const [totalPayments] = await db
      .select({ 
        total: sql<number>`sum(amount)` 
      })
      .from(fundTransactions)
      .where(eq(fundTransactions.type, "payment"));
    
    // Calculer les transactions par mois (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const transactionsByMonth = await db.execute<{ month: string, total: number }>(sql`
      SELECT 
        to_char(created_at, 'YYYY-MM') as month,
        sum(amount) as total
      FROM fund_transactions
      WHERE created_at >= ${sixMonthsAgo.toISOString()}
      GROUP BY month
      ORDER BY month ASC
    `);
    
    return {
      totalDeposits: totalDeposits?.total || 0,
      totalPayments: totalPayments?.total || 0,
      netBalance: (totalDeposits?.total || 0) - (totalPayments?.total || 0),
      transactionsByMonth: transactionsByMonth
    };
  }

  /**
   * Récupère toutes les transactions avec les infos utilisateur
   */
  async getAllTransactions() {
    return await db.execute(sql`
      SELECT 
        t.*,
        json_build_object(
          'id', u.id,
          'fullName', u.full_name,
          'username', u.username,
          'email', u.email,
          'profileImage', u.profile_image
        ) as user
      FROM fund_transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
  }

  /**
   * Récupère tous les logs admin
   */
  async getAdminLogs() {
    return await db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt));
  }

  /**
   * Met à jour le rôle d'un utilisateur
   */
  async updateUserRole(userId: number, role: string) {
    if (role !== "user" && role !== "admin" && role !== "superadmin") {
      throw new Error("Rôle invalide");
    }
    
    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  /**
   * Supprime un utilisateur
   */
  async deleteUser(userId: number) {
    // Cette opération devrait être entourée d'une transaction
    // et gérer les suppressions en cascade ou relations
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();
    
    return deletedUser;
  }

  /**
   * Crée un log d'action admin
   */
  async createAdminLog(log: InsertAdminLog) {
    const [createdLog] = await db
      .insert(adminLogs)
      .values(log)
      .returning();
    
    return createdLog;
  }
}

// Singleton
export const adminService = new AdminService();