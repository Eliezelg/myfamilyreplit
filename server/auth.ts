import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  const hashedPassword = `${buf.toString("hex")}.${salt}`;
  console.log(`Mot de passe haché: ${hashedPassword.substring(0, 10)}...`);
  return hashedPassword;
}

async function comparePasswords(supplied: string, stored: string) {
  console.log(`Comparaison de mot de passe: ${supplied} avec ${stored.substring(0, 10)}...`);
  const [hashed, salt] = stored.split(".");
  
  if (!hashed || !salt) {
    console.error(`Format de mot de passe invalide: ${stored}`);
    return false;
  }
  
  console.log(`Sel extrait: ${salt.substring(0, 5)}...`);
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  
  const result = timingSafeEqual(hashedBuf, suppliedBuf);
  console.log(`Résultat de la comparaison: ${result}`);
  
  return result;
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "myfamily-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }
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
      // Normaliser le nom d'utilisateur et l'email pour la cohérence
      const normalizedUsername = req.body.username.trim();
      const normalizedEmail = req.body.email.trim().toLowerCase();
      
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
