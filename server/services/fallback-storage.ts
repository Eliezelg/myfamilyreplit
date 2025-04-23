
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { Request } from 'express';

/**
 * Service de stockage local de secours en cas de défaillance de R2
 */
class FallbackStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'uploads');
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    
    console.log(`FallbackStorageService initialisé avec dossier: ${this.baseDir}`);
  }

  /**
   * Configure multer pour l'upload des fichiers en local
   */
  public getMulterUpload(folderName: string = "general") {
    const uploadDir = path.join(this.baseDir, folderName);
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    console.log(`[FallbackStorage] Configuration multer pour ${folderName} avec stockage local`);
    return multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
          cb(null, uniqueFilename);
        }
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        console.log("Vérification du type de fichier:", file.mimetype);
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
      },
    });
  }

  /**
   * Génère l'URL publique d'un fichier stocké localement
   */
  public getPublicUrl(filePath: string): string {
    return `/uploads/${filePath}`;
  }

  /**
   * Supprime un fichier local
   */
  public async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression du fichier local:", error);
      return false;
    }
  }
}

export const fallbackStorageService = new FallbackStorageService();
