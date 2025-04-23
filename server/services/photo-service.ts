import { storage } from "../storage";
import { InsertPhoto, Photo } from "../../shared/schema";
import { r2StorageService } from "./r2-storage-service";
import { localStorageService } from "./local-storage-service";
import multer from "multer";

/**
 * Service pour gérer toutes les opérations liées aux photos
 */
class PhotoService {
  public upload: multer.Multer;
  private useLocalStorage: boolean = false; // Utilisation de R2 pour le stockage

  constructor() {
    // Choisir entre R2 et stockage local
    if (this.useLocalStorage) {
      this.upload = localStorageService.getMulterUpload("photos");
      console.log("PhotoService initialisé avec stockage LOCAL");
    } else {
      this.upload = r2StorageService.getMulterUpload("photos");
      console.log("PhotoService initialisé avec stockage R2");
    }
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
  createPhotoData(userId: number, familyId: number, fileKey: string, caption: string, fileSize: number): InsertPhoto {
    // Choisir entre R2 et stockage local pour l'URL publique
    let imageUrl: string;
    if (this.useLocalStorage) {
      imageUrl = localStorageService.getPublicUrl(fileKey, 'photos');
      console.log("URL locale générée:", imageUrl);
    } else {
      imageUrl = r2StorageService.getPublicUrl(fileKey);
      console.log("URL R2 générée:", imageUrl);
    }
    
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