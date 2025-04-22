import { Request, Response, NextFunction } from "express";
import { childService } from "../services/child-service";

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

      const imagePath = `/uploads/${req.file.filename}`;
      const updatedChild = await childService.updateChild(childId, {
        profileImage: imagePath
      });

      res.json(updatedChild);
    } catch (error) {
      next(error);
    }
  }
}

export const childController = new ChildController();ldController();