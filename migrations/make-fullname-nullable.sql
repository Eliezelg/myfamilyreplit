-- Rendre la colonne full_name nullable
ALTER TABLE users ALTER COLUMN full_name DROP NOT NULL;