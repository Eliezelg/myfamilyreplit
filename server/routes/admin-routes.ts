import { Express } from "express";
import { adminRouter } from "../routes/admin-router";

/**
 * Enregistre les routes administrateur
 */
export function registerAdminRoutes(app: Express) {
  app.use("/api/admin", adminRouter);
}