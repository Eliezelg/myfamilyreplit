import { Request, Response, NextFunction } from "express";
import { childService } from "../services/child-service";
import { r2StorageService } from "../services/r2-storage-service";

// Interface pour multer-s3 qui étend l'interface de fichier standard
interface MulterS3File extends Express.Multer.File {
  key: string;
  location: string;
  bucket: string;
}

/**
 * Contrôleur pour gérer les requêtes liées aux enfants
 */
class ChildController {
  /**
   * Récupère les enfants de l'utilisateur connecté
   */
  async getUserChildren(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const children = await childService.getUserChildren(req.user.id);
      res.json(children);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ajoute un nouvel enfant
   */
  async addChild(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const childData = {
        ...req.body,
        userId: req.user.id
      };
      const child = await childService.addChild(childData);
      res.status(201).json(child);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour les informations d'un enfant
   */
  async updateChild(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const childId = parseInt(req.params.id);

      // Vérifier que l'enfant appartient à l'utilisateur
      const child = await childService.getChild(childId);
      if (!child || child.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }

      const updatedChild = await childService.updateChild(childId, req.body);
      res.json(updatedChild);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprime un enfant
   */
  async deleteChild(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const childId = parseInt(req.params.id);

      // Vérifier que l'enfant appartient à l'utilisateur
      const child = await childService.getChild(childId);
      if (!child || child.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }

      await childService.deleteChild(childId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload de middleware pour les photos de profil d'enfant
   */
  uploadChildPhoto = r2StorageService.getMulterUpload("children-profiles").single("profileImage");

  /**
   * Ajoute une photo de profil à un enfant
   */
  async updateProfilePicture(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const childId = parseInt(req.params.id);

      // Vérifier que l'enfant appartient à l'utilisateur
      const child = await childService.getChild(childId);
      if (!child || child.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }

      if (!req.file) {
        return res.status(400).send("No image uploaded");
      }

      // Récupérer le fichier uploadé via multer-s3
      const s3File = req.file as MulterS3File;
      console.log("Photo d'enfant téléchargée sur R2:", s3File.key);

      // Générer l'URL publique
      const imageUrl = r2StorageService.getPublicUrl(s3File.key);
      
      // Supprimer l'ancienne photo si elle existe et est sur R2
      if (child.profileImage && child.profileImage.includes('r2.dev')) {
        const oldKey = r2StorageService.getKeyFromUrl(child.profileImage);
        if (oldKey) {
          console.log("Suppression de l'ancienne photo d'enfant:", oldKey);
          await r2StorageService.deleteFile(oldKey);
        }
      }

      // Mettre à jour le profil avec l'URL de l'image
      const updatedChild = await childService.updateChild(childId, {
        profileImage: imageUrl
      });

      res.json(updatedChild);
    } catch (error) {
      next(error);
    }
  }
}

export const childController = new ChildController();