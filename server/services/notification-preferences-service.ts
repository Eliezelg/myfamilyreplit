import { db } from '../db';
import { notificationPreferences } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Service pour gérer les préférences de notification des utilisateurs
 */
export class NotificationPreferencesService {
  /**
   * Récupère les préférences de notification d'un utilisateur
   */
  async getUserPreferences(userId: number) {
    try {
      const [userPreferences] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
      
      return userPreferences || null;
    } catch (error) {
      console.error('Erreur lors de la récupération des préférences de notification:', error);
      return null;
    }
  }

  /**
   * Crée ou met à jour les préférences de notification d'un utilisateur
   */
  async updateUserPreferences(userId: number, preferences: Partial<Omit<typeof notificationPreferences.$inferInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
    try {
      // Vérifier si l'utilisateur a déjà des préférences
      const existingPreferences = await this.getUserPreferences(userId);
      
      if (existingPreferences) {
        // Mettre à jour les préférences existantes
        await db
          .update(notificationPreferences)
          .set({ ...preferences, updatedAt: new Date() })
          .where(eq(notificationPreferences.userId, userId));
        
        return await this.getUserPreferences(userId);
      } else {
        // Créer de nouvelles préférences
        await db
          .insert(notificationPreferences)
          .values({
            userId,
            ...preferences,
          });
        
        return await this.getUserPreferences(userId);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences de notification:', error);
      return null;
    }
  }

  /**
   * Vérifie si un utilisateur souhaite recevoir un type spécifique de notification
   */
  async shouldNotifyUser(userId: number, notificationType: string, channel: 'email' | 'push') {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences) {
        // Par défaut, on notifie l'utilisateur s'il n'a pas défini de préférences
        return true;
      }
      
      // Construire le nom de la propriété à vérifier
      const propertyName = `${notificationType}${channel.charAt(0).toUpperCase() + channel.slice(1)}` as keyof typeof preferences;
      
      // Vérifier si la propriété existe et retourner sa valeur
      return propertyName in preferences ? preferences[propertyName] : true;
    } catch (error) {
      console.error('Erreur lors de la vérification des préférences de notification:', error);
      return true; // Par défaut, on notifie l'utilisateur en cas d'erreur
    }
  }
}

// Export d'une instance singleton du service
export const notificationPreferencesService = new NotificationPreferencesService();
