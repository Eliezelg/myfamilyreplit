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

  constructor(config: ZCreditConfig) {
    this.config = config;
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
        J: "0", // Transaction standard
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
  async createCardToken(creditCard: CreditCardDetails): Promise<string> {
    try {
      // Construction du payload pour la tokenisation
      const payload: Record<string, any> = {
        TerminalNumber: this.config.terminalNumber,
        Password: this.config.password,
        CardNumber: creditCard.cardNumber,
        ExpDate_MMYY: this.formatExpDate(creditCard.expDate),
        CVV: creditCard.cvv || '',
        TransactionSum: 0, // 0 pour juste créer un token
        J: 2, // 2 pour authentification uniquement
        TransactionUniqueID: this.generateUniqueId()
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
          return tokenMatch[1];
        }
      }
      
      // Gestion des réponses JSON
      if (typeof response.data === 'object' && response.data.Token) {
        console.log('Token extrait de JSON:', response.data.Token);
        return response.data.Token;
      }

      // Si une réponse IntOt_JSON contient un token
      if (response.data.IntOt_JSON) {
        try {
          const intOtData = JSON.parse(response.data.IntOt_JSON);
          if (intOtData && intOtData.Token) {
            console.log('Token extrait de IntOt_JSON:', intOtData.Token);
            return intOtData.Token;
          }
        } catch (e) {
          console.error('Erreur lors du parsing de IntOt_JSON:', e);
        }
      }

      console.error('Aucun token trouvé dans la réponse Z-Credit:', response.data);
      throw new Error('Impossible de créer un token pour la carte');
    } catch (error) {
      console.error('Erreur lors de la création du token:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Détails de l\'erreur Z-Credit:', JSON.stringify(error.response.data));
        throw new Error(`Erreur Z-Credit: ${error.response.data?.ReturnMessage || 'Erreur inconnue'}`);
      } else if (axios.isAxiosError(error)) {
        console.error('Erreur de connexion Z-Credit:', error.message);
        throw new Error(`Erreur de connexion à Z-Credit: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Effectue un paiement avec un token
   */
  async processTokenPayment(
    token: string,
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
      
      // Construction du payload pour le paiement par token selon la documentation Z-Credit
      const payload: Record<string, string> = {
        TerminalNumber: this.config.terminalNumber,
        Password: this.config.password,
        CardNumber: token, // Utiliser le token au lieu du numéro de carte
        TransactionSum: transactionSum,
        NumberOfPayments: transaction.numOfPayments ? transaction.numOfPayments.toString() : "1",
        CreditType: transaction.creditType ? transaction.creditType.toString() : "1",
        CurrencyType: "1", // ILS (shekels)
        TransactionType: "01", // Transaction standard
        J: "0", // Transaction standard
        ItemDescription: transaction.description || "Paiement MyFamily",
        TransactionUniqueID: transaction.uniqueId || this.generateUniqueId()
      };
      
      // Ajouter les paramètres conditionnels uniquement lorsqu'ils sont nécessaires
      if (transaction.numOfPayments && transaction.numOfPayments > 1) {
        (payload as Record<string, string>)["FirstPaymentSum"] = firstPaymentSum || "0";
        (payload as Record<string, string>)["OtherPaymentsSum"] = otherPaymentsSum || "0";
      }

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

/**
 * Classe pour simuler l'API Z-Credit (utile pour les tests)
 */
export class ZCreditSimulationAPI extends ZCreditAPI {
  private simulationMode: boolean = true;

  constructor(config: ZCreditConfig, simulationMode: boolean = true) {
    super(config);
    this.simulationMode = simulationMode;
    if (this.simulationMode) {
      console.log('Z-Credit API en mode simulation');
    }
  }

  /**
   * Simule un traitement de paiement
   */
  async processPayment(
    creditCard: CreditCardDetails,
    transaction: TransactionDetails
  ): Promise<ZCreditResponse> {
    if (!this.simulationMode) {
      return super.processPayment(creditCard, transaction);
    }

    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simuler une réponse
    return this.simulateResponse(creditCard, transaction);
  }

  /**
   * Simule la création d'un token
   */
  async createCardToken(creditCard: CreditCardDetails): Promise<string> {
    if (!this.simulationMode) {
      return super.createCardToken(creditCard);
    }

    // Simuler un délai
    await new Promise(resolve => setTimeout(resolve, 300));

    // Générer un token simulé
    const randomToken = `SIM-TOKEN-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
    return randomToken;
  }

  /**
   * Simule un paiement avec token
   */
  async processTokenPayment(
    token: string,
    transaction: TransactionDetails
  ): Promise<ZCreditResponse> {
    if (!this.simulationMode) {
      return super.processTokenPayment(token, transaction);
    }

    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simuler une réponse
    const dummyCard: CreditCardDetails = {
      cardNumber: '4111111111111111',
      expDate: '1225'
    };

    return this.simulateResponse(dummyCard, transaction);
  }

  /**
   * Simule une réponse de l'API
   */
  private simulateResponse(
    creditCard: CreditCardDetails,
    transaction: TransactionDetails
  ): ZCreditResponse {
    // Numéros de carte qui déclenchent des erreurs spécifiques pour les tests
    const errorCards: Record<string, string> = {
      '4111111111111112': 'כרטיס האשראי לא תקין', // Carte invalide
      '4111111111111113': 'עסקה לא אושרה', // Transaction non approuvée
      '4111111111111114': 'תוקף הכרטיס פג', // Carte expirée
      '4111111111111115': 'סכום העסקה חורג מהמותר' // Montant trop élevé
    };

    // Simuler une erreur si la carte est dans notre liste d'erreurs
    const lastFourDigits = creditCard.cardNumber.slice(-4);
    if (lastFourDigits in errorCards) {
      return {
        ReturnValue: 800,
        IsApproved: false,
        ReturnMessage: errorCards[lastFourDigits]
      };
    }

    // Pour les transactions de plus de 10000 agorot, simuler une erreur de montant
    if (transaction.amount > 10000) {
      return {
        ReturnValue: 801,
        IsApproved: false,
        ReturnMessage: 'סכום העסקה חורג מהמותר'
      };
    }

    // Sinon, simuler une réponse réussie
    return {
      ReturnValue: 0,
      ReferenceNumber: `SIM-${Date.now()}`,
      Token: `TOK-${Math.random().toString(36).substring(2, 10)}`,
      ReturnMessage: 'עסקה אושרה',
      IsApproved: true,
      TransactionSum: transaction.amount,
      TransactionID: `TID-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      AuthNumber: `AUTH-${Math.floor(Math.random() * 100000)}`,
      CardBrand: 'Visa',
      CardBrandCode: 1,
      CardNumber: creditCard.cardNumber,
      CardNumberMask: this.maskCardNumber(creditCard.cardNumber),
      PaymentsNumber: transaction.numOfPayments || 1
    };
  }

  /**
   * Masque un numéro de carte
   */
  private maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 8) return cardNumber;
    const firstDigits = cardNumber.slice(0, 4);
    const lastDigits = cardNumber.slice(-4);
    return `${firstDigits}${'X'.repeat(cardNumber.length - 8)}${lastDigits}`;
  }
}

// Singleton pour l'API Z-Credit
export const zcreditAPI = new ZCreditSimulationAPI({
  terminalNumber: process.env.ZCREDIT_TERMINAL_NUMBER || '',
  password: process.env.ZCREDIT_PASSWORD || '',
  apiUrl: process.env.ZCREDIT_API_URL || 'https://pci.zcredit.co.il/ZCreditWS/api'
}, process.env.NODE_ENV === 'development'); // Mode simulation en développement