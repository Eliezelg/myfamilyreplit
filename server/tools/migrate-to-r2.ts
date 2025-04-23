import { migratePhotos } from "./migrate-photos";
import { migrateUserProfilePhotos, migrateChildProfilePhotos } from "./migrate-profile-photos";
import { r2StorageService } from "../services/r2-storage-service";
import { db } from "../db";
import { gazettes } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import 'dotenv/config';

/**
 * Script de migration principal pour déplacer tous les fichiers 
 * (photos de famille, photos de profil utilisateurs, photos de profil enfants, et PDFs de gazettes)
 * depuis le stockage local vers Cloudflare R2.
 */

/**
 * Migre les PDFs de gazettes depuis le système de fichiers local vers Cloudflare R2
 */
async function migrateGazettePDFs() {
  console.log("Démarrage de la migration des PDFs de gazettes vers Cloudflare R2...");

  // Statistiques
  const stats = {
    total: 0,
    migrated: 0,
    failed: 0,
    skipped: 0
  };

  try {
    // 1. Récupérer toutes les gazettes avec un PDF
    const allGazettes = await db.select().from(gazettes).where(eq(gazettes.pdfUrl, gazettes.pdfUrl));
    const gazettesWithPDFs = allGazettes.filter(gazette => gazette.pdfUrl);
    stats.total = gazettesWithPDFs.length;
    console.log(`Total de ${gazettesWithPDFs.length} PDFs de gazettes trouvés.`);

    // 2. Migrer les PDFs par lots
    for (const gazette of gazettesWithPDFs) {
      try {
        // Vérifier si l'URL est déjà une URL R2
        if (gazette.pdfUrl && gazette.pdfUrl.startsWith('http')) {
          console.log(`PDF de la gazette ${gazette.id} déjà sur R2, ignoré.`);
          stats.skipped++;
          continue;
        }

        // Vérifier si le fichier local existe
        const localFilePath = path.join(process.cwd(), gazette.pdfUrl || "");
        if (!gazette.pdfUrl || !fs.existsSync(localFilePath)) {
          console.log(`Fichier PDF local non trouvé pour la gazette ${gazette.id}, ignoré.`);
          stats.skipped++;
          continue;
        }

        // Lire le fichier local
        const fileContent = fs.readFileSync(localFilePath);
        const fileName = path.basename(gazette.pdfUrl);
        
        // Télécharger le fichier sur R2
        const r2Key = `gazettes/${fileName}`;
        const uploadResult = await r2StorageService.uploadBuffer(
          fileContent,
          r2Key,
          'application/pdf'
        );
        
        if (uploadResult) {
          // Mettre à jour l'enregistrement dans la base de données
          const newUrl = r2StorageService.getPublicUrl(r2Key);
          await db.update(gazettes)
            .set({ pdfUrl: newUrl })
            .where(eq(gazettes.id, gazette.id));
          
          console.log(`PDF de la gazette ${gazette.id} migré avec succès vers R2: ${newUrl}`);
          stats.migrated++;
        } else {
          console.error(`Échec du téléchargement du PDF pour la gazette ${gazette.id} vers R2.`);
          stats.failed++;
        }
      } catch (error) {
        console.error(`Erreur lors de la migration du PDF de la gazette ${gazette.id}:`, error);
        stats.failed++;
      }
    }

    // Afficher les statistiques finales
    console.log("\n=== Statistiques de migration des PDFs de gazettes ===");
    console.log(`PDFs totaux: ${stats.total}`);
    console.log(`PDFs migrés: ${stats.migrated}`);
    console.log(`PDFs ignorés: ${stats.skipped}`);
    console.log(`Échecs: ${stats.failed}`);
    console.log("======================================================\n");

  } catch (error) {
    console.error("Erreur critique lors de la migration des PDFs de gazettes:", error);
  }
}

/**
 * Fonction principale pour exécuter toutes les migrations
 */
async function migrateAllToR2() {
  console.log("=== DÉBUT DE LA MIGRATION COMPLÈTE VERS CLOUDFLARE R2 ===");

  try {
    // 1. Migrer les photos de famille
    console.log("\n>> Étape 1/4: Migration des photos de famille");
    await migratePhotos();

    // 2. Migrer les photos de profil utilisateur
    console.log("\n>> Étape 2/4: Migration des photos de profil utilisateur");
    await migrateUserProfilePhotos();

    // 3. Migrer les photos de profil enfant
    console.log("\n>> Étape 3/4: Migration des photos de profil enfant");
    await migrateChildProfilePhotos();

    // 4. Migrer les PDFs de gazettes
    console.log("\n>> Étape 4/4: Migration des PDFs de gazettes");
    await migrateGazettePDFs();

    console.log("\n=== FIN DE LA MIGRATION COMPLÈTE ===");
    console.log("Tous les fichiers ont été migrés avec succès vers Cloudflare R2.");
    console.log("Les URLs dans la base de données ont été mises à jour.");
    console.log("Vous pouvez maintenant supprimer les fichiers locaux si vous le souhaitez.");

  } catch (error) {
    console.error("Erreur critique pendant la migration complète:", error);
  }
}

// Afficher le menu
console.log(`
--------------------------------------------------
  OUTIL DE MIGRATION VERS CLOUDFLARE R2
--------------------------------------------------

Choisissez une option:
1. Migrer uniquement les photos de famille
2. Migrer uniquement les photos de profil utilisateur
3. Migrer uniquement les photos de profil enfant
4. Migrer uniquement les PDFs de gazettes
5. Migrer TOUS les fichiers

Entrez le numéro de l'option (1-5): `);

// Lire l'entrée de l'utilisateur
process.stdin.once('data', async (data) => {
  const choice = data.toString().trim();
  
  try {
    switch (choice) {
      case '1':
        await migratePhotos();
        break;
      case '2':
        await migrateUserProfilePhotos();
        break;
      case '3':
        await migrateChildProfilePhotos();
        break;
      case '4':
        await migrateGazettePDFs();
        break;
      case '5':
        await migrateAllToR2();
        break;
      default:
        console.log("Option non valide. Veuillez choisir un nombre entre 1 et 5.");
        process.exit(1);
    }
    
    console.log("\nMigration terminée avec succès !");
    process.exit(0);
  } catch (error) {
    console.error("Erreur fatale lors de la migration:", error);
    process.exit(1);
  }
});