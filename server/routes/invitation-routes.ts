import { Express } from "express";
import { invitationController } from "../controllers/invitation-controller";

export function registerInvitationRoutes(app: Express) {
  // Récupérer l'invitation active d'une famille
  app.get("/api/families/:id/invitation", invitationController.getFamilyInvitation.bind(invitationController));
  
  // Créer une nouvelle invitation
  app.post("/api/families/:id/invitation", invitationController.createInvitation.bind(invitationController));
  
  // Inviter par email
  app.post("/api/families/:id/invite-by-email", invitationController.inviteByEmail.bind(invitationController));
  
  // Rejoindre une famille avec un token d'invitation
  app.post("/api/join-family", invitationController.joinFamilyWithToken.bind(invitationController));
}