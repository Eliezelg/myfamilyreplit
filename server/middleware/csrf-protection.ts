
import { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';

// Configuration de la protection CSRF
const csrfProtection = csrf({ 
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'] // Ignorer ces méthodes
});

// Middleware pour injecter le token CSRF dans les réponses
export function setupCSRF(req: Request, res: Response, next: NextFunction) {
  // Ajouter une méthode csrfToken au request si elle n'existe pas encore
  if (!req.csrfToken && req.session) {
    // On continue sans erreur, le middleware csrfProtection l'ajoutera plus tard
    next();
    return;
  }
  
  try {
    if (req.method === 'GET' && req.path.startsWith('/api/')) {
      const token = req.csrfToken();
      res.cookie('XSRF-TOKEN', token, {
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false
      });
    }
    next();
  } catch (err) {
    // En cas d'erreur, on continue sans bloquer la requête
    console.warn('Erreur CSRF:', err);
    next();
  }
}

export { csrfProtection };
