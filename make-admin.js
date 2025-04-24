// Script pour définir un utilisateur comme administrateur
import pg from 'pg';
const { Pool } = pg;

// Se connecter à la base de données PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function makeUserAdmin(email) {
  try {
    // Vérifier que l'utilisateur existe
    const userResult = await pool.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.error(`L'utilisateur avec l'email ${email} n'existe pas`);
      return;
    }

    const user = userResult.rows[0];
    console.log(`Utilisateur trouvé: ${user.email} (ID: ${user.id}), Rôle actuel: ${user.role}`);

    // Mettre à jour le rôle de l'utilisateur à 'admin'
    await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['admin', user.id]
    );
    
    console.log(`L'utilisateur ${email} (ID: ${user.id}) a été défini comme administrateur avec succès.`);
    
    // Vérifier que la mise à jour a bien été effectuée
    const updatedResult = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [user.id]
    );
    
    const updatedUser = updatedResult.rows[0];
    console.log(`Vérification - Utilisateur: ${updatedUser.email}, Nouveau rôle: ${updatedUser.role}`);
  } catch (error) {
    console.error('Erreur lors de la définition de l\'utilisateur comme administrateur:', error);
  } finally {
    pool.end(); // Fermer la connexion à la base de données
  }
}

// Email à définir comme administrateur
const adminEmail = 'tehilaoualid@gmail.com';
makeUserAdmin(adminEmail);