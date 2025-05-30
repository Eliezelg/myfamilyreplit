import { db } from "../server/db";
import { adminLogs, users } from "../shared/schema";
import { sql } from "drizzle-orm";
import { addEmailAliasToFamilies } from "./add-email-alias-to-families";
import * as fs from 'fs';
import * as path from 'path';

async function migrate() {
  console.log("Starting database migration...");

  try {
    // 1. Add role column to users table if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'role'
        ) THEN 
          ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'user';
        END IF;
      END $$;
    `);
    console.log("✓ Added role column to users table (if it didn't exist)");

    // 2. Add lastLoginAt column to users table if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'last_login_at'
        ) THEN 
          ALTER TABLE users ADD COLUMN last_login_at timestamp;
        END IF;
      END $$;
    `);
    console.log("✓ Added lastLoginAt column to users table (if it didn't exist)");

    // 3. Add resetPasswordToken and resetPasswordExpires columns to users table if they don't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'reset_password_token'
        ) THEN 
          ALTER TABLE users ADD COLUMN reset_password_token text;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'reset_password_expires'
        ) THEN 
          ALTER TABLE users ADD COLUMN reset_password_expires timestamp;
        END IF;
      END $$;
    `);
    console.log("✓ Added password reset columns to users table (if they didn't exist)");
    
    // 4. Add firstName and lastName columns to users table if they don't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'first_name'
        ) THEN 
          ALTER TABLE users ADD COLUMN first_name text;
        END IF;
        
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'last_name'
        ) THEN 
          ALTER TABLE users ADD COLUMN last_name text;
        END IF;
      END $$;
    `);
    console.log("✓ Added firstName and lastName columns to users table (if they didn't exist)");

    // 4. Create admin_logs table if it doesn't exist
    await db.execute(sql`
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
    `);
    console.log("✓ Created admin_logs table (if it didn't exist)");

    // 4. Create an admin user (for development purposes only)
    const [adminUser] = await db.select().from(users).where(sql`role = 'admin'`);
    
    if (!adminUser) {
      console.log("No admin user found. Creating one...");
      
      // Note: In production, you should use a securely hashed password
      // This is just for development purposes
      await db.execute(sql`
        UPDATE users 
        SET role = 'admin' 
        WHERE id = 1
      `);
      console.log("✓ Updated first user to have admin role");
    } else {
      console.log("✓ Admin user already exists");
    }

    // Ajouter le champ emailAlias à la table families
    await addEmailAliasToFamilies();
    console.log("✓ Added emailAlias column to families table (if it didn't exist)");

    // Ajouter la table de préférences de notification
    const notificationPreferencesMigrationPath = path.join(__dirname, 'add-notification-preferences.sql');
    if (fs.existsSync(notificationPreferencesMigrationPath)) {
      const notificationPreferencesMigration = fs.readFileSync(notificationPreferencesMigrationPath, 'utf8');
      await db.execute(sql`${sql.raw(notificationPreferencesMigration)}`);
      console.log("✓ Added notification_preferences table");
    } else {
      console.error("Migration file for notification preferences not found!");
    }

    // Fin de la migration
    console.log("Database migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

migrate();