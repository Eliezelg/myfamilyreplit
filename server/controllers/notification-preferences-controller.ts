import { Request, Response } from 'express';
import { notificationPreferencesService } from '../services/notification-preferences-service';
import { storage } from '../storage';

/**
 * Récupère les préférences de notification de l'utilisateur connecté
 */
export const getUserNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    const preferences = await notificationPreferencesService.getUserPreferences(userId);
    
    if (!preferences) {
      return res.status(404).json({ message: 'Préférences de notification non trouvées' });
    }
    
    return res.status(200).json(preferences);
  } catch (error) {
    console.error('Erreur lors de la récupération des préférences de notification:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération des préférences de notification' });
  }
};

/**
 * Met à jour les préférences de notification de l'utilisateur connecté
 */
export const updateUserNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    const preferences = req.body;
    
    // Valider les préférences reçues
    const validPreferenceKeys = [
      'newPhotoEmail', 'newPhotoPush',
      'newCommentEmail', 'newCommentPush',
      'newReactionEmail', 'newReactionPush',
      'newGazetteEmail', 'newGazettePush',
      'familyEventEmail', 'familyEventPush',
      'weeklyDigestEmail'
    ];
    
    // Filtrer pour ne garder que les clés valides
    const validPreferences = Object.keys(preferences)
      .filter(key => validPreferenceKeys.includes(key))
      .reduce((obj, key) => {
        obj[key] = preferences[key];
        return obj;
      }, {} as Record<string, any>);
    
    const updatedPreferences = await notificationPreferencesService.updateUserPreferences(userId, validPreferences);
    
    if (!updatedPreferences) {
      return res.status(500).json({ message: 'Erreur lors de la mise à jour des préférences de notification' });
    }
    
    return res.status(200).json(updatedPreferences);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences de notification:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour des préférences de notification' });
  }
};
