import { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';

// Configuration de la protection CSRF
const csrfProtection = csrf({ 
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
});

// Middleware pour injecter le token CSRF dans les réponses
export function setupCSRF(req: Request, res: Response, next: NextFunction) {
  // Si c'est une route d'API GET, on ajoute le token CSRF
  if (req.method === 'GET' && req.path.startsWith('/api/')) {
    res.cookie('XSRF-TOKEN', req.csrfToken?.() || '', {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false
    });
  }
  next();
}

export { csrfProtection };