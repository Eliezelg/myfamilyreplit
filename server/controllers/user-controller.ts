
import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user-service";
import { comparePasswords } from "../auth";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

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

// Configuration de multer pour l'upload de fichiers
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req: Request, file: Express.Multer.File, cb: any) {
      cb(null, uploadDir);
    },
    filename: function (req: Request, file: Express.Multer.File, cb: any) {
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req: Request, file: Express.Multer.File, cb: any) {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG and PNG files are allowed'));
    }
    cb(null, true);
  }
});

export class UserController {
  // Middleware d'upload de photo de profil
  profileUpload = upload.single("profileImage");
  
  // Récupérer le profil de l'utilisateur actuel
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const user = await userService.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  // Mettre à jour le profil de l'utilisateur
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const updatedUser = await userService.updateUserProfile(req.user.id, req.body);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  // Changer le mot de passe de l'utilisateur
  async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const { currentPassword, newPassword } = req.body;
      const user = await userService.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      // Vérifier l'ancien mot de passe
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).send("Current password is incorrect");
      }
      
      // Mettre à jour le mot de passe
      const updatedUser = await userService.updateUserPassword(req.user.id, newPassword);
      res.json(updatedUser);
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
      
      const imagePath = `/uploads/${req.file.filename}`;
      const updatedUser = await userService.updateUserProfile(req.user.id, {
        profileImage: imagePath
      });
      
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  }
}

// Exporter une instance par défaut
export const userController = new UserController();
