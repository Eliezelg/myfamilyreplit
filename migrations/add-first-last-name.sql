-- Ajouter les colonnes firstName et lastName à la table users
ALTER TABLE users ADD COLUMN "first_name" TEXT;
ALTER TABLE users ADD COLUMN "last_name" TEXT;

-- Mettre à jour les données existantes (optionnel, dépend de votre approche)
-- Cette partie peut extraire le prénom et le nom de famille à partir du nom complet
-- mais cela dépend de la structure de vos données existantes
-- UPDATE users SET 
--   "first_name" = (CASE 
--     WHEN position(' ' in "full_name") > 0 
--     THEN substring("full_name" from 1 for position(' ' in "full_name") - 1) 
--     ELSE "full_name" END),
--   "last_name" = (CASE 
--     WHEN position(' ' in "full_name") > 0 
--     THEN substring("full_name" from position(' ' in "full_name") + 1) 
--     ELSE '' END);