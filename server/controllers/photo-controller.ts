import { Request, Response, NextFunction } from "express";
import { photoService } from "../services/photo-service";

// Type pour le fichier de multer-s3 qui inclut la clé et l'emplacement
interface MulterS3File extends Express.Multer.File {
  key: string;
  location: string;
  bucket: string;
}

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
      const isMember = await photoService.checkUserIsFamilyMember(userId, parseInt(familyId));
      
      if (!isMember) {
        return res.status(403).json({ message: "Vous n'êtes pas membre de cette famille" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier n'a été téléchargé" });
      }
      
      // Vérifier si le fichier provient de multer-s3 ou du stockage local
      const file = req.file;
      let fileKey: string;
      let fileSize: number;
      
      // Déterminer le type de stockage utilisé
      if ('key' in file) {
        // C'est un fichier S3/R2
        const s3File = file as MulterS3File;
        console.log("Photo téléchargée sur R2:", s3File.key);
        fileKey = s3File.key;
        fileSize = s3File.size;
      } else {
        // C'est un fichier local
        console.log("Photo téléchargée localement:", file.filename);
        fileKey = file.filename;
        fileSize = file.size;
      }
      
      // Créer les données de la photo via le service
      const photoData = photoService.createPhotoData(
        userId,
        parseInt(familyId),
        fileKey,
        caption || "",
        fileSize
      );
      
      // Ajouter la photo à la base de données via le service
      const photo = await photoService.addPhoto(photoData);
      
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
      
      // Vérifier que l'utilisateur est membre de la famille via le service
      const isMember = await photoService.checkUserIsFamilyMember(userId, familyId);
      
      if (!isMember) {
        return res.status(403).json({ message: "Vous n'êtes pas membre de cette famille" });
      }
      
      // Récupérer les photos de la famille via le service
      const photos = await photoService.getFamilyPhotos(familyId, monthYear as string);
      
      return res.json(photos);
    } catch (error: any) {
      next(error);
    }
  }
}

export const photoController = new PhotoController();