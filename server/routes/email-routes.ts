import { Express, Request, Response } from 'express';
import { emailController } from '../controllers/email-controller';
import { requireAdmin } from '../middleware/admin-middleware';

/**
 * Enregistrement des routes pour les emails
 */
export function registerEmailRoutes(app: Express) {
  // Route de test d'email (admin seulement)
  app.post('/api/email/test', requireAdmin, async (req: Request, res: Response) => {
    await emailController.sendTestEmail(req, res);
  });
  
  // Route pour envoyer un rappel de gazette manuellement (admin seulement)
  app.post('/api/email/gazette-reminder/:familyId', requireAdmin, async (req: Request, res: Response) => {
    try {
      const familyId = parseInt(req.params.familyId);
      const photosCount = parseInt(req.body.photosCount) || 0;
      const photoTarget = parseInt(req.body.photoTarget) || 10;
      
      if (isNaN(familyId)) {
        return res.status(400).json({ message: 'ID de famille invalide' });
      }
      
      const success = await emailController.sendGazetteReminder(familyId, photosCount, photoTarget);
      
      if (success) {
        return res.status(200).json({ message: 'Emails de rappel envoyés avec succès' });
      } else {
        return res.status(500).json({ message: 'Erreur lors de l\'envoi des emails de rappel' });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des emails de rappel:', error);
      return res.status(500).json({ message: 'Erreur serveur lors de l\'envoi des emails de rappel' });
    }
  });
}