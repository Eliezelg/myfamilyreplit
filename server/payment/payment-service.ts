import { storage } from '../storage';
import { ZCreditAPI, ZCreditResponse } from './zcredit-api';
import { FamilyFund, FundTransaction } from '@shared/schema';

// Type pour les détails de paiement
export interface PaymentDetails {
  userId: number;
  familyId: number;
  amount: number; // En centimes (aggorot)
  description: string;
  cardToken?: string;
  cardDetails?: {
    cardNumber: string;
    expDate: string;
    cvv?: string;
    holderId?: string;
  };
  installments?: {
    numOfPayments: number;
    firstPayment?: number;
    otherPayments?: number;
  };
}

// Type pour le résultat de paiement
export interface PaymentResult {
  success: boolean;
  message: string;
  fromCollectiveFund: boolean;
  amountFromFund: number;
  amountFromCard: number;
  referenceNumber?: string;
  paymentDetails?: {
    cardMask?: string;
  };
}

/**
 * Service pour gérer les paiements avec cascade
 * (utilisation du pot collectif puis carte de crédit si nécessaire)
 */
export class PaymentService {
  private zcreditAPI: ZCreditAPI;
  private storage: any;

  constructor(zcreditAPI: ZCreditAPI, storage: any) {
    this.zcreditAPI = zcreditAPI;
    this.storage = storage;
  }

  /**
   * Traite un paiement avec un token de carte
   */
  async processPaymentWithToken(paymentDetails: {
    userId: number;
    familyId: number;
    amount: number;
    description: string;
    token: string;
  }): Promise<PaymentResult> {
    try {
      // Initialiser le résultat
      const result: PaymentResult = {
        success: false,
        message: '',
        fromCollectiveFund: false,
        amountFromFund: 0,
        amountFromCard: 0
      };

      // Vérifier si nous avons un fonds familial qui peut être utilisé
      const familyFund = await this.storage.getFamilyFund(paymentDetails.familyId);
      
      // Si un fonds existe et a un solde, on essaie d'abord de l'utiliser
      if (familyFund && familyFund.balance > 0) {
        // Calculer le montant qui peut être prélevé du pot
        const amountFromFund = Math.min(familyFund.balance, paymentDetails.amount);
        
        // Si on peut prélever quelque chose du fonds
        if (amountFromFund > 0) {
          // Mettre à jour le solde du fonds
          await this.deductFromFamilyFund(
            familyFund,
            amountFromFund,
            paymentDetails.userId,
            `${paymentDetails.description} (portion du pot familial)`
          );
          
          result.fromCollectiveFund = true;
          result.amountFromFund = amountFromFund;
          
          // Si le fonds couvre tout le montant, on a terminé
          if (amountFromFund >= paymentDetails.amount) {
            result.success = true;
            result.message = 'Paiement effectué à partir du pot familial';
            return result;
          }
        }
      }
      
      // Calculer le montant restant à prélever par carte
      const amountFromCard = paymentDetails.amount - (result.amountFromFund || 0);
      
      // Si un montant est à prélever par carte, on utilise le token
      if (amountFromCard > 0) {
        // Effectuer le paiement par carte
        const creditResponse = await this.zcreditAPI.chargeWithToken(
          paymentDetails.token,
          amountFromCard,
          `${paymentDetails.description} (portion carte de crédit)`
        );
        
        // Vérifier si le paiement par carte a réussi
        if (creditResponse.IsApproved && creditResponse.ReturnCode === 0) {
          // Enregistrer la transaction dans l'historique si nécessaire
          if (familyFund) {
            await this.storage.addFundTransaction({
              fundId: familyFund.id,
              amount: amountFromCard,
              type: "payment",
              description: `${paymentDetails.description} (carte)`,
              createdAt: new Date(),
              referenceNumber: creditResponse.ReferenceNumber || creditResponse.VoucherNumber,
              userId: paymentDetails.userId
            });
          }
          
          // Mettre à jour le résultat
          result.success = true;
          result.message = result.fromCollectiveFund 
            ? 'Paiement effectué par pot familial et carte de crédit' 
            : 'Paiement effectué par carte de crédit';
          result.amountFromCard = amountFromCard;
          result.referenceNumber = creditResponse.ReferenceNumber || creditResponse.VoucherNumber;
          result.paymentDetails = {
            cardMask: creditResponse.CardNumberMask || creditResponse.Card4Digits
          };
          
          return result;
        } else {
          // Le paiement par carte a échoué
          throw new Error(
            creditResponse.ReturnMessage || 
            `Erreur lors du paiement par carte (code ${creditResponse.ReturnCode || 'inconnu'})`
          );
        }
      }
      
      // Si on arrive ici, c'est qu'il y a eu une erreur non capturée
      throw new Error('Erreur inattendue lors du traitement du paiement');
    } catch (error) {
      console.error('Erreur lors du traitement du paiement:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        fromCollectiveFund: false,
        amountFromFund: 0,
        amountFromCard: 0
      };
    }
  }

  /**
   * Déduit un montant du fonds familial et ajoute une transaction
   */
  private async deductFromFamilyFund(
    familyFund: FamilyFund,
    amount: number,
    userId: number,
    description: string
  ): Promise<void> {
    // Mettre à jour le solde du fonds
    const newBalance = Math.max(0, familyFund.balance - amount);
    await this.storage.updateFundBalance(familyFund.id, newBalance);
    
    // Ajouter la transaction à l'historique
    await this.storage.addFundTransaction({
      fundId: familyFund.id,
      amount: amount,
      type: "payment",
      description,
      createdAt: new Date(),
      userId
    });
  }
}