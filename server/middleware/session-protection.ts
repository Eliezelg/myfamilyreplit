
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware pour protéger contre les attaques de fixation de session
 * Génère une nouvelle session à chaque authentification
 */
export function sessionProtection(req: Request, res: Response, next: NextFunction) {
  // Si l'utilisateur vient de s'authentifier
  if (req.path === '/api/login' && req.method === 'POST' && res.statusCode === 200) {
    const regenerateSession = (cb: (err: any) => void) => {
      const userId = req.user ? (req.user as any).id : null;
      
      // Regénérer la session après une connexion réussie
      req.session.regenerate((err) => {
        if (err) return cb(err);
        
        // Réassocier l'utilisateur à sa nouvelle session
        if (userId) {
          (req.session as any).userId = userId;
        }
        
        cb(null);
      });
    };
    
    regenerateSession((err) => {
      if (err) {
        console.error('Erreur lors de la régénération de session:', err);
      }
    });
  }
  
  // Vérifier l'origine des requêtes pour les actions sensibles
  const isSensitiveAction = req.method !== 'GET' && req.path.startsWith('/api/');
  if (isSensitiveAction) {
    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';
    const host = req.headers.host || '';
    
    // Vérifier si l'origine est valide (vient de notre site)
    if (origin && !origin.includes(host) && !referer.includes(host)) {
      console.warn(`Requête avec origine suspecte: ${origin}, referer: ${referer}, host: ${host}`);
      return res.status(403).send('Accès interdit - mauvaise origine');
    }
  }
  
  next();
}
