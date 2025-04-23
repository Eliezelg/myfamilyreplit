
import helmet from 'helmet';
import { Express, Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';

export function setupSecurityMiddleware(app: Express) {
  // Configuration Helmet pour les en-têtes de sécurité
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https://*.r2.cloudflarestorage.com"],
          connectSrc: ["'self'", "https://*.r2.cloudflarestorage.com"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
          blockAllMixedContent: [],
        },
      },
      xssFilter: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: {
        maxAge: 15552000, // 180 jours
        includeSubDomains: true,
        preload: true
      },
      frameguard: { action: 'deny' },
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    })
  );

  // Ajouter des en-têtes de sécurité supplémentaires
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    
    // Empêcher l'accès direct aux fichiers sensibles
    const sensitivePatterns = [/\.env$/i, /\.log$/i, /\.config$/i, /\.sql$/i, /\.json$/i];
    const requestPath = req.path.toLowerCase();
    
    if (sensitivePatterns.some(pattern => pattern.test(requestPath))) {
      return res.status(403).send('Accès interdit');
    }
    
    next();
  });

  // Limiteur de débit pour les requêtes d'API
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes par fenêtre
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard',
  });
  
  // Limiteur de débit plus strict pour les routes d'authentification
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 tentatives par fenêtre
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer plus tard',
  });

  // Appliquer le limiteur aux routes d'API
  app.use('/api/', apiLimiter);
  
  // Appliquer le limiteur d'authentification
  app.use('/api/login', authLimiter);
  app.use('/api/register', authLimiter);
}
