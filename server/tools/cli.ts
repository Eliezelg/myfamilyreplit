#!/usr/bin/env tsx

import readline from 'readline';
import { migrateAllToR2 } from './migrate-all-to-r2';
import { migratePhotos } from './migrate-photos';
import { migrateUserProfilePhotos, migrateChildProfilePhotos } from './migrate-profile-photos';
import 'dotenv/config';

// Créer une interface de ligne de commande
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Options disponibles
const options = [
  { id: 1, name: 'Migration complète des fichiers vers Cloudflare R2', fn: migrateAllToR2 },
  { id: 2, name: 'Migration des photos de famille uniquement', fn: migratePhotos },
  { id: 3, name: 'Migration des photos de profil utilisateur uniquement', fn: migrateUserProfilePhotos },
  { id: 4, name: 'Migration des photos de profil enfant uniquement', fn: migrateChildProfilePhotos },
  { id: 0, name: 'Quitter', fn: () => Promise.resolve() }
];

// Afficher le menu
function showMenu() {
  console.log('\n=== UTILITAIRE DE MIGRATION VERS CLOUDFLARE R2 ===\n');
  
  options.forEach(option => {
    console.log(`${option.id}. ${option.name}`);
  });
  
  console.log('\nEntrez le numéro de l\'option que vous souhaitez exécuter :');
}

// Exécuter l'option sélectionnée
async function executeOption(option: number) {
  const selectedOption = options.find(o => o.id === option);
  
  if (!selectedOption) {
    console.log('Option invalide. Veuillez réessayer.');
    showMenuAndWaitForInput();
    return;
  }
  
  if (option === 0) {
    console.log('Au revoir!');
    rl.close();
    process.exit(0);
    return;
  }
  
  console.log(`\nExécution de : ${selectedOption.name}\n`);
  
  try {
    await selectedOption.fn();
    console.log('\nOpération terminée avec succès!\n');
  } catch (error) {
    console.error('\nUne erreur s\'est produite :', error);
  }
  
  // Après l'exécution, revenir au menu principal
  showMenuAndWaitForInput();
}

// Afficher le menu et attendre l'entrée utilisateur
function showMenuAndWaitForInput() {
  showMenu();
  
  rl.question('', async (answer) => {
    const option = parseInt(answer, 10);
    
    if (isNaN(option)) {
      console.log('Veuillez entrer un numéro valide.');
      showMenuAndWaitForInput();
      return;
    }
    
    await executeOption(option);
  });
}

// Démarrer le programme
console.log('Vérification des configurations...');

// Vérifier que les variables d'environnement nécessaires sont présentes
const requiredEnvVars = [
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'CLOUDFLARE_ACCESS_KEY_ID',
  'CLOUDFLARE_SECRET_ACCESS_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('\n❌ Erreur: Variables d\'environnement manquantes:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nAssurez-vous que toutes les variables Cloudflare R2 sont définies dans le fichier .env');
  process.exit(1);
}

console.log('✅ Configuration Cloudflare R2 vérifiée');
showMenuAndWaitForInput();