import { defineConfig } from "drizzle-kit";
import dotenv from 'dotenv';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

// URL de la base de données par défaut si DATABASE_URL n'est pas défini
const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:Grenoble10@localhost:5432/mydb";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
