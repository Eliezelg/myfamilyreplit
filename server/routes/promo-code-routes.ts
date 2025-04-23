import express from 'express';
import { promoCodeController } from '../controllers/promo-code-controller';
import { isAdmin } from '../middleware/admin-auth';

export const promoCodeRouter = express.Router();

// Routes qui nécessitent des droits d'administration
promoCodeRouter.get('/', isAdmin, promoCodeController.getAllPromoCodes.bind(promoCodeController));
promoCodeRouter.get('/:id', isAdmin, promoCodeController.getPromoCodeById.bind(promoCodeController));
promoCodeRouter.post('/', isAdmin, promoCodeController.createPromoCode.bind(promoCodeController));
promoCodeRouter.put('/:id', isAdmin, promoCodeController.updatePromoCode.bind(promoCodeController));
promoCodeRouter.patch('/:id/toggle', isAdmin, promoCodeController.togglePromoCodeStatus.bind(promoCodeController));
promoCodeRouter.delete('/:id', isAdmin, promoCodeController.deletePromoCode.bind(promoCodeController));

// Route publique pour valider un code promo
promoCodeRouter.post('/validate', promoCodeController.validatePromoCode.bind(promoCodeController));