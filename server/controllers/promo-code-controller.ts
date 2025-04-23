import { Request, Response } from 'express';
import { promoCodeService } from '../services/promo-code-service';
import { insertPromoCodeSchema } from '@shared/schema';
import { z } from 'zod';

export class PromoCodeController {
  /**
   * Récupérer la liste des codes promo
   */
  async getAllPromoCodes(req: Request, res: Response) {
    try {
      const promoCodes = await promoCodeService.getAllPromoCodes();
      return res.status(200).json(promoCodes);
    } catch (error) {
      console.error('Erreur lors de la récupération des codes promo:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération des codes promo' });
    }
  }

  /**
   * Récupérer un code promo par son ID
   */
  async getPromoCodeById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID de code promo invalide' });
      }

      const promoCode = await promoCodeService.getPromoCodeById(id);
      if (!promoCode) {
        return res.status(404).json({ message: 'Code promo non trouvé' });
      }

      return res.status(200).json(promoCode);
    } catch (error) {
      console.error('Erreur lors de la récupération du code promo:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération du code promo' });
    }
  }

  /**
   * Créer un nouveau code promo
   */
  async createPromoCode(req: Request, res: Response) {
    try {
      // Validation des données
      const promoData = insertPromoCodeSchema.parse(req.body);

      // Si l'administrateur est connecté, l'affecter au code
      if (req.user?.id && req.user?.role === 'admin') {
        promoData.createdBy = req.user.id;
      }

      // Création du code
      const newPromoCode = await promoCodeService.createPromoCode(promoData);
      return res.status(201).json(newPromoCode);
    } catch (error) {
      console.error('Erreur lors de la création du code promo:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Données de code promo invalides', errors: error.errors });
      }
      return res.status(500).json({ message: 'Erreur lors de la création du code promo' });
    }
  }

  /**
   * Mettre à jour un code promo existant
   */
  async updatePromoCode(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID de code promo invalide' });
      }

      // Vérifier si le code existe
      const existingCode = await promoCodeService.getPromoCodeById(id);
      if (!existingCode) {
        return res.status(404).json({ message: 'Code promo non trouvé' });
      }

      // Mise à jour du code
      const updatedCode = await promoCodeService.updatePromoCode(id, req.body);
      return res.status(200).json(updatedCode);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du code promo:', error);
      return res.status(500).json({ message: 'Erreur lors de la mise à jour du code promo' });
    }
  }

  /**
   * Activer/désactiver un code promo
   */
  async togglePromoCodeStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID de code promo invalide' });
      }

      // Vérifier si le code existe
      const existingCode = await promoCodeService.getPromoCodeById(id);
      if (!existingCode) {
        return res.status(404).json({ message: 'Code promo non trouvé' });
      }

      // Basculer le statut
      let updatedCode;
      if (existingCode.isActive) {
        updatedCode = await promoCodeService.deactivatePromoCode(id);
      } else {
        updatedCode = await promoCodeService.activatePromoCode(id);
      }

      return res.status(200).json(updatedCode);
    } catch (error) {
      console.error('Erreur lors de la modification du statut du code promo:', error);
      return res.status(500).json({ message: 'Erreur lors de la modification du statut du code promo' });
    }
  }

  /**
   * Supprimer un code promo
   */
  async deletePromoCode(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID de code promo invalide' });
      }

      // Vérifier si le code existe
      const existingCode = await promoCodeService.getPromoCodeById(id);
      if (!existingCode) {
        return res.status(404).json({ message: 'Code promo non trouvé' });
      }

      // Suppression du code
      await promoCodeService.deletePromoCode(id);
      return res.status(200).json({ message: 'Code promo supprimé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression du code promo:', error);
      return res.status(500).json({ message: 'Erreur lors de la suppression du code promo' });
    }
  }

  /**
   * Valider un code promo (méthode publique)
   */
  async validatePromoCode(req: Request, res: Response) {
    try {
      const { code, originalPrice } = req.body;

      if (!code) {
        return res.status(400).json({ message: 'Code promo manquant' });
      }

      // Calcul du prix avec réduction
      const price = originalPrice ? parseFloat(originalPrice) : 12000; // Prix par défaut: 120 shekels (en aggorot)
      const result = await promoCodeService.calculateDiscountedPrice(code, price);

      if (!result.promoCode) {
        return res.status(404).json({ 
          message: 'Code promo invalide ou expiré',
          originalPrice: price,
          finalPrice: price 
        });
      }

      return res.status(200).json({
        message: 'Code promo valide',
        originalPrice: price,
        finalPrice: result.finalPrice,
        discount: price - result.finalPrice,
        promoCode: {
          id: result.promoCode.id,
          code: result.promoCode.code,
          type: result.promoCode.type,
          description: result.promoCode.description
        }
      });
    } catch (error) {
      console.error('Erreur lors de la validation du code promo:', error);
      return res.status(500).json({ message: 'Erreur lors de la validation du code promo' });
    }
  }
}

export const promoCodeController = new PromoCodeController();