import { Request, Response, NextFunction } from "express";
import { eventService } from "../services/event-service";
import { storage } from "../storage";
import { insertEventSchema } from "@shared/schema";
import { ZodError } from "zod";

/**
 * Contrôleur pour gérer les requêtes liées aux événements
 */
class EventController {
  /**
   * Récupère les événements d'une famille
   * Inclut automatiquement les anniversaires à venir dans les 30 prochains jours
   */
  async getFamilyEvents(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Non autorisé");
      }
      
      const familyId = parseInt(req.params.id);
      if (isNaN(familyId)) {
        return res.status(400).send("ID de famille invalide");
      }
      
      // Vérifier que l'utilisateur est membre de cette famille
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Vous n'êtes pas membre de cette famille");
      }
      
      // Récupérer les événements (incluant automatiquement les anniversaires)
      const events = await eventService.getFamilyEvents(familyId);
      
      res.json(events);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Ajoute un événement manuel
   */
  async addEvent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Non autorisé");
      }
      
      const familyId = parseInt(req.params.id);
      if (isNaN(familyId)) {
        return res.status(400).send("ID de famille invalide");
      }
      
      // Vérifier que l'utilisateur est membre de cette famille
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Vous n'êtes pas membre de cette famille");
      }
      
      // Valider les données
      try {
        // Valider les données d'entrée avec le schéma Zod
        const validatedData = insertEventSchema.parse({
          ...req.body,
          familyId,
        });
        
        // Créer l'événement
        const newEvent = await eventService.addEvent(validatedData);
        
        res.status(201).json(newEvent);
      } catch (err) {
        if (err instanceof ZodError) {
          return res.status(400).json({ 
            message: "Données invalides", 
            errors: err.errors 
          });
        }
        throw err;
      }
    } catch (error) {
      next(error);
    }
  }
}

export const eventController = new EventController();