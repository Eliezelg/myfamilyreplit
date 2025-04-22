
import { Express } from "express";
import { userController } from "../controllers/user-controller";

export function registerUserRoutes(app: Express) {
  // Routes du profil utilisateur
  app.get("/api/profile", userController.getProfile.bind(userController));
  app.put("/api/profile", userController.updateProfile.bind(userController));
  app.post("/api/profile/password", userController.changePassword.bind(userController));
  app.post(
    "/api/profile/picture", 
    userController.profileUpload,
    userController.uploadProfilePicture.bind(userController)
  );
}
