import { Request, Response } from 'express';
import { subscriptionService } from '../services/subscription-service';
import { z } from 'zod';

// Schéma de validation pour les requêtes de paiement
const paymentSchema = z.object({
  familyId: z.number(),
  cardDetails: z.object({
    cardNumber: z.string(),
    expDate: z.string(),
    cvv: z.string().optional(),
    holderId: z.string().optional()
  }),
  promoCode: z.string().optional()
});

export class SubscriptionController {
  /**
   * Récupérer la liste des abonnements (admin uniquement)
   */
  async getAllSubscriptions(req: Request, res: Response) {
    try {
      const subscriptions = await subscriptionService.getAllSubscriptions();
      return res.status(200).json(subscriptions);
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnements:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération des abonnements' });
    }
  }

  /**
   * Récupérer un abonnement par son ID (admin ou propriétaire)
   */
  async getSubscriptionById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID d\'abonnement invalide' });
      }

      const subscription = await subscriptionService.getSubscriptionById(id);
      if (!subscription) {
        return res.status(404).json({ message: 'Abonnement non trouvé' });
      }

      // Vérifier si l'utilisateur est autorisé à voir cet abonnement
      if (req.user?.role !== 'admin' && subscription.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Accès non autorisé à cet abonnement' });
      }

      return res.status(200).json(subscription);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'abonnement:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération de l\'abonnement' });
    }
  }

  /**
   * Récupérer l'abonnement pour une famille spécifique
   */
  async getSubscriptionByFamilyId(req: Request, res: Response) {
    try {
      const familyId = parseInt(req.params.familyId);
      if (isNaN(familyId)) {
        return res.status(400).json({ message: 'ID de famille invalide' });
      }

      const subscription = await subscriptionService.getSubscriptionByFamilyId(familyId);
      if (!subscription) {
        return res.status(404).json({ message: 'Aucun abonnement actif trouvé pour cette famille' });
      }

      return res.status(200).json(subscription);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'abonnement:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération de l\'abonnement' });
    }
  }

  /**
   * Traiter un paiement et créer un abonnement
   */
  async createSubscription(req: Request, res: Response) {
    try {
      // Vérifier que l'utilisateur est connecté
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Utilisateur non authentifié' });
      }

      // Valider les données de paiement
      const validationResult = paymentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Données de paiement invalides', 
          errors: validationResult.error.errors 
        });
      }

      const { familyId, cardDetails, promoCode } = validationResult.data;

      // Vérifier si un abonnement actif existe déjà
      const existingSubscription = await subscriptionService.getSubscriptionByFamilyId(familyId);
      if (existingSubscription) {
        return res.status(400).json({ 
          message: 'Cette famille a déjà un abonnement actif',
          subscription: existingSubscription
        });
      }

      // Traiter le paiement et créer l'abonnement
      const result = await subscriptionService.processSubscriptionPayment(
        {
          familyId,
          userId: req.user.id,
          originalPrice: 12000, // 120 shekels en aggorot
          cardDetails
        },
        promoCode
      );

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      return res.status(201).json({
        message: result.message,
        subscription: result.subscription
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'abonnement:', error);
      return res.status(500).json({ message: 'Erreur lors de la création de l\'abonnement' });
    }
  }

  /**
   * Annuler un abonnement (admin ou propriétaire)
   */
  async cancelSubscription(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID d\'abonnement invalide' });
      }

      // Vérifier si l'abonnement existe
      const subscription = await subscriptionService.getSubscriptionById(id);
      if (!subscription) {
        return res.status(404).json({ message: 'Abonnement non trouvé' });
      }

      // Vérifier si l'utilisateur est autorisé à annuler cet abonnement
      if (req.user?.role !== 'admin' && subscription.userId !== req.user?.id) {
        return res.status(403).json({ message: 'Non autorisé à annuler cet abonnement' });
      }

      // Annuler l'abonnement
      const canceledSubscription = await subscriptionService.cancelSubscription(id);
      return res.status(200).json({
        message: 'Abonnement annulé avec succès',
        subscription: canceledSubscription
      });
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      return res.status(500).json({ message: 'Erreur lors de l\'annulation de l\'abonnement' });
    }
  }

  /**
   * Vérifier si un abonnement est actif
   */
  async checkSubscriptionStatus(req: Request, res: Response) {
    try {
      const familyId = parseInt(req.params.familyId);
      if (isNaN(familyId)) {
        return res.status(400).json({ message: 'ID de famille invalide' });
      }

      const isActive = await subscriptionService.isSubscriptionActive(familyId);
      return res.status(200).json({
        isActive,
        message: isActive 
          ? 'L\'abonnement est actif' 
          : 'Aucun abonnement actif pour cette famille'
      });
    } catch (error) {
      console.error('Erreur lors de la vérification du statut de l\'abonnement:', error);
      return res.status(500).json({ message: 'Erreur lors de la vérification du statut de l\'abonnement' });
    }
  }
}

export const subscriptionController = new SubscriptionController();