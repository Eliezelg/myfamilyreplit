import { Request, Response, NextFunction } from 'express';
import { Session } from 'express-session';

// Import de la définition étendue de Session depuis auth-middleware.ts
declare module 'express-session' {
  interface Session {
    user?: any;
  }
}

/**
 * Middleware pour vérifier si l'utilisateur est un administrateur
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Vérifier d'abord si l'utilisateur est connecté
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Vous devez être connecté pour accéder à cette ressource' });
  }
  
  // Vérifier si l'utilisateur a le rôle d'administrateur
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Vous n\'avez pas les droits suffisants pour accéder à cette ressource' });
  }
  
  next();
}