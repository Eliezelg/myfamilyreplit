
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Créer le dossier logs s'il n'existe pas
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const securityLogFile = path.join(logsDir, 'security.log');

export function securityLogger(req: Request, res: Response, next: NextFunction) {
  // Créer un événement de sécurité pour les actions sensibles
  const isSensitiveRoute = (
    req.path.includes('/api/login') || 
    req.path.includes('/api/register') || 
    req.path.includes('/api/admin') ||
    req.path.includes('/api/payment') ||
    req.path.includes('/api/user')
  );

  if (isSensitiveRoute) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
      userId: (req.isAuthenticated && typeof req.isAuthenticated === 'function' && req.isAuthenticated()) ? (req.user as any).id : 'anonymous',
      status: 'pending'
    };

    // Intercepter la fin de la requête pour enregistrer le statut
    res.on('finish', () => {
      logEntry.status = res.statusCode.toString();
      
      // Ajouter des informations supplémentaires sur les tentatives suspectes
      if (res.statusCode >= 400) {
        logEntry['alert'] = res.statusCode >= 500 ? 'ERROR' : 'WARNING';
        
        // Pour les routes d'authentification, noter si c'est un échec d'authentification
        if ((req.path.includes('/api/login') || req.path.includes('/api/register')) && res.statusCode === 401) {
          logEntry['event'] = 'FAILED_AUTH';
        }
      }
      
      fs.appendFileSync(
        securityLogFile, 
        JSON.stringify(logEntry) + '\n'
      );
    });
  }
  
  next();
}
