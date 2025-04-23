import { db } from '../db';
import { InsertSubscription, Subscription, insertSubscriptionSchema, subscriptions } from '@shared/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { promoCodeService } from './promo-code-service';
import { ZCreditAPI } from '../payment/zcredit-api';

// Interface pour les détails de paiement
interface PaymentDetails {
  familyId: number;
  userId: number;
  originalPrice: number;
  promoCodeId?: number;
  cardDetails: {
    cardNumber: string;
    expDate: string;
    cvv?: string;
    holderId?: string;
  };
}

export class SubscriptionService {
  private zcreditApi: ZCreditAPI;

  constructor() {
    this.zcreditApi = new ZCreditAPI();
  }

  /**
   * Récupère tous les abonnements
   */
  async getAllSubscriptions(): Promise<Subscription[]> {
    return await db.query.subscriptions.findMany({
      with: {
        family: true,
        user: true,
        promoCode: true
      },
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)]
    });
  }

  /**
   * Récupère un abonnement par son ID
   */
  async getSubscriptionById(id: number): Promise<Subscription | undefined> {
    const result = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, id),
      with: {
        family: true,
        user: true,
        promoCode: true
      }
    });
    return result || undefined;
  }

  /**
   * Récupère l'abonnement actif pour une famille
   */
  async getSubscriptionByFamilyId(familyId: number): Promise<Subscription | undefined> {
    const result = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.familyId, familyId),
        eq(subscriptions.status, 'active')
      ),
      with: {
        promoCode: true
      }
    });
    return result || undefined;
  }

  /**
   * Crée un nouvel abonnement
   */
  async createSubscription(data: InsertSubscription): Promise<Subscription> {
    // Valider les données
    const validatedData = insertSubscriptionSchema.parse(data);
    
    // Insérer dans la base de données
    const [insertedSubscription] = await db
      .insert(subscriptions)
      .values(validatedData)
      .returning();
      
    return insertedSubscription;
  }

  /**
   * Annule un abonnement
   */
  async cancelSubscription(id: number): Promise<Subscription | undefined> {
    // Vérifier si l'abonnement existe
    const existingSubscription = await this.getSubscriptionById(id);
    if (!existingSubscription) {
      return undefined;
    }

    // Mettre à jour l'abonnement
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date()
      })
      .where(eq(subscriptions.id, id))
      .returning();
      
    return updatedSubscription;
  }

  /**
   * Traite un paiement pour un nouvel abonnement
   */
  async processSubscriptionPayment(
    paymentDetails: PaymentDetails,
    promoCode?: string
  ): Promise<{ success: boolean; message: string; subscription?: Subscription }> {
    try {
      // Déterminer le prix initial
      let originalPrice = paymentDetails.originalPrice || 12000; // 120 shekels en aggorot
      let finalPrice = originalPrice;
      let promoCodeObj = undefined;
      let subscriptionType = 'regular';
      let endDate: Date | undefined = undefined;

      // Appliquer le code promo si présent
      if (promoCode) {
        const discountResult = await promoCodeService.calculateDiscountedPrice(promoCode, originalPrice);
        finalPrice = discountResult.finalPrice;
        promoCodeObj = discountResult.promoCode;
        
        // Si c'est un abonnement à vie
        if (promoCodeObj && promoCodeObj.type === 'lifetime') {
          subscriptionType = 'lifetime';
          // Pas de date de fin pour un abonnement à vie
        } else {
          // Pour les abonnements réguliers, la date de fin est dans un an
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          endDate = oneYearFromNow;
        }
      } else {
        // Pour les abonnements réguliers, la date de fin est dans un an
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        endDate = oneYearFromNow;
      }

      // Traiter le paiement avec Z Credit
      const paymentResponse = await this.zcreditApi.processPayment(
        paymentDetails.cardDetails,
        {
          amount: finalPrice,
          description: `Abonnement MyFamily - ${subscriptionType === 'lifetime' ? 'à vie' : 'annuel'}`
        }
      );

      // Vérifier si le paiement a réussi
      if (!this.zcreditApi.isSuccessResponse(paymentResponse)) {
        return {
          success: false,
          message: `Erreur de paiement: ${paymentResponse.ReturnMessage || 'Transaction refusée'}`
        };
      }

      // Créer l'abonnement
      const subscriptionData: InsertSubscription = {
        familyId: paymentDetails.familyId,
        userId: paymentDetails.userId,
        type: subscriptionType,
        status: 'active',
        originalPrice: (originalPrice / 100).toString(), // Convertir en shekels pour l'enregistrement (en string)
        finalPrice: (finalPrice / 100).toString(), // Convertir en shekels pour l'enregistrement (en string)
        startDate: new Date(),
        endDate,
        promoCodeId: promoCodeObj?.id
      };

      const newSubscription = await this.createSubscription(subscriptionData);

      return {
        success: true,
        message: 'Paiement traité avec succès, abonnement créé',
        subscription: newSubscription
      };
    } catch (error) {
      console.error('Erreur lors du traitement du paiement de l\'abonnement:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors du traitement du paiement'
      };
    }
  }

  /**
   * Vérifie si un abonnement est actif et valide
   */
  async isSubscriptionActive(familyId: number): Promise<boolean> {
    const subscription = await this.getSubscriptionByFamilyId(familyId);
    
    if (!subscription) {
      return false;
    }
    
    // Si c'est un abonnement à vie, il est toujours actif
    if (subscription.type === 'lifetime') {
      return true;
    }
    
    // Vérifier la date d'expiration pour les abonnements réguliers
    if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
      // L'abonnement a expiré, le marquer comme tel
      await db
        .update(subscriptions)
        .set({ status: 'expired' })
        .where(eq(subscriptions.id, subscription.id));
        
      return false;
    }
    
    return true;
  }
}

export const subscriptionService = new SubscriptionService();