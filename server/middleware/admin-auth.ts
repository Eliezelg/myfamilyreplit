import { Request, Response, NextFunction } from "express";
import { AdminLog, InsertAdminLog, adminLogs } from "@shared/schema";
import { db } from "../db";

/**
 * Middleware qui vérifie si l'utilisateur est administrateur
 * À utiliser sur les routes d'administration
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ error: "Accès non autorisé" });
  }

  // L'utilisateur est bien un administrateur
  next();
}

/**
 * Crée un log d'action administrative
 */
export async function logAdminAction(
  adminId: number | undefined,
  action: string,
  entityType: string,
  entityId?: number,
  details?: any,
  ipAddress?: string
): Promise<AdminLog | null> {
  if (!adminId) {
    console.warn("Tentative d'enregistrement d'un log admin sans ID d'administrateur");
    return null;
  }
  const logData: InsertAdminLog = {
    adminId,
    action,
    entityType,
    entityId,
    details,
    ipAddress
  };

  try {
    const [log] = await db.insert(adminLogs).values(logData).returning();
    return log;
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du log admin:", error);
    throw error;
  }
}

/**
 * Middleware qui enregistre l'action administrative
 * @param action Le type d'action (create, read, update, delete)
 * @param entityType Le type d'entité concernée (user, family, etc.)
 */
export function logAdminMiddleware(action: string, entityType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Stocker la méthode originale de res.json pour pouvoir l'intercepter
    const originalJson = res.json;
    const adminId = req.user?.id;
    const ipAddress = req.ip;
    
    // Extraire l'ID de l'entité depuis les paramètres ou le corps de la requête
    const entityId = req.params.id ? parseInt(req.params.id) : undefined;
    const details = { 
      requestBody: req.body,
      requestMethod: req.method,
      requestPath: req.path
    };

    // On remplace temporairement res.json pour intercepter la réponse
    res.json = function(body: any): Response {
      // On remet la méthode originale
      res.json = originalJson;
      
      // On enregistre l'action admin après l'exécution de la requête
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAdminAction(adminId, action, entityType, entityId, details, ipAddress)
          .catch(err => console.error("Erreur lors de l'enregistrement du log admin:", err));
      }
      
      // On continue normalement
      return originalJson.call(this, body);
    };

    next();
  };
}