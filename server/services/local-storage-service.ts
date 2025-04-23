import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { Request } from "express";

/**
 * Service pour gérer le stockage local des fichiers
 * Cette solution est temporaire en attendant que Cloudflare R2 soit correctement configuré
 */
class LocalStorageService {
  private uploadDir: string;

  constructor() {
    // Créer le dossier d'uploads s'il n'existe pas
    this.uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    console.log("LocalStorageService initialisé avec dossier:", this.uploadDir);
  }

  /**
   * Configure multer pour l'upload local des fichiers
   */
  public getMulterUpload(folderName: string = "general") {
    // Créer le sous-dossier pour les uploads
    const destinationPath = path.join(this.uploadDir, folderName);
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }

    return multer({
      storage: multer.diskStorage({
        destination: (req: Request, file: Express.Multer.File, cb) => {
          cb(null, destinationPath);
        },
        filename: (req: Request, file: Express.Multer.File, cb) => {
          const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
          cb(null, uniqueFilename);
        }
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        // Types de fichiers autorisés selon le dossier
        let allowedTypes: string[] = [];

        if (folderName === "gazettes") {
          allowedTypes = ["application/pdf"];
        } else {
          allowedTypes = ["image/jpeg", "image/png"];
        }

        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error(`Seuls les fichiers ${allowedTypes.join(", ")} sont autorisés pour ${folderName}`));
        }
        cb(null, true);
      }
    });
  }

  /**
   * Génère l'URL pour accéder à un fichier local
   */
  public getPublicUrl(filename: string, folderName: string = "general"): string {
    // Construire une URL relative à partir du dossier de uploads
    return `/uploads/${folderName}/${filename}`;
  }
}

// Exporter une instance unique du service
export const localStorageService = new LocalStorageService();