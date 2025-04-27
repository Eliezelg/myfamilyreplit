-- Script SQL pour ajouter la colonne email_alias à la table families
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'families' AND column_name = 'email_alias'
  ) THEN 
    ALTER TABLE families ADD COLUMN email_alias TEXT;
    ALTER TABLE families ADD CONSTRAINT unique_email_alias UNIQUE (email_alias);
  END IF;
END $$;
