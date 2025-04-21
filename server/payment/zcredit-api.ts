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
  amount: number; // En centimes
  description: string;
  numOfPayments?: number;
  creditType?: number; // 1 pour transaction régulière, 8 pour paiement échelonné
  firstPaymentSum?: number;
  otherPaymentsSum?: number;
  uniqueId?: string;
}

// Type pour la réponse de Z-Credit
export interface ZCreditResponse {
  ReturnValue: number; // 0 pour succès
  ReferenceNumber?: string;
  Token?: string;
  ReturnMessage?: string;
  ErrorCode?: string;
  CompanyName?: string;
  CardBrand?: string;
  CardBrandCode?: number;
  CardNumber?: string;
  CardNumberMask?: string;
  CardExpiration?: string;
  CardHolderID?: string;
  CreditCardCompanyCode?: number;
  IsApproved?: boolean;
  IsTelApprovalNeeded?: boolean;
  TransactionSum?: number;
  TransactionID?: string;
  AuthNumber?: string;
  PaymentsNumber?: number;
  FirstPaymentSum?: number;
  OtherPaymentsSum?: number;
  // ... autres propriétés selon les besoins
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
      // Construction du payload selon la documentation Z-Credit
      const payload = {
        TerminalNumber: this.config.terminalNumber,
        Password: this.config.password,
        Track2: '',
        CardNumber: creditCard.cardNumber,
        ExpDate_MMYY: creditCard.expDate,
        CVV: creditCard.cvv || '',
        TransactionSum: transaction.amount,
        J: 1, // 1 pour transaction standard
        CreditType: transaction.creditType || 1,
        NumOfPayments: transaction.numOfPayments || 1,
        FirstPaymentSum: transaction.firstPaymentSum,
        OtherPaymentsSum: transaction.otherPaymentsSum,
        HolderID: creditCard.holderId || '',
        CellPhone: '',
        TransactionUniqueID: transaction.uniqueId || this.generateUniqueId(),
        ApprovalNumber: '',
        ParamX: transaction.description
      };

      // Effectuer la requête HTTP vers l'API Z-Credit
      const response = await axios.post(
        `${this.config.apiUrl}/Transaction/CommitFullTransaction`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Vérifier la réponse
      if (response.data) {
        return response.data as ZCreditResponse;
      }

      throw new Error('Réponse Z-Credit invalide');
    } catch (error) {
      console.error('Erreur lors du traitement de paiement Z-Credit:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Erreur Z-Credit: ${error.response.data?.ReturnMessage || 'Erreur inconnue'}`);
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
   * Crée un token pour la carte de crédit
   */
  async createCardToken(creditCard: CreditCardDetails): Promise<string> {
    try {
      // Construction du payload pour la tokenisation
      const payload = {
        TerminalNumber: this.config.terminalNumber,
        Password: this.config.password,
        Track2: '',
        CardNumber: creditCard.cardNumber,
        ExpDate_MMYY: creditCard.expDate,
        CVV: creditCard.cvv || '',
        TransactionSum: 0, // 0 pour juste créer un token
        J: 2, // 2 pour authentification uniquement
        HolderID: creditCard.holderId || '',
        TransactionUniqueID: this.generateUniqueId()
      };

      // Effectuer la requête HTTP vers l'API Z-Credit
      const response = await axios.post(
        `${this.config.apiUrl}/Transaction/CommitFullTransaction`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Vérifier la réponse
      if (response.data && response.data.Token) {
        return response.data.Token;
      }

      throw new Error('Impossible de créer un token pour la carte');
    } catch (error) {
      console.error('Erreur lors de la création du token:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Erreur Z-Credit: ${error.response.data?.ReturnMessage || 'Erreur inconnue'}`);
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
      // Construction du payload pour le paiement par token
      const payload = {
        TerminalNumber: this.config.terminalNumber,
        Password: this.config.password,
        CardNumber: token, // Utiliser le token au lieu du numéro de carte
        TransactionSum: transaction.amount,
        J: 1, // 1 pour transaction standard
        CreditType: transaction.creditType || 1,
        NumOfPayments: transaction.numOfPayments || 1,
        FirstPaymentSum: transaction.firstPaymentSum,
        OtherPaymentsSum: transaction.otherPaymentsSum,
        TransactionUniqueID: transaction.uniqueId || this.generateUniqueId(),
        ParamX: transaction.description
      };

      // Effectuer la requête HTTP vers l'API Z-Credit
      const response = await axios.post(
        `${this.config.apiUrl}/Transaction/CommitFullTransaction`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Vérifier la réponse
      if (response.data) {
        return response.data as ZCreditResponse;
      }

      throw new Error('Réponse Z-Credit invalide');
    } catch (error) {
      console.error('Erreur lors du traitement de paiement par token:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Erreur Z-Credit: ${error.response.data?.ReturnMessage || 'Erreur inconnue'}`);
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
  apiUrl: process.env.ZCREDIT_API_URL || 'https://secure.zcredit.co.il/WebService/SecurePayment.asmx'
}, false); // Mode simulation désactivé pour utiliser l'API réelle