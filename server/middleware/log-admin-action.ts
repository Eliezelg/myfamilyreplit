import { Request, Response, NextFunction } from "express";
import { adminService } from "../services/admin-service";

/**
 * Middleware pour enregistrer les actions administratives
 */
export function logAdminAction(action: string, entityType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Stocker la réponse originale
    const originalSend = res.send;
    
    // Remplacer la méthode send pour capturer les réponses
    res.send = function(body?: any): Response {
      // Restaurer la méthode send originale
      res.send = originalSend;
      
      // Traiter la réponse
      try {
        if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
          // Réponse réussie, logger l'action
          const entityId = parseInt(req.params.id) || null;
          
          // Créer le log avec les détails de la requête
          adminService.createAdminLog({
            adminId: req.user.id,
            action,
            entityType,
            entityId,
            details: {
              method: req.method,
              path: req.path,
              body: req.body,
              response: typeof body === 'string' ? JSON.parse(body) : body
            },
            ipAddress: req.ip,
          }).catch(error => {
            console.error("Erreur lors de la création du log admin:", error);
          });
        }
      } catch (error) {
        console.error("Erreur dans le middleware de log:", error);
      }
      
      // Continuer avec la réponse normale
      return originalSend.call(this, body);
    };
    
    next();
  };
}