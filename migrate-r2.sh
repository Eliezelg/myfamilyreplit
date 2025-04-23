#!/bin/bash

# Script pour exécuter la migration vers Cloudflare R2

# Couleurs pour une meilleure visibilité
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Vérifier si tsx est installé
if ! command -v tsx &> /dev/null; then
    echo -e "${BLUE}TSX n'est pas disponible, installation en cours...${NC}"
    npm install -g tsx
fi

echo -e "${GREEN}=== UTILITAIRE DE MIGRATION VERS CLOUDFLARE R2 ===${NC}"
echo ""
echo "Options disponibles:"
echo "1. Migration complète des fichiers vers Cloudflare R2"
echo "2. Migration des photos de famille uniquement"
echo "3. Migration des photos de profil utilisateur uniquement"
echo "4. Migration des photos de profil enfant uniquement"
echo "5. Migration interactive (interface CLI)"
echo "0. Quitter"
echo ""
echo -n "Entrez votre choix (0-5): "
read choice

case $choice in
    1)
        echo -e "${BLUE}Exécution de la migration complète...${NC}"
        tsx server/tools/migrate-all-to-r2.ts
        ;;
    2)
        echo -e "${BLUE}Exécution de la migration des photos de famille...${NC}"
        tsx -e "import { migratePhotos } from './server/tools/migrate-photos.ts'; migratePhotos().then(() => process.exit(0));"
        ;;
    3)
        echo -e "${BLUE}Exécution de la migration des photos de profil utilisateur...${NC}"
        tsx -e "import { migrateUserProfilePhotos } from './server/tools/migrate-profile-photos.ts'; migrateUserProfilePhotos().then(() => process.exit(0));"
        ;;
    4)
        echo -e "${BLUE}Exécution de la migration des photos de profil enfant...${NC}"
        tsx -e "import { migrateChildProfilePhotos } from './server/tools/migrate-profile-photos.ts'; migrateChildProfilePhotos().then(() => process.exit(0));"
        ;;
    5)
        echo -e "${BLUE}Lancement de l'interface CLI interactive...${NC}"
        tsx server/tools/cli.ts
        ;;
    0)
        echo -e "${GREEN}Au revoir!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Option invalide. Veuillez entrer un chiffre entre 0 et 5.${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}Opération terminée!${NC}"