import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import express from "express";
import { registerGazetteRoutes } from "./gazette/routes";
import { scheduleGazetteGeneration } from "./gazette/scheduler";
import { registerPaymentRoutes } from "./routes/payment-routes";
import { ZCreditAPI } from "./payment/zcredit-api";
import { registerUserRoutes } from "./routes/user-routes";
import { registerChildRoutes } from "./routes/child-routes";
import { registerFamilyRoutes } from "./routes/family-routes"; // Import des routes famille

// Interface étendue pour req.file avec multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// S'assurer que le dossier d'uploads existe
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Dossier d'uploads créé:", uploadDir);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req: Express.Request, file: Express.Multer.File, cb: any) {
      // Logs de débogage
      console.log("Upload destination dir:", uploadDir);
      console.log("Directory exists:", fs.existsSync(uploadDir));
      try {
        // Vérifier les permissions
        fs.accessSync(uploadDir, fs.constants.W_OK);
        console.log("Directory is writable");
      } catch (err) {
        console.error("Directory is not writable:", err);
        // Tentative de correction des permissions
        try {
          fs.chmodSync(uploadDir, 0o777);
          console.log("Changed directory permissions to 777");
        } catch (chmodErr) {
          console.error("Failed to change permissions:", chmodErr);
        }
      }
      cb(null, uploadDir);
    },
    filename: function (req: Express.Request, file: Express.Multer.File, cb: any) {
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      console.log("Generated filename:", uniqueFilename);
      cb(null, uniqueFilename);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req: Express.Request, file: Express.Multer.File, cb: any) {
    console.log("File filter checking:", file.mimetype);
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG and PNG files are allowed'));
    }
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Enregistrer les routes avec la nouvelle architecture MVC
  registerUserRoutes(app);
  registerChildRoutes(app);
  registerFamilyRoutes(app);
  registerPaymentRoutes(app); //Registering Payment routes here
  registerGazetteRoutes(app);
  //registerBasicTestRoutes(app);
  //registerTestUploadRoutes(app);

  const server = createServer(app);
  return server;
}