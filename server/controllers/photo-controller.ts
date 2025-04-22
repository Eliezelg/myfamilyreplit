import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import path from "path";
import { InsertPhoto } from "../../shared/schema";

/**
 * Contrôleur pour gérer les requêtes liées aux photos
 */
class PhotoController {
  /**
   * Ajoute une nouvelle photo à une famille
   */
  async uploadPhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { familyId, caption } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      
      if (!familyId) {
        return res.status(400).json({ message: "L'ID de la famille est requis" });
      }
      
      // Vérifier que l'utilisateur est membre de la famille
      const isMember = await storage.userIsFamilyMember(userId, parseInt(familyId));
      
      if (!isMember) {
        return res.status(403).json({ message: "Vous n'êtes pas membre de cette famille" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier n'a été téléchargé" });
      }
      
      // Date actuelle formatée comme YYYY-MM
      const now = new Date();
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Chemin relatif de l'image
      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Préparer les données pour l'insertion
      const photoData: InsertPhoto = {
        familyId: parseInt(familyId),
        userId,
        caption: caption || "",
        imageUrl,
        monthYear,
        fileSize: req.file.size
      };
      
      // Ajouter la photo à la base de données
      const photo = await storage.addPhoto(photoData);
      
      return res.json(photo);
    } catch (error: any) {
      console.error("Erreur lors de l'upload de photo:", error);
      next(error);
    }
  }

  /**
   * Récupère les photos d'une famille pour un mois spécifique
   */
  async getFamilyPhotos(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const familyId = parseInt(req.params.id);
      const { monthYear } = req.query;
      
      if (!userId) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      
      // Vérifier que l'utilisateur est membre de la famille
      const isMember = await storage.userIsFamilyMember(userId, familyId);
      
      if (!isMember) {
        return res.status(403).json({ message: "Vous n'êtes pas membre de cette famille" });
      }
      
      // Récupérer les photos de la famille
      const photos = await storage.getFamilyPhotos(
        familyId, 
        monthYear as string || this.getCurrentMonthYear()
      );
      
      return res.json(photos);
    } catch (error: any) {
      next(error);
    }
  }
  
  /**
   * Obtient le mois-année courant au format YYYY-MM
   */
  private getCurrentMonthYear(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}

export const photoController = new PhotoController();