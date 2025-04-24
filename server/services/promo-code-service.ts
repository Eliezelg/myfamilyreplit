import { db } from '../db';
import { InsertPromoCode, PromoCode, insertPromoCodeSchema, promoCodes, subscriptions } from '@shared/schema';
import { eq, and, isNull, count } from 'drizzle-orm';

export class PromoCodeService {
  /**
   * Récupère tous les codes promotionnels
   */
  async getAllPromoCodes(): Promise<PromoCode[]> {
    return await db.query.promoCodes.findMany({
      with: {
        creator: true,
        subscriptions: true
      },
      orderBy: (promoCodes, { desc }) => [desc(promoCodes.createdAt)]
    });
  }

  /**
   * Récupère un code promotionnel par son ID
   */
  async getPromoCodeById(id: number): Promise<PromoCode | undefined> {
    const result = await db.query.promoCodes.findFirst({
      where: eq(promoCodes.id, id),
      with: {
        creator: true,
        subscriptions: true
      }
    });
    return result || undefined;
  }

  /**
   * Récupère un code promotionnel par sa valeur
   */
  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    const result = await db.query.promoCodes.findFirst({
      where: eq(promoCodes.code, code),
      with: {
        creator: true
      }
    });
    return result || undefined;
  }

  /**
   * Crée un nouveau code promotionnel
   */
  async createPromoCode(data: InsertPromoCode): Promise<PromoCode> {
    console.log('Données reçues pour création de code promo:', JSON.stringify(data));

    // Traiter les dates correctement
    const processedData = {
      ...data,
      // S'assurer que startDate est une date valide
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      // Traiter endDate correctement (null, undefined ou date valide)
      endDate: data.endDate && typeof data.endDate === 'string' && data.endDate !== 'null' ? new Date(data.endDate) : null
    };
    
    console.log('Données traitées pour création de code promo:', JSON.stringify(processedData));
    
    // Valider les données
    const validatedData = insertPromoCodeSchema.parse(processedData);
    
    // Insérer dans la base de données
    const [insertedCode] = await db
      .insert(promoCodes)
      .values(validatedData)
      .returning();
      
    return insertedCode;
  }

  /**
   * Met à jour un code promotionnel
   */
  async updatePromoCode(id: number, data: Partial<PromoCode>): Promise<PromoCode | undefined> {
    // Vérifier si le code existe
    const existingCode = await this.getPromoCodeById(id);
    if (!existingCode) {
      return undefined;
    }
    
    console.log('Données reçues pour mise à jour de code promo:', JSON.stringify(data));

    // Traiter les dates correctement
    const processedData = {
      ...data,
      // S'assurer que startDate est une date valide si elle est fournie
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      // Traiter endDate correctement (null, undefined ou date valide)
      endDate: data.endDate === undefined ? undefined : 
              (data.endDate === null || (typeof data.endDate === 'string' && data.endDate === 'null') ? null : new Date(data.endDate))
    };
    
    console.log('Données traitées pour mise à jour de code promo:', JSON.stringify(processedData));

    // Mettre à jour le code promo
    const [updatedCode] = await db
      .update(promoCodes)
      .set(processedData)
      .where(eq(promoCodes.id, id))
      .returning();
      
    return updatedCode;
  }

  /**
   * Désactive un code promotionnel
   */
  async deactivatePromoCode(id: number): Promise<PromoCode | undefined> {
    return await this.updatePromoCode(id, { isActive: false });
  }

  /**
   * Réactive un code promotionnel
   */
  async activatePromoCode(id: number): Promise<PromoCode | undefined> {
    return await this.updatePromoCode(id, { isActive: true });
  }

  /**
   * Supprime un code promotionnel (opération administrative)
   */
  async deletePromoCode(id: number): Promise<boolean> {
    // Vérifier s'il a des abonnements associés
    const subsCount = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.promoCodeId, id));
      
    if (subsCount[0].count > 0) {
      // Si le code est utilisé, on ne le supprime pas physiquement
      await this.deactivatePromoCode(id);
      return true;
    }
    
    // Sinon, on peut le supprimer
    await db
      .delete(promoCodes)
      .where(eq(promoCodes.id, id));
      
    return true;
  }

  /**
   * Valide un code promo et incrémente son nombre d'utilisations
   * @returns Le code promo s'il est valide, sinon undefined
   */
  async validateAndUsePromoCode(code: string): Promise<PromoCode | undefined> {
    // Récupérer le code
    const promoCode = await this.getPromoCodeByCode(code);
    
    // Vérifier si le code existe et est actif
    if (!promoCode || !promoCode.isActive) {
      return undefined;
    }
    
    // Vérifier si le code n'a pas atteint son maximum d'utilisations
    if (promoCode.maxUses && promoCode.usesCount >= promoCode.maxUses) {
      return undefined;
    }
    
    // Vérifier si le code n'a pas expiré
    if (promoCode.endDate && new Date(promoCode.endDate) < new Date()) {
      return undefined;
    }
    
    // Incrémenter le nombre d'utilisations
    const [updatedCode] = await db
      .update(promoCodes)
      .set({ usesCount: promoCode.usesCount + 1 })
      .where(eq(promoCodes.id, promoCode.id))
      .returning();
      
    return updatedCode;
  }

  /**
   * Calcule le prix après application du code promo
   */
  async calculateDiscountedPrice(code: string, originalPrice: number): Promise<{ 
    finalPrice: number, 
    promoCode?: PromoCode 
  }> {
    // Valider et utiliser le code
    const promoCode = await this.validateAndUsePromoCode(code);
    
    if (!promoCode) {
      return { finalPrice: originalPrice };
    }
    
    let finalPrice = originalPrice;
    
    // Appliquer la réduction selon le type
    switch (promoCode.type) {
      case 'lifetime':
        // Prix fixe de 50 shekels pour abonnement à vie
        finalPrice = 5000; // 50 shekels en aggorot (centimes)
        break;
      case 'percentage':
        // Réduction en pourcentage
        const percentage = parseFloat(promoCode.discount.toString());
        finalPrice = originalPrice - (originalPrice * percentage / 100);
        break;
      case 'fixed':
        // Réduction d'un montant fixe
        const discount = parseFloat(promoCode.discount.toString()) * 100; // Convertir en aggorot
        finalPrice = Math.max(0, originalPrice - discount);
        break;
    }
    
    return {
      finalPrice,
      promoCode
    };
  }
}

export const promoCodeService = new PromoCodeService();