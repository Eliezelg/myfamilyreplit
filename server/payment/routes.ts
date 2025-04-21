import { Express, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { paymentService } from './payment-service';
import { zcreditAPI } from './zcredit-api';

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

// Schéma pour la requête de paiement avec token
const tokenPaymentRequestSchema = z.object({
  amount: z.number().int().positive(),
  description: z.string().min(3).max(255),
  familyId: z.number().int().positive(),
  token: z.string(),
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
  
  // Route pour effectuer un paiement avec un token
  app.post('/api/payments/process-with-token', checkFamilyMember, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Valider les données de la requête
      const validationResult = tokenPaymentRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Données de paiement invalides',
          details: validationResult.error.format()
        });
      }

      const { amount, description, familyId, token, installments } = validationResult.data;
      const userId = req.user!.id;

      // Obtenir le fonds familial pour vérifier le solde
      const fund = await storage.getFamilyFund(familyId);
      if (!fund) {
        return res.status(404).json({
          error: 'Fonds familial non trouvé'
        });
      }

      // Exécuter la cascade de paiement: d'abord le fonds, puis la carte
      let amountFromFund = 0;
      let amountFromCard = amount;
      let fromCollectiveFund = false;

      // Si le fonds a un solde, l'utiliser autant que possible
      if (fund.balance > 0) {
        if (fund.balance >= amount) {
          // Le fonds couvre tout le montant
          amountFromFund = amount;
          amountFromCard = 0;
          fromCollectiveFund = true;
          
          // Mettre à jour le solde du fonds
          await storage.updateFundBalance(fund.id, fund.balance - amount);
          
          // Enregistrer la transaction depuis le fonds
          await storage.addFundTransaction({
            familyFundId: fund.id,
            userId,
            amount: -amount, // Montant négatif pour un débit
            description: description
          });

          // Renvoyer le résultat sans paiement par carte
          return res.json({
            success: true,
            message: 'Paiement effectué depuis le pot collectif',
            fromCollectiveFund: true,
            amountFromFund,
            amountFromCard: 0
          });
        } else {
          // Le fonds couvre partiellement le montant
          amountFromFund = fund.balance;
          amountFromCard = amount - fund.balance;
          fromCollectiveFund = true;
          
          // Mettre à jour le solde du fonds à zéro
          await storage.updateFundBalance(fund.id, 0);
          
          // Enregistrer la transaction depuis le fonds
          await storage.addFundTransaction({
            familyFundId: fund.id,
            userId,
            amount: -fund.balance, // Montant négatif pour un débit
            description: `${description} (portion du pot familial)`
          });
        }
      }

      // S'il reste un montant à payer par carte
      if (amountFromCard > 0) {
        try {
          // Traiter le paiement par carte avec le token
          const creditResponse = await zcreditAPI.processTokenPayment(
            token,
            {
              amount: amountFromCard,
              description,
              ...(installments && {
                numOfPayments: installments.numOfPayments,
                firstPaymentSum: installments.firstPayment,
                otherPaymentsSum: installments.otherPayments
              })
            }
          );

          // Vérifier si le paiement par carte a réussi
          if (!zcreditAPI.isSuccessResponse(creditResponse)) {
            // Si le paiement par carte a échoué, rembourser le montant prélevé du fonds
            if (amountFromFund > 0) {
              await storage.updateFundBalance(fund.id, fund.balance + amountFromFund);
              await storage.addFundTransaction({
                familyFundId: fund.id,
                userId,
                amount: amountFromFund, // Remboursement positif
                description: `Remboursement - Échec de paiement par carte pour: ${description}`
              });
            }

            return res.status(400).json({
              success: false,
              message: 'Échec du paiement par carte',
              error: creditResponse.ReturnMessage
            });
          }

          // Enregistrer la transaction pour le montant total
          if (amountFromCard === amount) {
            await storage.addFundTransaction({
              familyFundId: fund.id,
              userId,
              amount: -amount, // Négatif car c'est une dépense
              description
            });
          }

          // Log de l'opération réussie
          console.log(`Transaction carte de crédit enregistrée: ${creditResponse.ReferenceNumber}, montant: ${amountFromCard}, carte: ${creditResponse.CardNumberMask || creditResponse.Card4Digits}`);

          // Renvoyer le résultat
          return res.json({
            success: true,
            message: fromCollectiveFund ? 'Paiement mixte effectué (pot collectif + carte)' : 'Paiement effectué par carte de crédit',
            fromCollectiveFund,
            amountFromFund,
            amountFromCard,
            referenceNumber: creditResponse.ReferenceNumber,
            paymentDetails: {
              cardMask: creditResponse.CardNumberMask || creditResponse.Card4Digits
            }
          });
        } catch (error) {
          // En cas d'erreur, rembourser le montant prélevé du fonds
          if (amountFromFund > 0) {
            await storage.updateFundBalance(fund.id, fund.balance + amountFromFund);
            await storage.addFundTransaction({
              familyFundId: fund.id,
              userId,
              amount: amountFromFund, // Remboursement positif
              description: `Remboursement - Erreur de paiement par carte pour: ${description}`
            });
          }

          console.error('Erreur lors du traitement du paiement par carte (token):', error);
          throw error;
        }
      }

    } catch (error) {
      console.error('Erreur lors du traitement du paiement avec token:', error);
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
            const creditResponse = await zcreditAPI.processTokenPayment(
              cardToken,
              {
                amount,
                description: description || `Dépôt au fonds familial`
              }
            );

            paymentResult = {
              success: zcreditAPI.isSuccessResponse(creditResponse),
              referenceNumber: creditResponse.ReferenceNumber,
              cardMask: creditResponse.CardNumberMask
            };
          } else if (cardDetails) {
            const creditResponse = await zcreditAPI.processPayment(
              cardDetails,
              {
                amount,
                description: description || `Dépôt au fonds familial`
              }
            );

            paymentResult = {
              success: zcreditAPI.isSuccessResponse(creditResponse),
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