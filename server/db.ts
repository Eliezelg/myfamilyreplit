import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Utiliser directement la base de données 'postgres' par défaut qui existe toujours dans PostgreSQL
// Cette base de données est garantie d'exister et sera accessible
const connectionString = "postgresql://postgres:Grenoble10@localhost:5432/postgres";

console.log(`Connecting to database with connection string: ${connectionString}`);

// Créer un pool pour PostgreSQL avec la connexion à la base 'postgres'
const pool = new Pool({
  connectionString: connectionString,
  // Définir un timeout plus long pour les connexions
  connectionTimeoutMillis: 10000,
});

// Gérer les erreurs de connexion 
// (important pour éviter que l'application plante si la base de données n'est pas disponible)
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

// Exporter la connexion Drizzle
export const db = drizzle(pool, { schema });
export { pool };
