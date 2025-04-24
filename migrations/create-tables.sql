-- Création de la table users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  email TEXT NOT NULL,
  profile_image TEXT,
  birth_date TIMESTAMP,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP,
  reset_password_token TEXT,
  reset_password_expires TIMESTAMP
);

-- Création de la table families
CREATE TABLE IF NOT EXISTS families (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  image_url TEXT
);

-- Création de la table family_members
CREATE TABLE IF NOT EXISTS family_members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  family_id INTEGER NOT NULL REFERENCES families(id),
  role TEXT NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Création de la table photos
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  image_url TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  month_year TEXT NOT NULL,
  file_size INTEGER
);

-- Création de la table gazettes
CREATE TABLE IF NOT EXISTS gazettes (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id),
  month_year TEXT NOT NULL,
  status TEXT NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  closing_date TIMESTAMP
);

-- Création de la table family_funds
CREATE TABLE IF NOT EXISTS family_funds (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id) UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ILS'
);

-- Création de la table fund_transactions
CREATE TABLE IF NOT EXISTS fund_transactions (
  id SERIAL PRIMARY KEY,
  family_fund_id INTEGER NOT NULL REFERENCES family_funds(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'payment',
  reference_number TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Création de la table recipients
CREATE TABLE IF NOT EXISTS recipients (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id),
  name TEXT NOT NULL,
  image_url TEXT,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Création de la table invitations
CREATE TABLE IF NOT EXISTS invitations (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id),
  invited_by_user_id INTEGER NOT NULL REFERENCES users(id),
  email TEXT,
  token TEXT NOT NULL UNIQUE,
  message TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  type TEXT NOT NULL DEFAULT 'code'
);

-- Création de la table events
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Création de la table children
CREATE TABLE IF NOT EXISTS children (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  birth_date TIMESTAMP,
  gender TEXT,
  profile_image TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Création de la table promo_codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount DECIMAL NOT NULL,
  type TEXT NOT NULL DEFAULT 'lifetime',
  description TEXT,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Création de la table subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id) UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active',
  type TEXT NOT NULL,
  promo_code_id INTEGER REFERENCES promo_codes(id),
  original_price DECIMAL NOT NULL,
  final_price DECIMAL NOT NULL,
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP,
  renewal_date TIMESTAMP,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Création de la table admin_logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);