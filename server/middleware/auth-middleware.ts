import { Request, Response, NextFunction } from 'express';
import { Session } from 'express-session';

// Étendre la définition de Session pour inclure user
declare module 'express-session' {
  interface Session {
    user?: any;
  }
}

/**
 * Middleware pour vérifier si l'utilisateur est authentifié
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Vous devez être connecté pour accéder à cette ressource' });
  }
  next();
}