import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Cette migration permet de remplir les champs firstName et lastName
 * à partir du champ fullName existant pour tous les utilisateurs.
 */
async function migrateFullNameToFirstLastName() {
  try {
    console.log("Démarrage de la migration firstName/lastName...");
    
    // Récupérer tous les utilisateurs
    const allUsers = await db.select().from(users);
    
    console.log(`${allUsers.length} utilisateurs trouvés à mettre à jour.`);
    
    // Compteurs pour le suivi
    let updatedCount = 0;
    let errorCount = 0;
    
    // Mettre à jour chaque utilisateur
    for (const user of allUsers) {
      try {
        // Si firstName et lastName sont déjà remplis, on passe
        if (user.firstName && user.lastName) {
          console.log(`Utilisateur ${user.id} a déjà firstName/lastName définis, on passe.`);
          continue;
        }
        
        // Extraire prénom et nom du fullName
        let firstName = '';
        let lastName = '';
        
        if (user.fullName) {
          const nameParts = user.fullName.trim().split(' ');
          if (nameParts.length >= 2) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          } else if (nameParts.length === 1) {
            firstName = nameParts[0];
            lastName = '';
          }
        }
        
        // Mettre à jour l'utilisateur
        await db.update(users)
          .set({
            firstName: firstName || user.username, // Fallback vers username si pas de prénom
            lastName: lastName
          })
          .where(eq(users.id, user.id));
          
        updatedCount++;
        console.log(`Utilisateur ${user.id} mis à jour avec succès: ${firstName} ${lastName}`);
      } catch (userError) {
        console.error(`Erreur lors de la mise à jour de l'utilisateur ${user.id}:`, userError);
        errorCount++;
      }
    }
    
    console.log(`Migration terminée! ${updatedCount} utilisateurs mis à jour, ${errorCount} erreurs.`);
  } catch (error) {
    console.error("Erreur lors de la migration firstName/lastName:", error);
  }
}

// Exécuter la migration
migrateFullNameToFirstLastName()
  .then(() => {
    console.log("Migration firstName/lastName exécutée avec succès!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erreur lors de l'exécution de la migration:", error);
    process.exit(1);
  });