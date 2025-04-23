import { Request, Response, NextFunction } from "express";
import { adminService } from "../services/admin-service";
import { logAdminAction } from "../middleware/admin-auth";

/**
 * Contrôleur pour les fonctionnalités d'administration
 */
/**
 * Vérifie que l'utilisateur est bien présent dans la requête
 */
function assertUser(req: Request, message: string = "Non authentifié"): asserts req is Request & { user: Express.User } {
  if (!req.user) {
    throw new Error(message);
  }
}

class AdminController {
  /**
   * Récupère les statistiques générales du dashboard
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getStats();
      
      // Log de l'action administrative
      if (req.user) {
        logAdminAction(
          req.user.id,
          "view",
          "dashboard",
          undefined,
          { action: "Consultation des statistiques du dashboard" },
          req.ip
        );
      }
      
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère tous les utilisateurs
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      assertUser(req);
      const users = await adminService.getAllUsers();
      
      // Log de l'action administrative
      logAdminAction(
        req.user.id,
        "view",
        "users",
        undefined,
        { action: "Consultation de la liste des utilisateurs" },
        req.ip
      );
      
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour le rôle d'un utilisateur
   */
  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      if (!role || !["user", "admin", "superadmin"].includes(role)) {
        return res.status(400).json({ error: "Rôle invalide" });
      }
      
      const updatedUser = await adminService.updateUserRole(userId, role);
      
      // Log de l'action administrative
      logAdminAction(
        req.user.id,
        "update",
        "user",
        userId,
        { action: "Mise à jour du rôle utilisateur", newRole: role },
        req.ip
      );
      
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprime un utilisateur (opération destructive)
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id);
      
      // Vérifier que l'admin ne se supprime pas lui-même
      if (userId === req.user.id) {
        return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte" });
      }
      
      await adminService.deleteUser(userId);
      
      // Log de l'action administrative (action critique)
      logAdminAction(
        req.user.id,
        "delete",
        "user",
        userId,
        { action: "Suppression d'un utilisateur" },
        req.ip
      );
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère toutes les familles
   */
  async getAllFamilies(req: Request, res: Response, next: NextFunction) {
    try {
      const families = await adminService.getAllFamilies();
      
      // Log de l'action administrative
      logAdminAction(
        req.user.id,
        "view",
        "families",
        undefined,
        { action: "Consultation de la liste des familles" },
        req.ip
      );
      
      res.json(families);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les détails d'une famille
   */
  async getFamilyDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const familyId = parseInt(req.params.id);
      const family = await adminService.getFamilyDetails(familyId);
      
      if (!family) {
        return res.status(404).json({ error: "Famille non trouvée" });
      }
      
      // Log de l'action administrative
      logAdminAction(
        req.user.id,
        "view",
        "family",
        familyId,
        { action: "Consultation des détails d'une famille" },
        req.ip
      );
      
      res.json(family);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les logs d'administration
   */
  async getAdminLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await adminService.getAdminLogs(limit);
      
      res.json(logs);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les transactions financières
   */
  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const transactions = await adminService.getAllTransactions(limit);
      
      // Log de l'action administrative
      logAdminAction(
        req.user.id,
        "view",
        "transactions",
        undefined,
        { action: "Consultation des transactions financières" },
        req.ip
      );
      
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les statistiques financières
   */
  async getFinancialStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getFinancialStats();
      
      // Log de l'action administrative
      logAdminAction(
        req.user.id,
        "view",
        "financial_stats",
        undefined,
        { action: "Consultation des statistiques financières" },
        req.ip
      );
      
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();