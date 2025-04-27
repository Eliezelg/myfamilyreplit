// Script pour exécuter uniquement la migration d'ajout d'emailAlias
require('ts-node').register();
const { addEmailAliasToFamilies } = require('./add-email-alias-to-families');

console.log('Exécution de la migration pour ajouter emailAlias aux familles...');

addEmailAliasToFamilies()
  .then((result) => {
    console.log('Migration terminée avec succès:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur lors de la migration:', error);
    process.exit(1);
  });
