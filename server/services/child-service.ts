
import { db } from "../db";
import { children, type Child, type InsertChild } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Service pour gérer les opérations liées aux enfants
 */
class ChildService {
  /**
   * Récupère les enfants d'un utilisateur
   */
  async getUserChildren(userId: number): Promise<Child[]> {
    return db.select()
      .from(children)
      .where(eq(children.userId, userId))
      .orderBy(children.name);
  }
  
  /**
   * Récupère un enfant par son ID
   */
  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await db.select()
      .from(children)
      .where(eq(children.id, id));
    
    return child || undefined;
  }
  
  /**
   * Ajoute un nouvel enfant
   */
  async addChild(child: InsertChild): Promise<Child> {
    // Prétraiter les données pour s'assurer que les dates sont correctement formatées
    const sanitizedData = this.sanitizeData(child);
    
    const [newChild] = await db.insert(children)
      .values(sanitizedData)
      .returning();
    
    return newChild;
  }
  
  /**
   * Met à jour les informations d'un enfant
   */
  async updateChild(id: number, childData: Partial<Child>): Promise<Child> {
    // Prétraiter les données pour s'assurer que les dates sont correctement formatées
    const sanitizedData = this.sanitizeData(childData);
    
    const [updatedChild] = await db.update(children)
      .set(sanitizedData)
      .where(eq(children.id, id))
      .returning();
    
    return updatedChild;
  }
  
  /**
   * Supprime un enfant
   */
  async deleteChild(id: number): Promise<void> {
    await db.delete(children)
      .where(eq(children.id, id));
  }
  
  /**
   * Fonction utilitaire pour nettoyer les données avant insertion/mise à jour
   */
  private sanitizeData(data: any): any {
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
}

export const childService = new ChildService();
