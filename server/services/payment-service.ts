
import { ZCreditAPI, ZCreditResponse } from "../payment/zcredit-api";
import { FamilyFund, FundTransaction } from "@shared/schema";
import { storage } from "../storage";

// Type pour les détails de paiement
export interface PaymentDetails {
  userId: number;
  familyId: number;
  amount: number; // En centimes (aggorot)
  description: string;
  token?: string;
  cardDetails?: {
    cardNumber: string;
    expDate: string;
    cvv?: string;
    holderId?: string;
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

// Type pour les résultats de tokenisation
interface TokenizeResult {
  success: boolean;
  token?: string;
  cardMask?: string;
  message?: string;
}

export class PaymentService {
  private zcreditAPI: ZCreditAPI;
  
  constructor() {
    this.zcreditAPI = new ZCreditAPI();
  }

  /**
   * Vérifie si un utilisateur est membre d'une famille
   */
  async userIsFamilyMember(userId: number, familyId: number): Promise<boolean> {
    return storage.userIsFamilyMember(userId, familyId);
  }

  /**
   * Tokenize une carte de crédit
   */
  async tokenizeCard(cardDetails: {
    cardNumber: string;
    expDate: string;
    cvv?: string;
    holderId?: string;
  }): Promise<TokenizeResult> {
    return this.zcreditAPI.tokenizeCard(cardDetails);
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
      const familyFund = await storage.getFamilyFund(paymentDetails.familyId);
      
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
            await storage.addFundTransaction({
              familyFundId: familyFund.id,
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
   * Ajoute des fonds au pot collectif familial
   */
  async addFundsToFamily(params: {
    userId: number;
    familyId: number;
    amount: number;
    token: string;
  }): Promise<any> {
    try {
      // Effectuer le paiement direct via carte de crédit
      const paymentResponse = await this.zcreditAPI.chargeWithToken(
        params.token, 
        params.amount, 
        "Dépôt au pot familial"
      );
      
      if (!paymentResponse.IsApproved || paymentResponse.ReturnCode !== 0) {
        return { 
          success: false, 
          message: paymentResponse.ReturnMessage || "Failed to process payment" 
        };
      }
      
      // Récupérer le fonds familial
      let familyFund = await storage.getFamilyFund(params.familyId);
      
      // Si le fonds n'existe pas, le créer
      if (!familyFund) {
        familyFund = await storage.createFamilyFund({
          familyId: params.familyId,
          balance: 0,
          currency: "ILS"
        });
      }
      
      // Mettre à jour le solde du fonds
      const newBalance = familyFund.balance + params.amount;
      await storage.updateFundBalance(familyFund.id, newBalance);
      
      // Enregistrer la transaction
      await storage.addFundTransaction({
        familyFundId: familyFund.id,
        amount: params.amount,
        userId: params.userId,
        description: "הפקדה לקופה המשפחתית",
        type: "deposit",
        referenceNumber: paymentResponse.ReferenceNumber?.toString() || ""
      });
      
      return {
        success: true,
        message: "Fonds ajoutés avec succès",
        amountFromCard: params.amount,
        referenceNumber: paymentResponse.ReferenceNumber?.toString() || "",
        paymentDetails: {
          cardMask: paymentResponse.CardNumberMask || paymentResponse.Card4Digits || "xxxx"
        }
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajout de fonds:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
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
    await storage.updateFundBalance(familyFund.id, newBalance);
    
    // Ajouter la transaction à l'historique
    await storage.addFundTransaction({
      familyFundId: familyFund.id,
      amount: amount,
      type: "payment",
      description,
      createdAt: new Date(),
      userId
    });
  }
}

export const paymentService = new PaymentService();
