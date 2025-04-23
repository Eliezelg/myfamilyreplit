import { Request, Response, NextFunction } from "express";

/**
 * Middleware pour vérifier si l'utilisateur est un administrateur
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  
  if (req.user && (req.user.role === "admin" || req.user.role === "superadmin")) {
    return next();
  }
  
  return res.status(403).json({ message: "Accès refusé - Droits administrateur requis" });
}

/**
 * Middleware pour vérifier si l'utilisateur est un super administrateur
 */
export function isSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  
  if (req.user && req.user.role === "superadmin") {
    return next();
  }
  
  return res.status(403).json({ message: "Accès refusé - Droits super administrateur requis" });
}