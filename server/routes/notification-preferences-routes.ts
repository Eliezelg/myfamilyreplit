import { Router } from 'express';
import { getUserNotificationPreferences, updateUserNotificationPreferences } from '../controllers/notification-preferences-controller';
import { requireAuth } from '../middleware/auth-middleware';

const router = Router();

// Routes pour les préférences de notification (nécessitent une authentification)
router.get('/', requireAuth, getUserNotificationPreferences);
router.put('/', requireAuth, updateUserNotificationPreferences);

export default router;
