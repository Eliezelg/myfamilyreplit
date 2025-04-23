import { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { emailController } from '../controllers/email-controller';
import crypto from 'crypto';
import { verifyPassword, hashPassword } from '../auth';

/**
 * Enregistrement des routes pour la réinitialisation de mot de passe
 */
export function registerPasswordResetRoutes(app: Express) {
  // Route pour demander une réinitialisation de mot de passe
  app.post('/api/password-reset/request', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Adresse email requise' });
      }
      
      // Vérifier si l'utilisateur existe
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Pour des raisons de sécurité, ne pas divulguer si l'email existe ou non
        return res.status(200).json({ 
          message: 'Si votre email existe dans notre base de données, vous recevrez un lien de réinitialisation'
        });
      }
      
      // Générer un token de réinitialisation
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 heure de validité
      
      // Stocker le token et la date d'expiration dans la base de données
      await storage.updateUser(user.id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires
      });
      
      // Envoyer l'email de réinitialisation
      await emailController.sendPasswordResetEmail(user, resetToken);
      
      return res.status(200).json({ 
        message: 'Si votre email existe dans notre base de données, vous recevrez un lien de réinitialisation'
      });
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation de mot de passe:', error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  });
  
  // Route pour vérifier un token de réinitialisation
  app.get('/api/password-reset/verify/:token', async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: 'Token requis' });
      }
      
      // Chercher l'utilisateur avec ce token
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ message: 'Token invalide ou expiré' });
      }
      
      // Vérifier si le token n'a pas expiré
      if (!user.resetPasswordExpires || new Date(user.resetPasswordExpires) < new Date()) {
        return res.status(400).json({ message: 'Token expiré' });
      }
      
      return res.status(200).json({ valid: true });
    } catch (error) {
      console.error('Erreur lors de la vérification du token de réinitialisation:', error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  });
  
  // Route pour réinitialiser le mot de passe avec un token
  app.post('/api/password-reset/:token', async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { password, confirmPassword } = req.body;
      
      // Vérifier les données requises
      if (!token || !password) {
        return res.status(400).json({ message: 'Token et nouveau mot de passe requis' });
      }
      
      // Vérifier que les mots de passe correspondent
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
      }
      
      // Vérifier la complexité du mot de passe
      if (password.length < 8) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
      }
      
      // Vérifier au moins une lettre et un chiffre
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      if (!hasLetter || !hasNumber) {
        return res.status(400).json({ 
          message: 'Le mot de passe doit contenir au moins une lettre et un chiffre'
        });
      }
      
      // Chercher l'utilisateur avec ce token
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ message: 'Token invalide ou expiré' });
      }
      
      // Vérifier si le token n'a pas expiré
      if (!user.resetPasswordExpires || new Date(user.resetPasswordExpires) < new Date()) {
        return res.status(400).json({ message: 'Token expiré' });
      }
      
      // Hasher le nouveau mot de passe
      const hashedPassword = await hashPassword(password);
      
      // Mettre à jour le mot de passe et réinitialiser le token
      await storage.updateUser(user.id, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      });
      
      return res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  });
}