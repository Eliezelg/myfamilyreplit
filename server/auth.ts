import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { emailController } from "./controllers/email-controller";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  // Augmentation du coût de hachage pour une sécurité accrue
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64, { N: 16384, r: 8, p: 1 })) as Buffer;
  const hashedPassword = `${buf.toString("hex")}.${salt}`;
  
  // Éviter de logger les mots de passe même partiellement
  console.log(`Hachage du mot de passe effectué`);
  return hashedPassword;
}

export async function comparePasswords(supplied: string, stored: string) {
  const startTime = Date.now();
  
  // Ne pas logger les informations sensibles
  console.log(`Vérification d'authentification en cours`);
  
  const [hashed, salt] = stored.split(".");
  
  if (!hashed || !salt) {
    console.error(`Erreur de format d'authentification`);
    // Simuler un délai constant pour éviter les attaques temporelles
    await ensureMinimumTime(startTime);
    return false;
  }
  
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64, { N: 16384, r: 8, p: 1 })) as Buffer;
    
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    
    // Pas de détails sur le résultat dans les logs
    console.log(`Processus d'authentification terminé`);
    
    // Assurer un temps d'exécution constant
    await ensureMinimumTime(startTime);
    return result;
  } catch (error) {
    console.error(`Erreur lors du processus d'authentification:`, error);
    // Simuler un délai constant pour éviter les attaques temporelles
    await ensureMinimumTime(startTime);
    return false;
  }
}

// Fonction utilitaire pour assurer un temps d'exécution minimum
async function ensureMinimumTime(startTime: number, minTimeMs: number = 1000) {
  const elapsedTime = Date.now() - startTime;
  if (elapsedTime < minTimeMs) {
    await new Promise(resolve => setTimeout(resolve, minTimeMs - elapsedTime));
  }
}

// Alias pour compatibilité
export const verifyPassword = comparePasswords;

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "myfamily-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure en production uniquement
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    },
    name: "myfamily_sid", // Nom de cookie personnalisé
    rolling: true, // Réinitialise le délai d'expiration à chaque requête
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        // Permettre d'utiliser le champ "username" pour l'email ou le nom d'utilisateur
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: false
      },
      async (username, password, done) => {
        try {
          console.log(`Tentative de connexion pour l'utilisateur/email: ${username}`);
          const user = await storage.getUserByUsername(username);
          
          if (!user) {
            console.log(`Utilisateur/email non trouvé: ${username}`);
            return done(null, false, { message: "שם משתמש או דוא״ל לא קיים" });
          }
          
          // Vérifier le format du mot de passe stocké
          if (!user.password.includes('.')) {
            console.log(`Format de mot de passe invalide pour l'utilisateur: ${username}`);
            return done(null, false, { message: "תקלה בפורמט הסיסמה, נא ליצור קשר עם מנהל המערכת" });
          }
          
          const isPasswordValid = await comparePasswords(password, user.password);
          console.log(`Vérification du mot de passe pour ${username}: ${isPasswordValid ? 'réussie' : 'échouée'}`);
          
          if (!isPasswordValid) {
            return done(null, false, { message: "סיסמה שגויה" });
          } else {
            return done(null, user);
          }
        } catch (error) {
          console.error('Erreur d\'authentification:', error);
          return done(error);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Vérifier que tous les champs requis sont présents
      if (!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).send("Tous les champs sont obligatoires");
      }
      
      // Normaliser le nom d'utilisateur et l'email pour la cohérence
      const normalizedUsername = req.body.username.trim();
      const normalizedEmail = req.body.email.trim().toLowerCase();
      
      // Validation du format de l'email
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).send("Format d'email invalide");
      }
      
      // Validation de la complexité du mot de passe
      const password = req.body.password;
      if (password.length < 8) {
        return res.status(400).send("Le mot de passe doit contenir au moins 8 caractères");
      }
      
      // Vérifier au moins une lettre et un chiffre
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      if (!hasLetter || !hasNumber) {
        return res.status(400).send("Le mot de passe doit contenir au moins une lettre et un chiffre");
      }
      
      // Vérifier si le nom d'utilisateur existe déjà
      const existingUser = await storage.getUserByUsername(normalizedUsername);
      if (existingUser) {
        return res.status(400).send("שם המשתמש כבר קיים במערכת");
      }
      
      // Vérifier si l'email existe déjà
      const existingEmail = await storage.getUserByEmail(normalizedEmail);
      if (existingEmail) {
        return res.status(400).send("כתובת הדוא״ל כבר בשימוש");
      }

      const user = await storage.createUser({
        ...req.body,
        username: normalizedUsername,
        email: normalizedEmail,
        password: await hashPassword(req.body.password),
      });

      console.log(`Nouvel utilisateur créé: ${user.username} (${user.email}) - ID: ${user.id}`);

      // Envoyer un email de bienvenue
      try {
        await emailController.sendWelcomeEmail(user);
        console.log(`Email de bienvenue envoyé à ${user.email}`);
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', emailError);
        // Continuer le processus même si l'email échoue
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        // info contient le message d'erreur de la stratégie
        return res.status(401).send(info?.message || "שם משתמש או סיסמה שגויים");
      }
      req.login(user, (err: Error | null) => {
        if (err) {
          return next(err);
        }
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
