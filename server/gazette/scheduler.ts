import cron from 'node-cron';
import { db } from '../db';
import { families } from '@shared/schema';
import { generateGazetteForFamily } from './pdf-generator';
import { storage } from '../storage';
import { log } from '../vite';

// Planifier la génération des gazettes mensuelles
// Exécuter à 00:05 le premier jour de chaque mois
export function scheduleGazetteGeneration() {
  log('Démarrage du planificateur de génération de gazettes mensuelles', 'gazette');
  
  // '5 0 1 * *' = 5 minutes après minuit, le premier jour de chaque mois
  cron.schedule('5 0 1 * *', async () => {
    try {
      log('Début de la génération des gazettes mensuelles', 'gazette');
      
      // Obtenir tous les ID de famille actifs
      const allFamilies = await db.select({ id: families.id }).from(families);
      
      // Obtenir le mois précédent au format YYYY-MM
      const now = new Date();
      now.setDate(1); // Premier jour du mois actuel
      now.setHours(0, 0, 0, 0);
      now.setMonth(now.getMonth() - 1); // Mois précédent
      
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const monthYear = `${year}-${month}`;
      
      log(`Génération des gazettes pour le mois: ${monthYear}`, 'gazette');
      
      // Générer une gazette pour chaque famille
      for (const family of allFamilies) {
        try {
          log(`Génération de la gazette pour la famille ID: ${family.id}`, 'gazette');
          const result = await generateGazetteForFamily(family.id, monthYear);
          log(`Gazette générée avec succès: ${result.photoCount} photos, ${result.birthdayCount} anniversaires`, 'gazette');
        } catch (error) {
          log(`Erreur lors de la génération de la gazette pour la famille ID: ${family.id}: ${error}`, 'gazette');
        }
      }
      
      log('Fin de la génération des gazettes mensuelles', 'gazette');
    } catch (error) {
      log(`Erreur lors de la génération des gazettes: ${error}`, 'gazette');
    }
  });
}

// Fonction pour générer une gazette à la demande
export async function generateGazetteOnDemand(familyId: number, monthYear: string) {
  try {
    log(`Génération de la gazette à la demande pour la famille ID: ${familyId}, mois: ${monthYear}`, 'gazette');
    const result = await generateGazetteForFamily(familyId, monthYear);
    log(`Gazette générée avec succès: ${result.photoCount} photos, ${result.birthdayCount} anniversaires`, 'gazette');
    return result;
  } catch (error) {
    log(`Erreur lors de la génération de la gazette à la demande: ${error}`, 'gazette');
    throw error;
  }
}