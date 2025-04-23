import { storage } from "../storage";
import { db } from "../db";
import { Photo, photos } from "@shared/schema";
import { r2StorageService } from "../services/r2-storage-service";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import 'dotenv/config';

/**
 * Script de migration des photos existantes vers Cloudflare R2
 * 
 * Ce script parcourt toutes les photos existantes stockées localement,
 * les télécharge sur Cloudflare R2, puis met à jour les enregistrements
 * dans la base de données avec les nouvelles URLs.
 */

// Catégories de photos à migrer
enum PhotoCategory {
  FAMILY_PHOTO = "family-photos",
  USER_PROFILE = "user-profiles",
  CHILD_PROFILE = "children-profiles",
  GAZETTE = "gazettes"
}

// Configuration pour chaque catégorie
interface CategoryConfig {
  localPath: string;
  r2Path: string;
}

// Configurations pour chaque catégorie de photo
const categoryConfigs: Record<PhotoCategory, CategoryConfig> = {
  [PhotoCategory.FAMILY_PHOTO]: {
    localPath: "uploads/photos",
    r2Path: "family-photos"
  },
  [PhotoCategory.USER_PROFILE]: {
    localPath: "uploads/profiles",
    r2Path: "user-profiles"
  },
  [PhotoCategory.CHILD_PROFILE]: {
    localPath: "uploads/children",
    r2Path: "children-profiles"
  },
  [PhotoCategory.GAZETTE]: {
    localPath: "uploads/gazettes",
    r2Path: "gazettes"
  }
};

/**
 * Fonction principale qui exécute la migration
 */
export async function migratePhotos() {
  console.log("Démarrage de la migration des photos vers Cloudflare R2...");

  // Statistiques
  const stats = {
    total: 0,
    migrated: 0,
    failed: 0,
    skipped: 0
  };

  try {
    // 1. Récupérer toutes les photos de la base de données
    const allPhotos = await db.select().from(photos);
    stats.total = allPhotos.length;
    console.log(`Total de ${allPhotos.length} photos trouvées dans la base de données.`);

    // 2. Migrer les photos par lots
    for (const photo of allPhotos) {
      try {
        // Vérifier si l'URL est déjà une URL R2
        if (photo.imageUrl && photo.imageUrl.startsWith('http')) {
          console.log(`Photo ${photo.id} déjà sur R2, ignorée.`);
          stats.skipped++;
          continue;
        }

        // Vérifier si le fichier local existe
        const localFilePath = path.join(process.cwd(), photo.imageUrl || "");
        if (!photo.imageUrl || !fs.existsSync(localFilePath)) {
          console.log(`Fichier local non trouvé pour la photo ${photo.id}, ignorée.`);
          stats.skipped++;
          continue;
        }

        // Déterminer la catégorie de la photo
        let category = PhotoCategory.FAMILY_PHOTO;
        if (photo.imageUrl.includes("profiles")) {
          category = PhotoCategory.USER_PROFILE;
        } else if (photo.imageUrl.includes("children")) {
          category = PhotoCategory.CHILD_PROFILE;
        } else if (photo.imageUrl.includes("gazettes")) {
          category = PhotoCategory.GAZETTE;
        }

        // Lire le fichier local
        const fileContent = fs.readFileSync(localFilePath);
        const fileName = path.basename(photo.imageUrl);
        
        // Déterminer le type de contenu
        const contentType = getContentTypeFromFileName(fileName);
        
        // Télécharger le fichier sur R2
        const r2Key = `${categoryConfigs[category].r2Path}/${fileName}`;
        const uploadResult = await r2StorageService.uploadBuffer(
          fileContent,
          r2Key,
          contentType
        );
        
        if (uploadResult) {
          // Mettre à jour l'enregistrement dans la base de données
          const newUrl = r2StorageService.getPublicUrl(r2Key);
          await db.update(photos)
            .set({ imageUrl: newUrl })
            .where(eq(photos.id, photo.id));
          
          console.log(`Photo ${photo.id} migrée avec succès vers R2: ${newUrl}`);
          stats.migrated++;
        } else {
          console.error(`Échec du téléchargement de la photo ${photo.id} vers R2.`);
          stats.failed++;
        }
      } catch (error) {
        console.error(`Erreur lors de la migration de la photo ${photo.id}:`, error);
        stats.failed++;
      }
    }

    // Afficher les statistiques finales
    console.log("\n=== Statistiques de migration ===");
    console.log(`Photos totales: ${stats.total}`);
    console.log(`Photos migrées: ${stats.migrated}`);
    console.log(`Photos ignorées: ${stats.skipped}`);
    console.log(`Échecs: ${stats.failed}`);
    console.log("================================\n");

  } catch (error) {
    console.error("Erreur critique lors de la migration des photos:", error);
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
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}