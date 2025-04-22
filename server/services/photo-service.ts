import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { storage } from "../storage";
import { InsertPhoto, Photo } from "../../shared/schema";
import multer from "multer";

/**
 * Service pour gérer toutes les opérations liées aux photos
 */
class PhotoService {
  private uploadDir: string;
  public upload: multer.Multer;

  constructor() {
    // Configurer le répertoire d'upload
    this.uploadDir = path.join(process.cwd(), "uploads");
    this.ensureUploadDirExists();
    
    // Configurer multer pour l'upload de fichiers
    this.upload = this.configureMulter();
  }

  /**
   * S'assure que le répertoire d'upload existe
   */
  private ensureUploadDirExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      console.log("Dossier d'uploads créé:", this.uploadDir);
    }
  }

  /**
   * Configure multer pour l'upload des fichiers
   */
  private configureMulter(): multer.Multer {
    return multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          console.log("Upload directory (photo service):", this.uploadDir);
          cb(null, this.uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
          console.log("Generated filename (photo service):", uniqueFilename);
          cb(null, uniqueFilename);
        }
      }),
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
      },
      fileFilter: (req, file, cb) => {
        console.log("Checking file mimetype (photo service):", file.mimetype);
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error('Seuls les fichiers JPEG et PNG sont autorisés'));
        }
        cb(null, true);
      }
    });
  }

  /**
   * Vérifie si un utilisateur est membre d'une famille
   */
  async checkUserIsFamilyMember(userId: number, familyId: number): Promise<boolean> {
    return await storage.userIsFamilyMember(userId, familyId);
  }

  /**
   * Ajoute une nouvelle photo
   */
  async addPhoto(photoData: InsertPhoto): Promise<Photo> {
    return await storage.addPhoto(photoData);
  }

  /**
   * Récupère les photos d'une famille pour un mois donné
   */
  async getFamilyPhotos(familyId: number, monthYear?: string): Promise<Photo[]> {
    const currentMonthYear = this.getCurrentMonthYear();
    return await storage.getFamilyPhotos(familyId, monthYear || currentMonthYear);
  }

  /**
   * Obtient le mois-année courant au format YYYY-MM
   */
  getCurrentMonthYear(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Crée un objet photo avec les champs nécessaires pour l'insertion
   */
  createPhotoData(userId: number, familyId: number, filename: string, caption: string, fileSize: number): InsertPhoto {
    const imageUrl = `/uploads/${filename}`;
    const monthYear = this.getCurrentMonthYear();

    return {
      familyId,
      userId,
      caption: caption || "",
      imageUrl,
      monthYear,
      fileSize
    };
  }
}

export const photoService = new PhotoService();