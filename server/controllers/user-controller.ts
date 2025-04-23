import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user-service";
import { hashPassword, verifyPassword } from "../auth";
import { r2StorageService } from "../services/r2-storage-service";

// Interface pour les requêtes avec fichier uploadé par Multer
interface MulterRequest extends Request {
  file: Express.Multer.File;
}

// Interface pour multer-s3 qui étend l'interface de fichier standard
interface MulterS3File extends Express.Multer.File {
  key: string;
  location: string;
  bucket: string;
}


/**
 * Contrôleur pour la gestion des utilisateurs
 */
class UserController {
  /**
   * Middleware d'upload de photo de profil
   */
  profileUpload = r2StorageService.getMulterUpload("profiles").single("profileImage");

  /**
   * Récupère le profil de l'utilisateur authentifié
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

      // Renvoyer les informations de l'utilisateur sans le mot de passe
      const { password, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Met à jour le profil de l'utilisateur
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

      // Mettre à jour le profil sans modifier le mot de passe
      const updatedUser = await userService.updateUserProfile(req.user.id, req.body);

      // Renvoyer les informations mises à jour sans le mot de passe
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change le mot de passe de l'utilisateur
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

      const { currentPassword, newPassword } = req.body;

      // Vérifier que le mot de passe actuel est correct
      const isValid = await verifyPassword(currentPassword, req.user.password);
      if (!isValid) {
        return res.status(400).send("Current password is incorrect");
      }

      // Mettre à jour le mot de passe
      const updatedUser = await userService.updateUserPassword(req.user.id, newPassword);

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  }

  // Télécharger une photo de profil
  async uploadProfilePicture(req: MulterRequest, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      if (!req.file) {
        return res.status(400).send("No image uploaded");
      }

      // Récupérer le fichier uploadé via multer-s3
      const s3File = req.file as MulterS3File;
      console.log("Photo de profil téléchargée sur R2:", s3File.key);

      // Générer l'URL publique
      const imageUrl = r2StorageService.getPublicUrl(s3File.key);
      
      // Mettre à jour le profil avec l'URL de l'image
      const updatedUser = await userService.updateUserProfile(req.user.id, {
        profileImage: imageUrl
      });

      // Si l'utilisateur avait déjà une photo de profil, supprimer l'ancienne
      const oldProfileImage = req.user.profileImage;
      if (oldProfileImage && oldProfileImage.includes('r2.dev')) {
        const oldKey = r2StorageService.getKeyFromUrl(oldProfileImage);
        if (oldKey) {
          console.log("Suppression de l'ancienne photo de profil:", oldKey);
          await r2StorageService.deleteFile(oldKey);
        }
      }

      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  }
}

// Exporter une instance par défaut
export const userController = new UserController();