import { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';

// Type déclaration pour req.csrfToken
declare global {
  namespace Express {
    interface Request {
      csrfToken?: () => string;
    }
  }
}

// Configuration de la protection CSRF avec des exclusions explicites
const csrfProtection = csrf({ 
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});

// Middleware pour injecter le token CSRF dans les réponses
export function setupCSRF(req: Request, res: Response, next: NextFunction) {
  // Debug
  console.log(`[CSRF] Traitement de la requête: ${req.method} ${req.path}`);
  
  try {
    // Si c'est une route d'API GET, on ajoute le token CSRF
    if (req.method === 'GET' && req.path.startsWith('/api/')) {
      if (typeof req.csrfToken === 'function') {
        const token = req.csrfToken();
        console.log(`[CSRF] Token généré: ${token.substring(0, 8)}...`);
        
        res.cookie('XSRF-TOKEN', token, {
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: false
        });
      } else {
        console.log('[CSRF] Aucune fonction csrfToken disponible');
      }
    }
    next();
  } catch (error) {
    console.error('[CSRF] Erreur lors de la configuration CSRF:', error);
    next(error);
  }
}

// Middleware pour gérer explicitement les requêtes sans CSRF
export function conditionalCsrfProtection(req: Request, res: Response, next: NextFunction) {
  // Exclure les routes publiques et importantes de la protection CSRF
  const excludedPaths = [
    '/api/register',
    '/api/forgot-password'
  ];
  
  if (req.method === 'POST' && excludedPaths.includes(req.path)) {
    console.log(`[CSRF] Contournement de protection pour: ${req.path}`);
    return next();
  }
  
  // Sinon, appliquer la protection CSRF
  return csrfProtection(req, res, next);
}

export { csrfProtection };