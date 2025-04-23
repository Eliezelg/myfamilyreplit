import { storage } from "../storage";
import { db } from "../db";
import { User, users, Child, children } from "@shared/schema";
import { r2StorageService } from "../services/r2-storage-service";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import 'dotenv/config';

/**
 * Script de migration des photos de profil (utilisateurs et enfants) existantes vers Cloudflare R2
 * 
 * Ce script parcourt toutes les photos de profil stockées localement,
 * les télécharge sur Cloudflare R2, puis met à jour les enregistrements
 * dans la base de données avec les nouvelles URLs.
 */

/**
 * Fonction principale qui exécute la migration des photos de profil utilisateur
 */
export async function migrateUserProfilePhotos() {
  console.log("Démarrage de la migration des photos de profil utilisateur vers Cloudflare R2...");

  // Statistiques
  const stats = {
    total: 0,
    migrated: 0,
    failed: 0,
    skipped: 0
  };

  try {
    // 1. Récupérer tous les utilisateurs avec photo de profil
    const allUsers = await db.select().from(users).where(eq(users.profileImage, users.profileImage));
    const usersWithProfileImages = allUsers.filter(user => user.profileImage);
    stats.total = usersWithProfileImages.length;
    console.log(`Total de ${usersWithProfileImages.length} photos de profil utilisateur trouvées.`);

    // 2. Migrer les photos par lots
    for (const user of usersWithProfileImages) {
      try {
        // Vérifier si l'URL est déjà une URL R2
        if (user.profileImage && user.profileImage.startsWith('http')) {
          console.log(`Photo de profil de l'utilisateur ${user.id} déjà sur R2, ignorée.`);
          stats.skipped++;
          continue;
        }

        // Vérifier si le fichier local existe
        const localFilePath = path.join(process.cwd(), user.profileImage || "");
        if (!user.profileImage || !fs.existsSync(localFilePath)) {
          console.log(`Fichier local non trouvé pour l'utilisateur ${user.id}, ignoré.`);
          stats.skipped++;
          continue;
        }

        // Lire le fichier local
        const fileContent = fs.readFileSync(localFilePath);
        const fileName = path.basename(user.profileImage);
        
        // Déterminer le type de contenu
        const contentType = getContentTypeFromFileName(fileName);
        
        // Télécharger le fichier sur R2
        const r2Key = `user-profiles/${fileName}`;
        const uploadResult = await r2StorageService.uploadBuffer(
          fileContent,
          r2Key,
          contentType
        );
        
        if (uploadResult) {
          // Mettre à jour l'enregistrement dans la base de données
          const newUrl = r2StorageService.getPublicUrl(r2Key);
          await db.update(users)
            .set({ profileImage: newUrl })
            .where(eq(users.id, user.id));
          
          console.log(`Photo de profil de l'utilisateur ${user.id} migrée avec succès vers R2: ${newUrl}`);
          stats.migrated++;
        } else {
          console.error(`Échec du téléchargement de la photo de profil pour l'utilisateur ${user.id} vers R2.`);
          stats.failed++;
        }
      } catch (error) {
        console.error(`Erreur lors de la migration de la photo de profil de l'utilisateur ${user.id}:`, error);
        stats.failed++;
      }
    }

    // Afficher les statistiques finales
    console.log("\n=== Statistiques de migration des photos de profil utilisateur ===");
    console.log(`Photos totales: ${stats.total}`);
    console.log(`Photos migrées: ${stats.migrated}`);
    console.log(`Photos ignorées: ${stats.skipped}`);
    console.log(`Échecs: ${stats.failed}`);
    console.log("=============================================================\n");

  } catch (error) {
    console.error("Erreur critique lors de la migration des photos de profil utilisateur:", error);
  }
}

/**
 * Fonction principale qui exécute la migration des photos de profil enfant
 */
export async function migrateChildProfilePhotos() {
  console.log("Démarrage de la migration des photos de profil enfant vers Cloudflare R2...");

  // Statistiques
  const stats = {
    total: 0,
    migrated: 0,
    failed: 0,
    skipped: 0
  };

  try {
    // 1. Récupérer tous les enfants avec photo de profil
    const allChildren = await db.select().from(children).where(eq(children.profileImage, children.profileImage));
    const childrenWithProfileImages = allChildren.filter(child => child.profileImage);
    stats.total = childrenWithProfileImages.length;
    console.log(`Total de ${childrenWithProfileImages.length} photos de profil enfant trouvées.`);

    // 2. Migrer les photos par lots
    for (const child of childrenWithProfileImages) {
      try {
        // Vérifier si l'URL est déjà une URL R2
        if (child.profileImage && child.profileImage.startsWith('http')) {
          console.log(`Photo de profil de l'enfant ${child.id} déjà sur R2, ignorée.`);
          stats.skipped++;
          continue;
        }

        // Vérifier si le fichier local existe
        const localFilePath = path.join(process.cwd(), child.profileImage || "");
        if (!child.profileImage || !fs.existsSync(localFilePath)) {
          console.log(`Fichier local non trouvé pour l'enfant ${child.id}, ignoré.`);
          stats.skipped++;
          continue;
        }

        // Lire le fichier local
        const fileContent = fs.readFileSync(localFilePath);
        const fileName = path.basename(child.profileImage);
        
        // Déterminer le type de contenu
        const contentType = getContentTypeFromFileName(fileName);
        
        // Télécharger le fichier sur R2
        const r2Key = `children-profiles/${fileName}`;
        const uploadResult = await r2StorageService.uploadBuffer(
          fileContent,
          r2Key,
          contentType
        );
        
        if (uploadResult) {
          // Mettre à jour l'enregistrement dans la base de données
          const newUrl = r2StorageService.getPublicUrl(r2Key);
          await db.update(children)
            .set({ profileImage: newUrl })
            .where(eq(children.id, child.id));
          
          console.log(`Photo de profil de l'enfant ${child.id} migrée avec succès vers R2: ${newUrl}`);
          stats.migrated++;
        } else {
          console.error(`Échec du téléchargement de la photo de profil pour l'enfant ${child.id} vers R2.`);
          stats.failed++;
        }
      } catch (error) {
        console.error(`Erreur lors de la migration de la photo de profil de l'enfant ${child.id}:`, error);
        stats.failed++;
      }
    }

    // Afficher les statistiques finales
    console.log("\n=== Statistiques de migration des photos de profil enfant ===");
    console.log(`Photos totales: ${stats.total}`);
    console.log(`Photos migrées: ${stats.migrated}`);
    console.log(`Photos ignorées: ${stats.skipped}`);
    console.log(`Échecs: ${stats.failed}`);
    console.log("=========================================================\n");

  } catch (error) {
    console.error("Erreur critique lors de la migration des photos de profil enfant:", error);
  }
}

/**
 * Détermine le type de contenu MIME à partir du nom de fichier
 */
function getContentTypeFromFileName(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();
  
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

// Exécuter la migration
async function runMigration() {
  // D'abord migrer les photos de profil utilisateur
  await migrateUserProfilePhotos();
  
  // Ensuite migrer les photos de profil enfant
  await migrateChildProfilePhotos();
  
  console.log("Migration complète terminée !");
}

runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erreur fatale lors de la migration :", error);
    process.exit(1);
  });