
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
  // Si c'est une route d'API GET, on ajoute le token CSRF
  if (req.method === 'GET' && req.path.startsWith('/api/')) {
    // Utiliser csrf middleware pour cette requête spécifique
    csrf({ 
      cookie: {
        key: '_csrf',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      }
    })(req, res, function(err) {
      if (err) {
        // En cas d'erreur, on continue sans bloquer
        console.warn('Erreur génération CSRF:', err);
        return next();
      }
      
      try {
        // Si req.csrfToken existe maintenant, on l'utilise
        if (typeof req.csrfToken === 'function') {
          const token = req.csrfToken();
          res.cookie('XSRF-TOKEN', token, {
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false
          });
        }
        next();
      } catch (err) {
        console.warn('Erreur CSRF:', err);
        next();
      }
    });
  } else {
    // Pour les autres routes, on continue normalement
    next();
  }
}

export { csrfProtection };
