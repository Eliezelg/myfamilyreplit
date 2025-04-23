# Guide de migration vers Cloudflare R2

Ce document explique comment migrer les fichiers du stockage local vers Cloudflare R2 pour l'application MyFamily.

## Prérequis

Avant de commencer la migration, assurez-vous que vous avez :

1. Un compte Cloudflare avec R2 activé
2. Un bucket R2 créé pour stocker les fichiers de l'application
3. Les identifiants d'API R2 (clé d'accès et clé secrète)

## Configuration

Les variables d'environnement suivantes doivent être définies dans le fichier `.env` :

```
CLOUDFLARE_ACCOUNT_ID=votre-id-de-compte
CLOUDFLARE_R2_BUCKET_NAME=nom-de-votre-bucket
CLOUDFLARE_ACCESS_KEY_ID=votre-clé-d-accès
CLOUDFLARE_SECRET_ACCESS_KEY=votre-clé-secrète
```

## Options de migration

Plusieurs options de migration sont disponibles :

### 1. Utiliser le script shell (méthode recommandée)

```bash
./migrate-r2.sh
```

Ce script affiche un menu interactif avec les options suivantes :
- Migration complète (toutes les photos et PDFs)
- Migration des photos de famille uniquement
- Migration des photos de profil utilisateur uniquement
- Migration des photos de profil enfant uniquement
- Interface CLI interactive

### 2. Exécuter directement les scripts TypeScript

Pour une migration complète :
```bash
tsx server/tools/migrate-all-to-r2.ts
```

Pour une migration spécifique :
```bash
# Photos de famille uniquement
tsx -e "import { migratePhotos } from './server/tools/migrate-photos.ts'; migratePhotos().then(() => process.exit(0));"

# Photos de profil utilisateur uniquement
tsx -e "import { migrateUserProfilePhotos } from './server/tools/migrate-profile-photos.ts'; migrateUserProfilePhotos().then(() => process.exit(0));"

# Photos de profil enfant uniquement
tsx -e "import { migrateChildProfilePhotos } from './server/tools/migrate-profile-photos.ts'; migrateChildProfilePhotos().then(() => process.exit(0));"
```

## Vérification de la migration

Après la migration, vérifiez que :

1. Les URL des fichiers dans la base de données ont été mises à jour (elles devraient désormais commencer par `https://`)
2. Les fichiers sont accessibles via leurs nouvelles URL
3. Le téléchargement de nouvelles photos fonctionne correctement

## Basculement vers R2

Le service PhotoService a été modifié pour utiliser R2 par défaut. Vérifiez que cette configuration est active en consultant les logs de démarrage de l'application :

```
PhotoService initialisé avec stockage R2
```

Si ce message n'apparaît pas, vérifiez la configuration dans `server/services/photo-service.ts` et assurez-vous que `useLocalStorage` est défini sur `false`.

## Résolution des problèmes

Si vous rencontrez des erreurs lors de la migration :

1. Vérifiez que toutes les variables d'environnement sont correctement définies
2. Assurez-vous que les droits d'accès au bucket R2 sont correctement configurés
3. Vérifiez la connectivité avec Cloudflare R2
4. Consultez les logs de migration pour identifier les fichiers qui ont échoué

## Nettoyage (optionnel)

Une fois que vous avez vérifié que la migration s'est bien déroulée, vous pouvez supprimer les fichiers locaux pour libérer de l'espace. Cependant, il est recommandé de conserver une sauvegarde pendant un certain temps.