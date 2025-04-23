import { Request, Response, NextFunction } from 'express';
import { emailService } from '../services/email-service';
import { User, Family, Invitation } from '@shared/schema';
import { storage } from '../storage';

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
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4a6ee0;">Test d'email MyFamily</h1>
          <p>Ceci est un email de test de la plateforme MyFamily.</p>
          <p>Si vous recevez cet email, cela signifie que la configuration de l'envoi d'emails fonctionne correctement.</p>
          <p>L'équipe MyFamily</p>
        </div>
      `;
      
      const result = await emailService.sendEmail({
        to: email,
        subject: 'Test d\'email MyFamily',
        html
      });
      
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
      await emailService.sendWelcomeEmail(user);
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
      await emailService.sendPasswordResetEmail(user, resetToken);
      console.log(`Email de récupération de mot de passe envoyé à ${user.email}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de récupération de mot de passe:', error);
      return false;
    }
  }

  /**
   * Envoie un email de confirmation pour la création d'une famille
   */
  async sendFamilyCreationConfirmation(user: User, family: Family) {
    try {
      await emailService.sendFamilyCreationConfirmation(user, {
        id: family.id,
        name: family.name
      });
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
      await emailService.sendFamilyJoinConfirmation(user, {
        id: family.id,
        name: family.name
      });
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
      await emailService.sendFamilyInvitationEmail(email, inviterName, {
        id: invitation.familyId,
        name: familyName,
        invitationToken: invitation.token
      });
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
      
      // Date de clôture (dans 2 jours)
      const closingDate = new Date();
      closingDate.setDate(closingDate.getDate() + 2);
      
      // Envoyer un email à chaque membre de la famille
      for (const member of familyMembers) {
        if (member.user) {
          await emailService.sendGazetteReminderEmail(
            member.user, 
            family.name, 
            familyId, 
            photosCount,
            photoTarget,
            closingDate
          );
          console.log(`Email de rappel pour la gazette envoyé à ${member.user.email}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi des emails de rappel pour la gazette:', error);
      return false;
    }
  }
}

export const emailController = new EmailController();