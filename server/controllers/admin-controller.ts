import { Request, Response } from "express";
import { adminService } from "../services/admin-service";
import { logAdminAction } from "../middleware/log-admin-action";

/**
 * Contrôleur pour les fonctionnalités administratives
 */
export class AdminController {
  /**
   * Statistiques générales du tableau de bord
   */
  async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await adminService.getDashboardStats();
      return res.status(200).json(stats);
    } catch (error: any) {
      console.error("Erreur stats admin:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Liste des utilisateurs
   */
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await adminService.getAllUsers();
      return res.status(200).json(users);
    } catch (error: any) {
      console.error("Erreur liste utilisateurs admin:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Liste des familles
   */
  async getAllFamilies(req: Request, res: Response) {
    try {
      const families = await adminService.getAllFamilies();
      return res.status(200).json(families);
    } catch (error: any) {
      console.error("Erreur liste familles admin:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Détails d'une famille
   */
  async getFamilyDetails(req: Request, res: Response) {
    try {
      const familyId = parseInt(req.params.id);
      if (isNaN(familyId)) {
        return res.status(400).json({ message: "ID de famille invalide" });
      }

      const family = await adminService.getFamilyDetails(familyId);
      if (!family) {
        return res.status(404).json({ message: "Famille non trouvée" });
      }

      return res.status(200).json(family);
    } catch (error: any) {
      console.error("Erreur détails famille admin:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Liste des transactions
   */
  async getAllTransactions(req: Request, res: Response) {
    try {
      const transactions = await adminService.getAllTransactions();
      return res.status(200).json(transactions);
    } catch (error: any) {
      console.error("Erreur transactions admin:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Statistiques financières
   */
  async getFinancialStats(req: Request, res: Response) {
    try {
      const stats = await adminService.getFinancialStats();
      return res.status(200).json(stats);
    } catch (error: any) {
      console.error("Erreur stats financières admin:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Liste des logs admin
   */
  async getAdminLogs(req: Request, res: Response) {
    try {
      const logs = await adminService.getAdminLogs();
      return res.status(200).json(logs);
    } catch (error: any) {
      console.error("Erreur logs admin:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Mise à jour du rôle d'un utilisateur
   */
  async updateUserRole(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID utilisateur invalide" });
      }

      if (!role || typeof role !== "string") {
        return res.status(400).json({ message: "Rôle invalide" });
      }

      // Empêcher la modification des super admins par des admins
      if (req.user && req.user.role !== "superadmin") {
        const currentUser = await adminService.getAllUsers().then(users => 
          users.find(u => u.id === userId)
        );

        if (currentUser && currentUser.role === "superadmin") {
          return res.status(403).json({ 
            message: "Vous n'avez pas les droits pour modifier un super administrateur" 
          });
        }

        if (role === "superadmin") {
          return res.status(403).json({ 
            message: "Seul un super administrateur peut attribuer le rôle de super administrateur" 
          });
        }
      }

      const updatedUser = await adminService.updateUserRole(userId, role);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Créer un log administratif
      if (req.user) {
        await adminService.createAdminLog({
          adminId: req.user.id,
          action: "update",
          entityType: "user_role",
          entityId: userId,
          details: { oldRole: null, newRole: role },
          ipAddress: req.ip
        });
      }

      return res.status(200).json(updatedUser);
    } catch (error: any) {
      console.error("Erreur mise à jour rôle utilisateur:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Suppression d'un utilisateur
   */
  async deleteUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID utilisateur invalide" });
      }

      // Vérifier qu'on ne supprime pas notre propre compte
      if (req.user && req.user.id === userId) {
        return res.status(400).json({ 
          message: "Vous ne pouvez pas supprimer votre propre compte" 
        });
      }

      // Empêcher la suppression des super admins par des admins
      if (req.user && req.user.role !== "superadmin") {
        const userToDelete = await adminService.getAllUsers().then(users => 
          users.find(u => u.id === userId)
        );

        if (userToDelete && userToDelete.role === "superadmin") {
          return res.status(403).json({ 
            message: "Vous n'avez pas les droits pour supprimer un super administrateur" 
          });
        }
      }

      const deletedUser = await adminService.deleteUser(userId);
      
      if (!deletedUser) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Créer un log administratif
      if (req.user) {
        await adminService.createAdminLog({
          adminId: req.user.id,
          action: "delete",
          entityType: "user",
          entityId: userId,
          details: { deletedUser },
          ipAddress: req.ip
        });
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Erreur suppression utilisateur:", error);
      return res.status(500).json({ message: error.message });
    }
  }
}

// Singleton
export const adminController = new AdminController();