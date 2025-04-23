import { db } from "../server/db";
import { adminLogs, users } from "../shared/schema";
import { sql } from "drizzle-orm";

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

    // 3. Create admin_logs table if it doesn't exist
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

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

migrate();