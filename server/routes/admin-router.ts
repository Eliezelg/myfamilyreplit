import express from "express";
import { adminController } from "../controllers/admin-controller";
import { isAdmin, isSuperAdmin } from "../middleware/admin-auth";
import { logAdminAction } from "../middleware/log-admin-action";

export const adminRouter = express.Router();

// Routes protégées par middleware admin
// statistiques générales
adminRouter.get(
  "/stats",
  isAdmin,
  logAdminAction("view", "dashboard_stats"),
  adminController.getDashboardStats
);

// liste des utilisateurs
adminRouter.get(
  "/users",
  isAdmin,
  logAdminAction("view", "users"),
  adminController.getAllUsers
);

// mise à jour du rôle d'un utilisateur
adminRouter.put(
  "/users/:id/role",
  isAdmin,
  adminController.updateUserRole
);

// suppression d'un utilisateur
adminRouter.delete(
  "/users/:id",
  isAdmin,
  adminController.deleteUser
);

// liste des familles
adminRouter.get(
  "/families",
  isAdmin,
  logAdminAction("view", "families"),
  adminController.getAllFamilies
);

// détails d'une famille
adminRouter.get(
  "/families/:id",
  isAdmin,
  logAdminAction("view", "family"),
  adminController.getFamilyDetails
);

// liste des transactions
adminRouter.get(
  "/transactions",
  isAdmin,
  logAdminAction("view", "transactions"),
  adminController.getAllTransactions
);

// statistiques financières
adminRouter.get(
  "/financial-stats",
  isAdmin,
  logAdminAction("view", "financial_stats"),
  adminController.getFinancialStats
);

// logs d'administration (pour super admin uniquement)
adminRouter.get(
  "/logs",
  isSuperAdmin,
  adminController.getAdminLogs
);