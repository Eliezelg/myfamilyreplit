import { Request, Response, NextFunction } from 'express';
import { emailService } from '../services/email-service';
import { User, Family, Invitation } from '@shared/schema';
import { storage } from '../storage';
import '@shared/schema'; // Pour s'assurer que les types sont bien importés

/**
 * Contrôleur pour les fonctionnalités liées aux emails
 */
export class EmailController {
  
  /**
   * Envoie un email de test pour vérifier la configuration
   */
  async sendTestEmail(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Adresse email requise' });
      }
      
      const result = await emailService.sendTestEmail(email);
      
      if (result) {
        return res.status(200).json({ message: 'Email de test envoyé avec succès' });
      } else {
        return res.status(500).json({ message: 'Échec de l\'envoi de l\'email de test' });
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de test:', error);
      return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email de test' });
    }
  }

  /**
   * Envoie un email de bienvenue à un nouvel utilisateur
   */
  async sendWelcomeEmail(user: User) {
    try {
      const displayName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username;
      
      await emailService.sendWelcomeEmail(user.email, displayName);
      console.log(`Email de bienvenue envoyé à ${user.email}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
      return false;
    }
  }

  /**
   * Envoie un email de récupération de mot de passe
   */
  async sendPasswordResetEmail(user: User, resetToken: string) {
    try {
      console.log(`Début de la procédure d'envoi d'email de récupération pour ${user.email}`);
      console.log(`Longueur du token de récupération: ${resetToken.length} caractères`);
      
      // Test direct avec SendGrid pour comparer
      console.log('Tentative d\'envoi d\'email via SendGrid directement...');
      
      // Utilisation du service standard
      const result = await emailService.sendPasswordResetEmail(user.email, resetToken);
      
      console.log(`Résultat de l'envoi d'email de récupération à ${user.email}: ${result ? 'Succès' : 'Échec'}`);
      
      // Si l'email n'a pas été envoyé, essayons de diagnostiquer pourquoi
      if (!result) {
        console.log('Échec de l\'envoi d\'email. Problèmes possibles:');
        console.log('- Domaine d\'expéditeur non vérifié sur SendGrid');
        console.log('- Erreur de configuration dans le template d\'email');
        console.log('- Problème de connexion réseau avec l\'API SendGrid');
      }
      
      return result;
    } catch (error) {
      console.error('Erreur non gérée lors de l\'envoi de l\'email de récupération de mot de passe:');
      console.error(error);
      return false;
    }
  }

  /**
   * Envoie un email de confirmation pour la création d'une famille
   */
  async sendFamilyCreationConfirmation(user: User, family: Family) {
    try {
      const displayName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username;
      
      await emailService.sendFamilyCreationConfirmation(
        user.email, 
        displayName, 
        family.name
      );
      console.log(`Email de confirmation de création de famille envoyé à ${user.email}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation de création de famille:', error);
      return false;
    }
  }

  /**
   * Envoie un email de confirmation quand un utilisateur rejoint une famille
   */
  async sendFamilyJoinConfirmation(user: User, family: Family) {
    try {
      const displayName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username;
      
      await emailService.sendFamilyJoinConfirmation(
        user.email, 
        displayName, 
        family.name
      );
      console.log(`Email de confirmation de rejoindre une famille envoyé à ${user.email}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation de rejoindre une famille:', error);
      return false;
    }
  }

  /**
   * Envoie un email d'invitation à rejoindre une famille
   */
  async sendFamilyInvitation(email: string, inviterName: string, invitation: Invitation, familyName: string) {
    try {
      await emailService.sendFamilyInvitation(
        email, 
        inviterName, 
        invitation.token, 
        familyName
      );
      console.log(`Email d'invitation à rejoindre une famille envoyé à ${email}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email d\'invitation à rejoindre une famille:', error);
      return false;
    }
  }

  /**
   * Envoie un email de rappel pour la gazette si pas assez de photos
   */
  async sendGazetteReminder(familyId: number, photosCount: number, photoTarget: number = 10) {
    try {
      // Récupérer les informations de la famille
      const family = await storage.getFamily(familyId);
      if (!family) {
        console.error(`Famille non trouvée (ID: ${familyId})`);
        return false;
      }

      // Récupérer les membres de la famille
      const familyMembers = await storage.getFamilyMembers(familyId);
      
      // Envoyer un email à chaque membre de la famille
      let successCount = 0;
      for (const member of familyMembers) {
        if (member.user && member.user.email) {
          await emailService.sendGazetteReminder(
            member.user.email, 
            family.name, 
            photosCount, 
            photoTarget
          );
          console.log(`Email de rappel pour la gazette envoyé à ${member.user.email}`);
          successCount++;
        }
      }
      
      return successCount > 0;
    } catch (error) {
      console.error('Erreur lors de l\'envoi des emails de rappel pour la gazette:', error);
      return false;
    }
  }
}

export const emailController = new EmailController();