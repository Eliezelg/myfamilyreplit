import { Express } from "express";
import { eventController } from "../controllers/event-controller";

export function registerEventRoutes(app: Express) {
  // Récupérer les événements d'une famille (incluant les anniversaires automatiques)
  app.get(
    "/api/families/:id/events", 
    eventController.getFamilyEvents.bind(eventController)
  );
  
  // Ajouter un événement manuel
  app.post(
    "/api/families/:id/events", 
    eventController.addEvent.bind(eventController)
  );
}