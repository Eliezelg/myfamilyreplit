import { Request, Response, NextFunction } from "express";
import { familyService } from "../services/family-service";

/**
 * Contrôleur pour gérer les requêtes liées aux familles
 */
class FamilyController {
  /**
   * Récupère toutes les familles de l'utilisateur connecté
   */
  async getUserFamilies(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const families = await familyService.getUserFamilies(req.user.id);
      res.json(families);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les détails d'une famille
   */
  async getFamily(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);

      // Vérifier que l'utilisateur est membre de la famille
      const isMember = await familyService.isUserFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Forbidden");
      }

      const family = await familyService.getFamily(familyId);
      if (!family) {
        return res.status(404).send("Family not found");
      }

      res.json(family);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crée une nouvelle famille
   */
  async createFamily(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const family = await familyService.createFamily(req.body, req.user.id);
      res.status(201).json(family);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère les membres d'une famille
   */
  async getFamilyMembers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);

      // Vérifier que l'utilisateur est membre de la famille
      const isMember = await familyService.isUserFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Forbidden");
      }

      const members = await familyService.getFamilyMembers(familyId);
      res.json(members);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère le fond d'une famille
   */
  async getFamilyFund(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);

      // Vérifier que l'utilisateur est membre de la famille
      const isMember = await familyService.isUserFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Forbidden");
      }

      const fund = await familyService.getFamilyFund(familyId);
      if (!fund) {
        return res.status(404).send("Family fund not found");
      }

      res.json(fund);
    } catch (error) {
      next(error);
    }
  }
}

export const familyController = new FamilyController();