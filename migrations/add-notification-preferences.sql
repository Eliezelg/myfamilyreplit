-- Migration pour ajouter la table de préférences de notification
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_photo_email BOOLEAN NOT NULL DEFAULT TRUE,
  new_photo_push BOOLEAN NOT NULL DEFAULT TRUE,
  new_comment_email BOOLEAN NOT NULL DEFAULT TRUE,
  new_comment_push BOOLEAN NOT NULL DEFAULT TRUE,
  new_reaction_email BOOLEAN NOT NULL DEFAULT FALSE,
  new_reaction_push BOOLEAN NOT NULL DEFAULT TRUE,
  new_gazette_email BOOLEAN NOT NULL DEFAULT TRUE,
  new_gazette_push BOOLEAN NOT NULL DEFAULT TRUE,
  family_event_email BOOLEAN NOT NULL DEFAULT TRUE,
  family_event_push BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_digest_email BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Ajouter un trigger pour mettre à jour le champ updated_at automatiquement
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Créer une entrée par défaut pour chaque utilisateur existant
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;
