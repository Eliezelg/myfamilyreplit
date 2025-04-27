import { sql } from 'drizzle-orm';
import { db } from '../server/db';

/**
 * Migration pour ajouter le champ emailAlias à la table families
 */
export async function addEmailAliasToFamilies() {
  console.log('Exécution de la migration: ajout du champ emailAlias à la table families');
  
  try {
    // Vérifier si la colonne existe déjà
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'families' AND column_name = 'email_alias'
    `;
    
    const columnExists = await db.execute(checkColumnQuery);
    
    if (columnExists.rowCount === 0) {
      // Ajouter la colonne email_alias
      await db.execute(sql`
        ALTER TABLE families 
        ADD COLUMN email_alias TEXT UNIQUE
      `);
      
      console.log('Migration réussie: colonne email_alias ajoutée à la table families');
    } else {
      console.log('La colonne email_alias existe déjà dans la table families');
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    return false;
  }
}

// Exécuter la migration si ce fichier est exécuté directement
if (require.main === module) {
  addEmailAliasToFamilies()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Erreur lors de la migration:', error);
      process.exit(1);
    });
}
