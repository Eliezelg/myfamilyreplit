import { Express } from "express";
import { adminController } from "../controllers/admin-controller";
import { requireAdmin, logAdminMiddleware } from "../middleware/admin-auth";

export function registerAdminRoutes(app: Express) {
  // Middleware pour vérifier que l'utilisateur est admin sur toutes les routes /api/admin
  app.use("/api/admin", requireAdmin);
  
  // Dashboard stats
  app.get(
    "/api/admin/stats", 
    adminController.getDashboardStats.bind(adminController)
  );
  
  // Users management
  app.get(
    "/api/admin/users", 
    logAdminMiddleware("read", "users"),
    adminController.getAllUsers.bind(adminController)
  );
  
  app.put(
    "/api/admin/users/:id/role", 
    logAdminMiddleware("update", "user"),
    adminController.updateUserRole.bind(adminController)
  );
  
  app.delete(
    "/api/admin/users/:id", 
    logAdminMiddleware("delete", "user"),
    adminController.deleteUser.bind(adminController)
  );
  
  // Families management
  app.get(
    "/api/admin/families", 
    logAdminMiddleware("read", "families"),
    adminController.getAllFamilies.bind(adminController)
  );
  
  app.get(
    "/api/admin/families/:id", 
    logAdminMiddleware("read", "family"),
    adminController.getFamilyDetails.bind(adminController)
  );
  
  // Admin logs
  app.get(
    "/api/admin/logs", 
    logAdminMiddleware("read", "admin_logs"),
    adminController.getAdminLogs.bind(adminController)
  );
  
  // Financial management
  app.get(
    "/api/admin/transactions", 
    logAdminMiddleware("read", "transactions"),
    adminController.getTransactions.bind(adminController)
  );
  
  app.get(
    "/api/admin/financial-stats", 
    logAdminMiddleware("read", "financial_stats"),
    adminController.getFinancialStats.bind(adminController)
  );
}