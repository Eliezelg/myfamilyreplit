import axios from 'axios';
import { storage } from '../storage';
import { FamilyFund, FundTransaction } from '@shared/schema';

// Type pour les paramètres de configuration de Z-Credit
interface ZCreditConfig {
  terminalNumber: string;
  password: string;
  apiUrl: string;
}

// Type pour les détails de la carte de crédit
interface CreditCardDetails {
  cardNumber: string;
  expDate: string; // Format: MMYY
  cvv?: string;
  holderId?: string;
}

// Type pour les détails de la transaction
interface TransactionDetails {
  amount: number; // En centimes (aggorot)
  description: string;
  numOfPayments?: number;
  creditType?: number; // 1 pour transaction régulière, 8 pour paiement échelonné
  firstPaymentSum?: number;
  otherPaymentsSum?: number;
  uniqueId?: string;
}

// Type pour les résultats de tokenisation
interface TokenizeResult {
  success: boolean;
  token?: string;
  cardMask?: string;
  message?: string;
}

// Type pour la réponse de Z-Credit basé sur la documentation
export interface ZCreditResponse {
  // Structure basée sur la documentation Z-Credit
  HasError?: boolean;
  ReturnCode?: number;
  ReturnMessage?: string;
  ReturnValue?: number; // Pour compatibilité avec le code existant
  CardNumber?: string;
  Card4Digits?: string;
  CardBIN?: string;
  ExpDate_MMYY?: string;
  CardName?: string;
  CardIssuerCode?: number;
  CardFinancerCode?: number;
  CardBrandCode?: number;
  ReferenceNumber?: string;
  VoucherNumber?: string;
  ApprovalNumber?: string;
  IsTelApprovalNeeded?: boolean;
  Token?: string;
  ClientReciept?: string;
  SellerReciept?: string;
  ResultRecord?: string;
  IntOt_JSON?: string;
  IntOt?: string;
  PanEntryMode?: string;
  PaymentMethod?: number;
  ApprovalType?: string;
  
  // Propriétés supplémentaires pour compatibilité avec le code existant
  IsApproved?: boolean;
  CardNumberMask?: string;
  CardBrand?: string;
  CardHolderID?: string;
  CreditCardCompanyCode?: number;
  TransactionSum?: number;
  TransactionID?: string;
  AuthNumber?: string;
  PaymentsNumber?: number;
  FirstPaymentSum?: number;
  OtherPaymentsSum?: number;
}

/**
 * Classe pour intégrer avec l'API Z-Credit
 */
export class ZCreditAPI {
  private config: ZCreditConfig;

  constructor(config?: ZCreditConfig) {
    // Si aucune configuration n'est fournie, utiliser les variables d'environnement
    this.config = config || {
      terminalNumber: process.env.ZCREDIT_TERMINAL_NUMBER || '',
      password: process.env.ZCREDIT_PASSWORD || '',
      apiUrl: process.env.ZCREDIT_API_URL || 'https://pci.zcredit.co.il/ZCreditWS/api'
    };
  }

  /**
   * Effectue une transaction de paiement
   */
  async processPayment(
    creditCard: CreditCardDetails,
    transaction: TransactionDetails
  ): Promise<ZCreditResponse> {
    try {
      // Conversion de l'amount de aggorot (centimes) à NIS avec 2 décimales comme attendu par l'API
      const transactionSum = (transaction.amount / 100).toFixed(2);
      
      // Préparation des montants de paiements échelonnés si nécessaire
      let firstPaymentSum = undefined;
      let otherPaymentsSum = undefined;
      
      if (transaction.numOfPayments && transaction.numOfPayments > 1) {
        if (transaction.firstPaymentSum && transaction.otherPaymentsSum) {
          firstPaymentSum = (transaction.firstPaymentSum / 100).toFixed(2);
          otherPaymentsSum = (transaction.otherPaymentsSum / 100).toFixed(2);
        } else {
          // Calcul automatique des montants pour paiements échelonnés égaux
          const totalAmount = transaction.amount / 100;
          const numPayments = transaction.numOfPayments;
          
          // Calcul du montant pour chaque paiement (sauf le premier)
          const paymentAmount = Math.floor((totalAmount / numPayments) * 100) / 100;
          otherPaymentsSum = paymentAmount.toFixed(2);
          
          // Le premier paiement prend le reste pour égaliser le montant total
          const firstAmount = totalAmount - (paymentAmount * (numPayments - 1));
          firstPaymentSum = firstAmount.toFixed(2);
        }
      }

      // Construction du payload selon la documentation Z-Credit
      // Inclusion des paramètres obligatoires uniquement, en suivant strictement la documentation
      const payload: Record<string, string> = {
        TerminalNumber: this.config.terminalNumber,
        Password: this.config.password,
        CardNumber: creditCard.cardNumber,
        ExpDate_MMYY: this.formatExpDate(creditCard.expDate),
        TransactionSum: transactionSum,
        CVV: creditCard.cvv || '',
        NumberOfPayments: transaction.numOfPayments ? transaction.numOfPayments.toString() : "1",
        CreditType: transaction.creditType ? transaction.creditType.toString() : "1",
        CurrencyType: "1", // ILS (shekels)
        TransactionType: "01", // Transaction standard
        J: "0", // Transaction standard pour les paiements directs
        ItemDescription: transaction.description || "Paiement MyFamily",
        TransactionUniqueID: transaction.uniqueId || this.generateUniqueId()
      };
      
      // Ajouter les paramètres conditionnels uniquement lorsqu'ils sont nécessaires
      if (transaction.numOfPayments && transaction.numOfPayments > 1) {
        (payload as Record<string, string>)["FirstPaymentSum"] = firstPaymentSum || "0";
        (payload as Record<string, string>)["OtherPaymentsSum"] = otherPaymentsSum || "0";
      }
      
      if (creditCard.holderId) {
        (payload as Record<string, string>)["HolderID"] = creditCard.holderId;
      }

      console.log('Envoi de requête à Z-Credit:', JSON.stringify({
        url: `${this.config.apiUrl}/Transaction/CommitFullTransaction`,
        ...payload,
        Password: '******' // Masquer le mot de passe dans les logs
      }));

      // Effectuer la requête HTTP vers l'API Z-Credit
      const response = await axios.post(
        `${this.config.apiUrl}/Transaction/CommitFullTransaction`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        }
      );

      console.log('Réponse de Z-Credit:', JSON.stringify(response.data));

      // Vérifier la réponse
      if (response.data) {
        // Adapter la réponse pour compatibilité avec le code existant
        const result = response.data as ZCreditResponse;
        
        // S'assurer que IsApproved est défini pour compatibilité
        if (result.ReturnCode === 0 && !result.HasError) {
          result.IsApproved = true;
          result.ReturnValue = 0; // Pour compatibilité
        } else {
          result.IsApproved = false;
          result.ReturnValue = result.ReturnCode || -1; // Pour compatibilité
        }
        
        // Mapper CardNumberMask si besoin
        if (!result.CardNumberMask && result.CardNumber) {
          result.CardNumberMask = result.CardNumber;
        }
        
        return result;
      }

      throw new Error('Réponse Z-Credit invalide');
    } catch (error) {
      console.error('Erreur lors du traitement de paiement Z-Credit:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Détails de l\'erreur Z-Credit:', error.response.data);
        throw new Error(`Erreur Z-Credit: ${error.response.data?.ReturnMessage || error.message || 'Erreur inconnue'}`);
      }
      throw error;
    }
  }

  /**
   * Génère un identifiant unique pour la transaction
   */
  private generateUniqueId(): string {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000000);
    return `MYFAMILY-${timestamp}-${random}`;
  }

  /**
   * Vérifie si la réponse de Z-Credit est un succès
   */
  isSuccessResponse(response: ZCreditResponse): boolean {
    return response.ReturnValue === 0 && response.IsApproved === true;
  }
  
  /**
   * Formate la date d'expiration au format attendu par Z-Credit
   * Selon l'erreur reçue, Z-Credit veut MMYY sans séparateur
   */
  private formatExpDate(expDate: string): string {
    // Si la date est déjà au format MMYY (comme 0528)
    if (expDate.length === 4) {
      // Renvoyer tel quel (le format MMYY sans séparateur)
      return expDate;
    }
    
    // Si la date contient un séparateur, l'enlever
    return expDate.replace(/[^0-9]/g, '');
  }

  /**
   * Crée un token pour la carte de crédit
   */
  async tokenizeCard(creditCard: CreditCardDetails): Promise<TokenizeResult> {
    try {
      // Construction du payload pour la tokenisation selon la documentation Z-Credit
      const payload: Record<string, any> = {
        TerminalNumber: this.config.terminalNumber,
        Password: this.config.password,
        CardNumber: creditCard.cardNumber,
        ExpDate_MMYY: this.formatExpDate(creditCard.expDate),
        CVV: creditCard.cvv || '',
        TransactionSum: 1, // 1 NIS pour autorisation minimum
        J: 5, // 5 pour autorisation uniquement comme spécifié dans la doc
        TransactionUniqueID: this.generateUniqueId(),
        // Paramètres obligatoires pour l'autorisation selon la documentation
        CurrencyType: "1", // 1 pour ILS (shekels)
        CreditType: "1",   // 1 pour transaction régulière
        ItemDescription: "Tokenisation carte", // Utiliser ItemDescription au lieu de Description
        TransactionType: "01" // Transaction standard
      };
      
      if (creditCard.holderId) {
        payload.HolderID = creditCard.holderId;
      }

      // Log détaillé pour debug
      console.log('URL Z-Credit:', `${this.config.apiUrl}/Transaction/CommitFullTransaction`);
      console.log('Contenu de la requête Z-Credit (tokenisation):', JSON.stringify(payload));
      
      // Effectuer la requête HTTP vers l'API Z-Credit
      const response = await axios.post(
        `${this.config.apiUrl}/Transaction/CommitFullTransaction`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
          }
        }
      );

      // Log de la réponse
      console.log('Réponse Z-Credit (tokenisation) type:', typeof response.data);
      
      // Gestion des réponses XML
      if (typeof response.data === 'string' && response.data.includes('<Token>')) {
        // Extraction simple du token depuis la réponse XML
        const tokenMatch = response.data.match(/<Token>([^<]+)<\/Token>/);
        if (tokenMatch && tokenMatch[1]) {
          console.log('Token extrait de XML:', tokenMatch[1]);
          return {
            success: true,
            token: tokenMatch[1],
            cardMask: creditCard.cardNumber.replace(/\d(?=\d{4})/g, '*')
          };
        }
      }
      
      // Gestion des réponses JSON
      if (typeof response.data === 'object' && response.data.Token) {
        console.log('Token extrait de JSON:', response.data.Token);
        return {
          success: true,
          token: response.data.Token,
          cardMask: response.data.CardNumber || creditCard.cardNumber.replace(/\d(?=\d{4})/g, '*')
        };
      }

      // Si une réponse IntOt_JSON contient un token
      if (response.data.IntOt_JSON) {
        try {
          const intOtData = JSON.parse(response.data.IntOt_JSON);
          if (intOtData && intOtData.Token) {
            console.log('Token extrait de IntOt_JSON:', intOtData.Token);
            return {
              success: true,
              token: intOtData.Token,
              cardMask: intOtData.CardNumber || creditCard.cardNumber.replace(/\d(?=\d{4})/g, '*')
            };
          }
        } catch (e) {
          console.error('Erreur lors du parsing de IntOt_JSON:', e);
        }
      }

      console.error('Aucun token trouvé dans la réponse Z-Credit:', response.data);
      return {
        success: false,
        message: 'Impossible de créer un token pour la carte'
      };
    } catch (error) {
      console.error('Erreur lors de la création du token:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Détails de l\'erreur Z-Credit:', JSON.stringify(error.response.data));
        return {
          success: false,
          message: `Erreur Z-Credit: ${error.response.data?.ReturnMessage || 'Erreur inconnue'}`
        };
      } else if (axios.isAxiosError(error)) {
        console.error('Erreur de connexion Z-Credit:', error.message);
        return {
          success: false,
          message: `Erreur de connexion à Z-Credit: ${error.message}`
        };
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Effectue un paiement avec un token
   */
  async chargeWithToken(
    token: string,
    amount: number,
    description: string = "Paiement MyFamily"
  ): Promise<ZCreditResponse> {
    try {
      // Conversion de l'amount de aggorot (centimes) à NIS avec 2 décimales
      const transactionSum = (amount / 100).toFixed(2);
      
      // Construction du payload pour le paiement par token selon la documentation
      // Adaptée spécifiquement selon les exigences de Z-Credit
      const payload: Record<string, string> = {
        TerminalNumber: this.config.terminalNumber,
        Password: this.config.password,
        CardToken: token, // Utiliser le token dans le champ CardToken comme requis par Z-Credit
        TokenUse: "1", // Indiquer d'utiliser le token pour la transaction
        TransactionSum: transactionSum,
        NumberOfPayments: "1",
        CreditType: "1",
        CurrencyType: "1", // ILS (shekels)
        TransactionType: "01", // Transaction standard
        J: "1", // 1 pour transaction avec token
        ItemDescription: description,
        TransactionUniqueID: this.generateUniqueId()
      };

      console.log('Envoi de requête token à Z-Credit:', JSON.stringify({
        url: `${this.config.apiUrl}/Transaction/CommitFullTransaction`,
        ...payload,
        Password: '******' // Masquer le mot de passe dans les logs
      }));

      // Effectuer la requête HTTP vers l'API Z-Credit
      const response = await axios.post(
        `${this.config.apiUrl}/Transaction/CommitFullTransaction`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        }
      );

      console.log('Réponse de Z-Credit (token):', JSON.stringify(response.data));

      // Vérifier la réponse
      if (response.data) {
        // Adapter la réponse pour compatibilité avec le code existant
        const result = response.data as ZCreditResponse;
        
        // S'assurer que IsApproved est défini pour compatibilité
        if (result.ReturnCode === 0 && !result.HasError) {
          result.IsApproved = true;
          result.ReturnValue = 0; // Pour compatibilité
        } else {
          result.IsApproved = false;
          result.ReturnValue = result.ReturnCode || -1; // Pour compatibilité
        }
        
        // Mapper CardNumberMask si besoin
        if (!result.CardNumberMask && result.CardNumber) {
          result.CardNumberMask = result.CardNumber;
        }
        
        return result;
      }

      throw new Error('Réponse Z-Credit invalide');
    } catch (error) {
      console.error('Erreur lors du traitement de paiement par token:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Détails de l\'erreur Z-Credit (token):', error.response.data);
        throw new Error(`Erreur Z-Credit: ${error.response.data?.ReturnMessage || error.message || 'Erreur inconnue'}`);
      }
      throw error;
    }
  }
}