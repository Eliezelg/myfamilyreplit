import cron from "node-cron";
import { format } from "date-fns";
import { storage } from "../storage";
import { generateGazettePDF, getUpcomingBirthdays } from "./pdf-generator";
import { Family, Gazette } from "@shared/schema";

/**
 * Planifie la génération automatique des gazettes
 * - Exécuté le premier jour de chaque mois à 00:05
 * - Génère une gazette pour chaque famille avec des photos du mois précédent
 */
export function scheduleGazetteGeneration() {
  // Planifier la tâche pour le premier jour de chaque mois à 00:05 du matin
  cron.schedule("5 0 1 * *", async () => {
    try {
      console.log("[Gazette] Début de la génération automatique des gazettes mensuelles");
      
      // Obtenir la date du mois précédent (YYYY-MM)
      const date = new Date();
      date.setMonth(date.getMonth() - 1);
      const previousMonth = format(date, "yyyy-MM");
      
      // Récupérer toutes les familles
      const families = await getAllFamilies();
      
      let successCount = 0;
      let errorCount = 0;
      
      // Pour chaque famille, générer une gazette
      for (const family of families) {
        try {
          await generateGazetteForFamily(family.id, previousMonth);
          successCount++;
        } catch (error) {
          console.error(`[Gazette] Erreur lors de la génération pour la famille ${family.id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`[Gazette] Génération terminée: ${successCount} réussies, ${errorCount} échouées`);
    } catch (error) {
      console.error("[Gazette] Erreur lors de la génération automatique des gazettes:", error);
    }
  });
  
  console.log("[Gazette] Planification des gazettes configurée: chaque mois le 1er à 00:05");
}

/**
 * Récupère toutes les familles enregistrées dans le système
 */
async function getAllFamilies(): Promise<Family[]> {
  try {
    // Cette approche simplifiée récupère toutes les familles
    // En production, on pourrait vouloir paginer ou optimiser cette requête
    const allFamilies: Family[] = [];
    let familyId = 1;
    let family: Family | undefined;
    
    // Essayons de récupérer des familles avec des IDs séquentiels
    while (familyId < 100) { // Limite raisonnable pour éviter une boucle infinie
      family = await storage.getFamily(familyId);
      if (family) {
        allFamilies.push(family);
      }
      familyId++;
    }
    
    return allFamilies;
  } catch (error) {
    console.error("[Gazette] Erreur lors de la récupération des familles:", error);
    return [];
  }
}

/**
 * Génère une gazette pour une famille et un mois spécifique à la demande
 */
export async function generateGazetteOnDemand(familyId: number, monthYear: string): Promise<Gazette> {
  try {
    console.log(`[Gazette] Génération à la demande pour la famille ${familyId}, mois ${monthYear}`);
    
    return await generateGazetteForFamily(familyId, monthYear);
  } catch (error) {
    console.error(`[Gazette] Erreur lors de la génération à la demande pour famille ${familyId}:`, error);
    throw error;
  }
}

/**
 * Génère une gazette pour une famille et un mois spécifique
 */
export async function generateGazetteForFamily(familyId: number, monthYear: string): Promise<Gazette> {
  try {
    // Vérifier si une gazette existe déjà pour ce mois et cette famille
    let gazette = await storage.getFamilyGazetteByMonthYear(familyId, monthYear);
    
    // Récupérer les informations de la famille
    const family = await storage.getFamily(familyId);
    if (!family) {
      throw new Error(`Famille ${familyId} non trouvée`);
    }
    
    // Récupérer les photos du mois pour cette famille
    const photos = await storage.getFamilyPhotos(familyId, monthYear);
    
    // Si aucune photo, ne pas générer de gazette
    if (photos.length === 0) {
      throw new Error(`Aucune photo disponible pour la famille ${familyId} au mois ${monthYear}`);
    }
    
    // Récupérer les détails utilisateur pour chaque photo
    const photosWithUser = await Promise.all(
      photos.map(async (photo) => {
        const user = await storage.getUser(photo.userId);
        return { ...photo, user };
      })
    );
    
    // Récupérer les anniversaires du mois
    const birthdays = await getUpcomingBirthdays(familyId, monthYear);
    
    // Générer le PDF
    const result = await generateGazettePDF(photosWithUser, family, birthdays, monthYear);
    
    // Mettre à jour ou créer l'enregistrement de la gazette
    if (gazette) {
      gazette = await storage.updateGazette(gazette.id, {
        pdfUrl: result.pdfPath,
        status: "complete"
      });
    } else {
      gazette = await storage.createGazette({
        familyId,
        monthYear,
        pdfUrl: result.pdfPath,
        status: "complete"
      });
    }
    
    console.log(`[Gazette] Génération réussie pour famille ${familyId}, mois ${monthYear}`);
    return gazette;
  } catch (error) {
    // Si une erreur survient, créer une gazette avec statut "error" si elle n'existe pas déjà
    console.error(`[Gazette] Erreur de génération pour famille ${familyId}, mois ${monthYear}:`, error);
    
    const existingGazette = await storage.getFamilyGazetteByMonthYear(familyId, monthYear);
    if (!existingGazette) {
      await storage.createGazette({
        familyId,
        monthYear,
        status: "error"
      });
    } else {
      await storage.updateGazette(existingGazette.id, {
        status: "error"
      });
    }
    
    throw error;
  }
}