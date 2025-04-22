
import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { hashPassword } from "../auth";

// Fonction utilitaire pour nettoyer les objets avant insertion/mise à jour dans la base de données
function sanitizeData(data: any): any {
  // Si le champ est null ou undefined, on renvoie une copie simple
  if (!data) return data;
  
  const result: any = {};
  
  for (const key in data) {
    // On saute les clés inexistantes
    if (!(key in data)) continue;
    
    const value = data[key];
    
    // Traitement spécial pour les champs de date
    if (key.toLowerCase().includes('date') && key !== 'createdAt' && key !== 'updatedAt') {
      // Si la valeur est vide, explicitement à null
      if (value === null || value === undefined || 
          (typeof value === 'string' && value.toString().trim() === '')) {
        result[key] = null;
      } 
      // Si c'est déjà une date, on la garde
      else if (value instanceof Date) {
        result[key] = value;
      }
      // Si c'est une chaîne de caractères qui ressemble à une date ISO
      else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        try {
          result[key] = new Date(value);
        } catch (error) {
          // Si la conversion échoue, on met null
          result[key] = null;
        }
      }
      // Autres formats de date (YYYY-MM-DD)
      else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        try {
          result[key] = new Date(value);
        } catch (error) {
          // Si la conversion échoue, on met null
          result[key] = null;
        }
      }
      // Sinon on garde la valeur telle quelle (mais attention aux erreurs potentielles)
      else {
        try {
          // Essayer de convertir en date si c'est un timestamp ou autre format
          const possibleDate = new Date(value);
          if (!isNaN(possibleDate.getTime())) {
            result[key] = possibleDate;
          } else {
            result[key] = null;
          }
        } catch (error) {
          // Erreur de conversion, on met null
          result[key] = null;
        }
      }
    } else {
      // Pour les autres champs, copier tel quel
      result[key] = value;
    }
  }
  
  return result;
}

export class UserService {
  /**
   * Récupère un utilisateur par son ID
   */
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
  
  /**
   * Récupère un utilisateur par son nom d'utilisateur ou email (insensible à la casse)
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    // Recherche insensible à la casse
    const input = username.toLowerCase().trim();
    const allUsers = await db.select().from(users);
    
    // Comparer manuellement sans tenir compte de la casse (username ou email)
    const user = allUsers.find(u => 
      u.username.toLowerCase() === input || 
      u.email.toLowerCase() === input
    );
    return user || undefined;
  }
  
  /**
   * Récupère un utilisateur par son email
   */
  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalizedEmail = email.toLowerCase().trim();
    const allUsers = await db.select().from(users);
    
    const user = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    return user || undefined;
  }
  
  /**
   * Crée un nouvel utilisateur
   */
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  /**
   * Met à jour le profil d'un utilisateur
   */
  async updateUserProfile(id: number, profileData: Partial<User>): Promise<User> {
    // Prétraiter les données pour s'assurer que les dates sont correctement formatées
    const sanitizedData = sanitizeData(profileData);
    
    const [updatedUser] = await db.update(users)
      .set(sanitizedData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  /**
   * Met à jour le mot de passe d'un utilisateur
   */
  async updateUserPassword(id: number, newPassword: string): Promise<User> {
    const hashedPassword = await hashPassword(newPassword);
    
    const [updatedUser] = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
}

// Exporter une instance par défaut
export const userService = new UserService();
