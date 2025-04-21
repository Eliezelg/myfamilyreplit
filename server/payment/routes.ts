import { Express, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { paymentService } from './payment-service';

// Schéma de validation pour les détails de la carte
const creditCardSchema = z.object({
  cardNumber: z.string().min(13).max(19),
  expDate: z.string().regex(/^\d{4}$/), // Format MMYY
  cvv: z.string().min(3).max(4).optional(),
  holderId: z.string().optional()
});

// Schéma de validation pour les paiements échelonnés
const installmentsSchema = z.object({
  numOfPayments: z.number().int().min(2).max(36),
  firstPayment: z.number().optional(),
  otherPayments: z.number().optional()
});

// Schéma de validation pour la requête de paiement
const paymentRequestSchema = z.object({
  amount: z.number().int().positive(),
  description: z.string().min(3).max(255),
  familyId: z.number().int().positive(),
  cardToken: z.string().optional(),
  cardDetails: creditCardSchema.optional(),
  installments: installmentsSchema.optional()
});

// Schéma de validation pour l'enregistrement de carte
const storeCardRequestSchema = z.object({
  cardDetails: creditCardSchema
});

/**
 * Middleware pour vérifier si l'utilisateur est membre de la famille
 */
async function checkFamilyMember(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send('Utilisateur non authentifié');
    }

    const userId = req.user!.id;
    const familyId = Number(req.params.familyId || req.body.familyId);

    if (!familyId) {
      return res.status(400).send('ID de famille manquant');
    }

    const isMember = await storage.userIsFamilyMember(userId, familyId);
    if (!isMember) {
      return res.status(403).send('Vous n\'êtes pas membre de cette famille');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Enregistre les routes de paiement
 */
export function registerPaymentRoutes(app: Express) {
  // Route pour effectuer un paiement
  app.post('/api/payments/process', checkFamilyMember, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Valider les données de la requête
      const validationResult = paymentRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Données de paiement invalides',
          details: validationResult.error.format()
        });
      }

      const paymentData = validationResult.data;
      
      // Ajouter l'ID utilisateur aux données de paiement
      const userId = req.user!.id;

      // Traiter le paiement avec la cascade
      const result = await paymentService.processPaymentWithCascade({
        ...paymentData,
        userId
      });

      // Renvoyer le résultat
      res.json(result);
    } catch (error) {
      console.error('Erreur lors du traitement du paiement:', error);
      next(error);
    }
  });

  // Route pour stocker un token de carte
  app.post('/api/payments/store-card', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send('Utilisateur non authentifié');
      }

      // Valider les données de la requête
      const validationResult = storeCardRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Données de carte invalides',
          details: validationResult.error.format()
        });
      }

      const { cardDetails } = validationResult.data;
      const userId = req.user!.id;

      // Stocker le token de carte
      const storedCard = await paymentService.storeCardToken(userId, cardDetails);

      // Renvoyer les informations masquées de la carte
      res.json({
        success: true,
        card: {
          cardNumberMask: storedCard.cardNumberMask,
          expiration: storedCard.expiration,
          token: storedCard.token
        }
      });
    } catch (error) {
      console.error('Erreur lors du stockage de la carte:', error);
      next(error);
    }
  });

  // Route pour obtenir le solde du fonds familial
  app.get('/api/families/:familyId/fund/balance', checkFamilyMember, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const familyId = Number(req.params.familyId);
      const fund = await storage.getFamilyFund(familyId);
      
      if (!fund) {
        return res.status(404).json({
          error: 'Fonds familial non trouvé'
        });
      }

      res.json({
        familyId,
        balance: fund.balance,
        currency: fund.currency
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du solde:', error);
      next(error);
    }
  });

  // Route pour ajouter des fonds au pot collectif
  app.post('/api/families/:familyId/fund/deposit', checkFamilyMember, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const familyId = Number(req.params.familyId);
      const userId = req.user!.id;
      
      // Valider les données de la requête
      const depositSchema = z.object({
        amount: z.number().int().positive(),
        description: z.string().min(3).max(255).optional(),
        paymentMethod: z.enum(['card', 'transfer', 'cash']),
        cardToken: z.string().optional(),
        cardDetails: creditCardSchema.optional()
      });

      const validationResult = depositSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Données de dépôt invalides',
          details: validationResult.error.format()
        });
      }

      const { amount, description, paymentMethod, cardToken, cardDetails } = validationResult.data;
      
      // Récupérer le fonds familial
      const fund = await storage.getFamilyFund(familyId);
      if (!fund) {
        return res.status(404).json({
          error: 'Fonds familial non trouvé'
        });
      }

      // Si le dépôt est par carte, traiter le paiement
      if (paymentMethod === 'card') {
        // Vérifier si nous avons des informations de carte
        if (!cardToken && !cardDetails) {
          return res.status(400).json({
            error: 'Informations de carte manquantes pour le dépôt'
          });
        }

        let paymentResult;
        try {
          // Traiter le paiement directement (sans cascade, car c'est un dépôt)
          if (cardToken) {
            const creditResponse = await paymentService['zcreditAPI'].processTokenPayment(
              cardToken,
              {
                amount,
                description: description || `Dépôt au fonds familial`
              }
            );

            paymentResult = {
              success: paymentService['zcreditAPI'].isSuccessResponse(creditResponse),
              referenceNumber: creditResponse.ReferenceNumber,
              cardMask: creditResponse.CardNumberMask
            };
          } else if (cardDetails) {
            const creditResponse = await paymentService['zcreditAPI'].processPayment(
              cardDetails,
              {
                amount,
                description: description || `Dépôt au fonds familial`
              }
            );

            paymentResult = {
              success: paymentService['zcreditAPI'].isSuccessResponse(creditResponse),
              referenceNumber: creditResponse.ReferenceNumber,
              cardMask: creditResponse.CardNumberMask
            };
          }

          if (!paymentResult?.success) {
            return res.status(400).json({
              error: 'Le paiement par carte a échoué'
            });
          }
        } catch (error) {
          console.error('Erreur lors du traitement du paiement par carte:', error);
          return res.status(500).json({
            error: 'Erreur lors du traitement du paiement par carte'
          });
        }
      }

      // Mettre à jour le solde du fonds
      const newBalance = fund.balance + amount;
      await storage.updateFundBalance(fund.id, newBalance);

      // Enregistrer la transaction
      const transaction = await storage.addFundTransaction({
        familyFundId: fund.id,
        userId,
        amount,
        description: description || `Dépôt - ${paymentMethod}`
      });

      res.json({
        success: true,
        transaction,
        newBalance
      });
    } catch (error) {
      console.error('Erreur lors du dépôt:', error);
      next(error);
    }
  });
}