import { storage } from '../storage';
import { zcreditAPI, ZCreditResponse } from './zcredit-api';
import { FamilyFund, FundTransaction, User } from '@shared/schema';

// Interface pour les détails de carte stockés
export interface StoredCardDetails {
  token: string;
  cardNumberMask: string;
  expiration: string;
  userId: number;
}

// Interface pour les détails de paiement
export interface PaymentDetails {
  amount: number; // En centimes (aggorot)
  description: string;
  familyId: number;
  userId: number;
  cardToken?: string;
  cardDetails?: {
    cardNumber: string;
    expDate: string; // Format: MMYY
    cvv?: string;
    holderId?: string;
  };
  installments?: {
    numOfPayments: number;
    firstPayment?: number;
    otherPayments?: number;
  };
}

// Interface pour le résultat de paiement
export interface PaymentResult {
  success: boolean;
  message: string;
  transactionId?: string;
  referenceNumber?: string;
  fromCollectiveFund: boolean;
  amountFromFund: number;
  amountFromCard: number;
  paymentDetails?: {
    cardMask?: string;
    cardBrand?: string;
    installments?: number;
  };
}

/**
 * Service pour gérer les paiements avec cascade
 * (utilisation du pot collectif puis carte de crédit si nécessaire)
 */
export class PaymentService {
  /**
   * Traite un paiement avec la stratégie de cascade
   * - D'abord utiliser le pot collectif si disponible
   * - Ensuite utiliser la carte de crédit pour le montant restant si nécessaire
   */
  async processPaymentWithCascade(
    paymentDetails: PaymentDetails
  ): Promise<PaymentResult> {
    try {
      // 1. Vérifier le solde du pot familial
      const familyFund = await storage.getFamilyFund(paymentDetails.familyId);
      
      if (!familyFund) {
        throw new Error(`Fonds non trouvé pour la famille ${paymentDetails.familyId}`);
      }

      // Initialiser le résultat
      const result: PaymentResult = {
        success: false,
        message: '',
        fromCollectiveFund: false,
        amountFromFund: 0,
        amountFromCard: 0
      };

      // 2. Calculer le montant qui peut être prélevé du pot
      const amountFromFund = Math.min(familyFund.balance, paymentDetails.amount);
      let amountFromCard = paymentDetails.amount - amountFromFund;

      // 3. Si le pot peut couvrir tout le montant, utiliser seulement le pot
      if (amountFromFund >= paymentDetails.amount) {
        // Mettre à jour le solde du pot
        await this.deductFromFamilyFund(
          familyFund,
          paymentDetails.amount,
          paymentDetails.userId,
          paymentDetails.description
        );

        // Mettre à jour le résultat
        result.success = true;
        result.message = 'Paiement effectué à partir du pot familial';
        result.fromCollectiveFund = true;
        result.amountFromFund = paymentDetails.amount;
        result.amountFromCard = 0;
        
        return result;
      }

      // 4. Si le pot ne peut pas couvrir tout le montant, utiliser la cascade
      // D'abord déduire ce qui est possible du pot
      if (amountFromFund > 0) {
        await this.deductFromFamilyFund(
          familyFund,
          amountFromFund,
          paymentDetails.userId,
          `${paymentDetails.description} (portion du pot familial)`
        );
        
        result.fromCollectiveFund = true;
        result.amountFromFund = amountFromFund;
      }

      // 5. Ensuite, traiter le montant restant avec la carte de crédit
      if (amountFromCard > 0) {
        // Vérifier si nous avons un token de carte ou des détails de carte
        if (!paymentDetails.cardToken && !paymentDetails.cardDetails) {
          throw new Error('Informations de carte de crédit manquantes pour compléter le paiement');
        }

        // Traiter le paiement par carte
        let creditResponse: ZCreditResponse;
        
        if (paymentDetails.cardToken) {
          // Utiliser le token de carte
          creditResponse = await zcreditAPI.processTokenPayment(
            paymentDetails.cardToken,
            {
              amount: amountFromCard,
              description: `${paymentDetails.description} (portion carte de crédit)`,
              numOfPayments: paymentDetails.installments?.numOfPayments,
              creditType: paymentDetails.installments?.numOfPayments ? 8 : 1,
              firstPaymentSum: paymentDetails.installments?.firstPayment,
              otherPaymentsSum: paymentDetails.installments?.otherPayments
            }
          );
        } else if (paymentDetails.cardDetails) {
          // Utiliser les détails de carte
          creditResponse = await zcreditAPI.processPayment(
            paymentDetails.cardDetails,
            {
              amount: amountFromCard,
              description: `${paymentDetails.description} (portion carte de crédit)`,
              numOfPayments: paymentDetails.installments?.numOfPayments,
              creditType: paymentDetails.installments?.numOfPayments ? 8 : 1,
              firstPaymentSum: paymentDetails.installments?.firstPayment,
              otherPaymentsSum: paymentDetails.installments?.otherPayments
            }
          );
        } else {
          throw new Error('Configuration de paiement invalide');
        }

        // Vérifier si le paiement par carte a réussi
        if (zcreditAPI.isSuccessResponse(creditResponse)) {
          result.success = true;
          result.message = amountFromFund > 0 
            ? 'Paiement effectué en combinant le pot familial et la carte de crédit' 
            : 'Paiement effectué par carte de crédit';
          result.amountFromCard = amountFromCard;
          result.transactionId = creditResponse.TransactionID;
          result.referenceNumber = creditResponse.ReferenceNumber;
          result.paymentDetails = {
            cardMask: creditResponse.CardNumberMask,
            cardBrand: creditResponse.CardBrand,
            installments: creditResponse.PaymentsNumber
          };
          
          // Enregistrer la transaction
          await this.recordCreditCardTransaction(
            paymentDetails.familyId,
            paymentDetails.userId,
            amountFromCard,
            `${paymentDetails.description} (portion carte de crédit)`,
            result.referenceNumber || '',
            result.paymentDetails?.cardMask || ''
          );
          
          return result;
        } else {
          // Si le paiement par carte a échoué, annuler la déduction du pot
          if (amountFromFund > 0) {
            await this.refundToFamilyFund(
              familyFund,
              amountFromFund,
              paymentDetails.userId,
              `Remboursement - Échec de paiement par carte pour: ${paymentDetails.description}`
            );
          }

          // Traduire les messages d'erreur hébreux en français pour une meilleure expérience utilisateur
          const errorMessage = this.translateErrorMessage(creditResponse.ReturnMessage || 'Erreur inconnue');
          throw new Error(`Échec du paiement par carte: ${errorMessage}`);
        }
      }

      // Ce cas ne devrait jamais arriver si la logique ci-dessus est correcte
      throw new Error('Erreur inattendue dans le traitement du paiement');
    } catch (error) {
      console.error('Erreur de paiement avec cascade:', error);
      throw error;
    }
  }

  /**
   * Déduit un montant du fonds familial et enregistre la transaction
   */
  private async deductFromFamilyFund(
    fund: FamilyFund,
    amount: number,
    userId: number,
    description: string
  ): Promise<void> {
    // Mettre à jour le solde
    const newBalance = fund.balance - amount;
    await storage.updateFundBalance(fund.id, newBalance);

    // Enregistrer la transaction
    await storage.addFundTransaction({
      familyFundId: fund.id,
      userId,
      amount: -amount, // Montant négatif pour une déduction
      description
    });
  }

  /**
   * Rembourse un montant au fonds familial et enregistre la transaction
   */
  private async refundToFamilyFund(
    fund: FamilyFund,
    amount: number,
    userId: number,
    description: string
  ): Promise<void> {
    // Mettre à jour le solde
    const newBalance = fund.balance + amount;
    await storage.updateFundBalance(fund.id, newBalance);

    // Enregistrer la transaction
    await storage.addFundTransaction({
      familyFundId: fund.id,
      userId,
      amount: amount, // Montant positif pour un remboursement
      description
    });
  }

  /**
   * Enregistre une transaction de carte de crédit
   */
  private async recordCreditCardTransaction(
    familyId: number,
    userId: number,
    amount: number,
    description: string,
    referenceNumber: string,
    cardMask: string
  ): Promise<void> {
    // Ici, nous pourrions ajouter une logique pour enregistrer les transactions de carte
    // dans une table dédiée si nécessaire
    console.log(`Transaction carte de crédit enregistrée: ${referenceNumber}, montant: ${amount}, carte: ${cardMask}`);
  }

  /**
   * Stocke un token de carte pour une utilisation future
   */
  async storeCardToken(
    userId: number,
    cardDetails: {
      cardNumber: string;
      expDate: string;
      cvv?: string;
      holderId?: string;
    }
  ): Promise<StoredCardDetails> {
    try {
      // Génération du token via Z-Credit
      const token = await zcreditAPI.createCardToken(cardDetails);
      
      // Création des informations masquées de la carte
      const cardNumberMask = this.maskCardNumber(cardDetails.cardNumber);
      
      // Création de l'objet de carte stockée
      const storedCard: StoredCardDetails = {
        token,
        cardNumberMask,
        expiration: cardDetails.expDate,
        userId
      };
      
      // Ici, nous pourrions ajouter une logique pour stocker la carte dans la base de données
      // si nécessaire
      
      return storedCard;
    } catch (error) {
      console.error('Erreur lors du stockage du token de carte:', error);
      throw error;
    }
  }

  /**
   * Masque le numéro de carte de crédit pour l'affichage
   */
  private maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 8) return cardNumber;
    
    const firstDigits = cardNumber.slice(0, 4);
    const lastDigits = cardNumber.slice(-4);
    const maskedPart = 'X'.repeat(cardNumber.length - 8);
    
    return `${firstDigits}${maskedPart}${lastDigits}`;
  }

  /**
   * Traduit les messages d'erreur hébreux en français
   */
  private translateErrorMessage(errorMessage: string): string {
    // Mapping des messages d'erreur Z-Credit
    const errorTranslations: Record<string, string> = {
      'המסוף אינו קיים': 'Le terminal n\'existe pas',
      'התקשר לחברת האשראי': 'Contactez la société de carte de crédit',
      'כרטיס האשראי לא תקין': 'La carte de crédit n\'est pas valide',
      'עסקה לא אושרה': 'Transaction non approuvée',
      'העסקה לא אושרה': 'La transaction n\'a pas été approuvée',
      'העסקה נדחתה': 'Transaction refusée',
      'תוקף הכרטיס פג': 'La carte a expiré',
      'מספר תשלומים לא חוקי': 'Nombre de paiements non valide',
      'שגיאת תקשורת': 'Erreur de communication',
      'סכום העסקה חורג מהמותר': 'Le montant de la transaction dépasse la limite autorisée',
      'תאריך תוקף לא במבנה תקין': 'La date d\'expiration n\'est pas dans un format valide'
    };
    
    // Recherche par substring pour les messages d'erreur contenant des numéros de téléphone ou autres détails
    if (errorMessage.includes('נא להתקשר לקבלת אישור טלפוני')) {
      return 'Une autorisation téléphonique est requise. Veuillez contacter le service de paiement.';
    }

    // Si le message existe dans notre mapping, retourner la traduction
    if (errorMessage in errorTranslations) {
      return errorTranslations[errorMessage];
    }

    // Si on est en mode développement, ajouter le message original
    if (process.env.NODE_ENV === 'development') {
      return `Erreur non traduite (${errorMessage})`;
    }

    // En production, retourner un message générique
    return 'Erreur lors du traitement du paiement';
  }
}

// Singleton du service de paiement
export const paymentService = new PaymentService();