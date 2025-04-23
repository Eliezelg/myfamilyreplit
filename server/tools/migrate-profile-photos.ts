import { storage } from "../storage";
import { db } from "../db";
import { User, users, children, Child } from "@shared/schema";
import { r2StorageService } from "../services/r2-storage-service";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import 'dotenv/config';

/**
 * Script de migration des photos de profil (utilisateurs et enfants) vers Cloudflare R2
 */

/**
 * Migre les photos de profil des utilisateurs
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
    // 1. Récupérer tous les utilisateurs avec une photo de profil
    const allUsers = await db.select().from(users);
    const usersWithPhoto = allUsers.filter(user => user.profileImage);
    stats.total = usersWithPhoto.length;
    console.log(`Total de ${usersWithPhoto.length} photos de profil utilisateur trouvées.`);

    // 2. Migrer les photos par lots
    for (const user of usersWithPhoto) {
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
          console.log(`Fichier local non trouvé pour la photo de profil de l'utilisateur ${user.id}, ignorée.`);
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
          console.error(`Échec du téléchargement de la photo de profil de l'utilisateur ${user.id} vers R2.`);
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
    console.log("=========================================================\n");

  } catch (error) {
    console.error("Erreur critique lors de la migration des photos de profil utilisateur:", error);
  }
}

/**
 * Migre les photos de profil des enfants
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
    // 1. Récupérer tous les enfants avec une photo de profil
    const allChildren = await db.select().from(children);
    const childrenWithPhoto = allChildren.filter(child => child.profileImage);
    stats.total = childrenWithPhoto.length;
    console.log(`Total de ${childrenWithPhoto.length} photos de profil enfant trouvées.`);

    // 2. Migrer les photos par lots
    for (const child of childrenWithPhoto) {
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
          console.log(`Fichier local non trouvé pour la photo de profil de l'enfant ${child.id}, ignorée.`);
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
          console.error(`Échec du téléchargement de la photo de profil de l'enfant ${child.id} vers R2.`);
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
    console.log("======================================================\n");

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