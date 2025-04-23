
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Stockage des tentatives en mémoire
const loginAttempts = new Map<string, { count: number, lastAttempt: number, lockUntil: number }>();

// Période d'expiration des tentatives (30 minutes)
const EXPIRY_TIME = 30 * 60 * 1000;

// Seuil de blocage (5 tentatives)
const MAX_ATTEMPTS = 5;

// Durée de blocage après dépassement du seuil (30 minutes)
const LOCK_TIME = 30 * 60 * 1000;

// Chemin du fichier de log
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const authLogFile = path.join(logsDir, 'auth_attempts.log');

export function bruteForceProtection(req: Request, res: Response, next: NextFunction) {
  // Ne s'applique qu'aux routes d'authentification
  if (req.path !== '/api/login' && req.path !== '/api/register') {
    return next();
  }

  // Identifiant unique basé sur l'IP et l'utilisateur si disponible
  const username = req.body.username || req.body.email || 'unknown';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const clientId = `${ip}:${username}`;
  
  // Nettoyage des entrées expirées
  cleanupExpiredEntries();
  
  // Vérifier si l'utilisateur est verrouillé
  const userAttempts = loginAttempts.get(clientId) || { count: 0, lastAttempt: Date.now(), lockUntil: 0 };
  
  // Si l'utilisateur est verrouillé
  if (userAttempts.lockUntil > Date.now()) {
    const remainingTime = Math.ceil((userAttempts.lockUntil - Date.now()) / 60000);
    
    // Log de la tentative bloquée
    logAttempt(clientId, 'BLOCKED', req.path);
    
    return res.status(429).json({
      error: 'Too many failed attempts',
      message: `Votre compte est temporairement verrouillé. Réessayez dans ${remainingTime} minutes.`
    });
  }
  
  // Intercepter la fin de la requête pour vérifier le résultat
  const originalSend = res.send;
  res.send = function(body) {
    const statusCode = res.statusCode;
    
    // Si c'est un échec d'authentification (401 ou 400)
    if ((statusCode === 401 || statusCode === 400) && (req.path === '/api/login' || req.path === '/api/register')) {
      userAttempts.count += 1;
      userAttempts.lastAttempt = Date.now();
      
      // Si l'utilisateur a dépassé le nombre de tentatives, verrouiller
      if (userAttempts.count >= MAX_ATTEMPTS) {
        userAttempts.lockUntil = Date.now() + LOCK_TIME;
        logAttempt(clientId, 'LOCKED', req.path);
      } else {
        logAttempt(clientId, 'FAILED', req.path);
      }
      
      loginAttempts.set(clientId, userAttempts);
      
      // Ajouter l'information sur les tentatives restantes
      const attemptsLeft = MAX_ATTEMPTS - userAttempts.count;
      if (attemptsLeft > 0) {
        let jsonBody;
        try {
          jsonBody = JSON.parse(body);
        } catch (e) {
          jsonBody = { message: body };
        }
        
        jsonBody.attemptsLeft = attemptsLeft;
        return originalSend.call(res, JSON.stringify(jsonBody));
      }
    } 
    // Si c'est un succès (200), réinitialiser le compteur
    else if (statusCode === 200 || statusCode === 201) {
      if (loginAttempts.has(clientId)) {
        loginAttempts.delete(clientId);
        logAttempt(clientId, 'SUCCESS', req.path);
      }
    }
    
    return originalSend.call(res, body);
  };
  
  next();
}

// Nettoie les entrées expirées du map
function cleanupExpiredEntries() {
  const now = Date.now();
  
  for (const [key, value] of loginAttempts.entries()) {
    // Si l'entrée a expiré et n'est pas verrouillée
    if (value.lastAttempt + EXPIRY_TIME < now && value.lockUntil < now) {
      loginAttempts.delete(key);
    }
  }
}

// Fonction pour logger les tentatives
function logAttempt(clientId: string, status: string, path: string) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    clientId,
    status,
    path
  };
  
  fs.appendFileSync(
    authLogFile,
    JSON.stringify(logEntry) + '\n'
  );
}
