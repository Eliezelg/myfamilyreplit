import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import 'dotenv/config';
import path from 'path';
import { setupTestUploadRoutes } from "./test-upload";
import { setupSecurityMiddleware } from "./middleware/security";
import { securityLogger } from "./middleware/security-logger";
import { csrfProtection, setupCSRF } from "./middleware/csrf-protection";
import { bruteForceProtection } from "./middleware/auth-protection";
import { setupAuth } from "./auth"; // Added for authentication setup


const app = express();

// Configurer les middlewares
app.use(express.json({ limit: '1mb' })); // Limite la taille du JSON
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Servir les fichiers de traduction
app.use('/locales', express.static(path.join(process.cwd(), 'public/locales')));

// Cette route de secours a été supprimée car nous utilisons directement R2 dans tous les environnements

// Configurer l'authentification d'abord
setupAuth(app);

// Ensuite appliquer les middleware de sécurité
setupSecurityMiddleware(app);
app.use(securityLogger);
app.use(bruteForceProtection);

// Appliquer la protection des sessions
import { sessionProtection } from "./middleware/session-protection";
app.use(sessionProtection);

// Appliquer le sanitizer pour toutes les routes d'API
import { sanitizeInputs } from "./middleware/sanitizer";
app.use('/api', sanitizeInputs);

// Configuration des cookies pour CSRF
import cookieParser from 'cookie-parser';
app.use(cookieParser());

// Appliquer la protection CSRF après l'authentification, mais exclure les routes d'inscription et de réinitialisation
app.use('/api', (req, res, next) => {
  // Exclure les routes publiques de la protection CSRF
  if (req.path === '/register' || req.path.startsWith('/reset-password')) {
    return next();
  }
  return csrfProtection(req, res, next);
});
app.use(setupCSRF);


app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Add test upload routes before other routes
  setupTestUploadRoutes(app);

  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Gérer spécifiquement les erreurs CSRF
    if (err.code === 'EBADCSRFTOKEN') {
      console.warn('Tentative CSRF invalide:', req.path);
      return res.status(403).json({ 
        message: "Formulaire expiré ou invalide. Veuillez rafraîchir la page et réessayer." 
      });
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });

    // Ne pas relancer l'erreur pour éviter de planter le serveur
    console.error('Erreur serveur:', err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();