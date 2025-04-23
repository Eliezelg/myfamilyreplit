import express from 'express';
import { subscriptionController } from '../controllers/subscription-controller';
import { isAdmin } from '../middleware/admin-auth';
import passport from 'passport';

export const subscriptionRouter = express.Router();

// Routes qui nécessitent des droits d'administration
subscriptionRouter.get('/', isAdmin, subscriptionController.getAllSubscriptions.bind(subscriptionController));

// Routes authentifiées
subscriptionRouter.get('/:id', passport.authenticate('session'), subscriptionController.getSubscriptionById.bind(subscriptionController));
subscriptionRouter.get('/family/:familyId', passport.authenticate('session'), subscriptionController.getSubscriptionByFamilyId.bind(subscriptionController));
subscriptionRouter.post('/', passport.authenticate('session'), subscriptionController.createSubscription.bind(subscriptionController));
subscriptionRouter.patch('/:id/cancel', passport.authenticate('session'), subscriptionController.cancelSubscription.bind(subscriptionController));
subscriptionRouter.get('/status/:familyId', passport.authenticate('session'), subscriptionController.checkSubscriptionStatus.bind(subscriptionController));