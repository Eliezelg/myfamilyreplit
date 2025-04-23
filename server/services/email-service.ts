import { MailService } from '@sendgrid/mail';
import { User } from '@shared/schema';
import path from 'path';
import fs from 'fs';

// Initialiser le service SendGrid
const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY || '');

/**
 * Interface pour les paramètres d'email
 */
interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html: string;
}

/**
 * Informations sur la famille pour les modèles d'emails
 */
interface FamilyInfo {
  id: number;
  name: string;
  invitationToken?: string;
}

/**
 * Service de gestion des emails
 */
class EmailService {
  private fromEmail: string = 'info@atrehitim.co.il';
  private readonly APP_URL: string = process.env.APP_URL || 'https://myfamily.replit.app';
  
  /**
   * Envoie un email via SendGrid
   */
  async sendEmail(params: EmailParams): Promise<boolean> {
    try {
      // Préparation des données d'email selon les attentes de SendGrid
      const emailData: {
        to: string;
        from: string;
        subject: string;
        html: string;
        text?: string;
      } = {
        to: params.to,
        from: params.from || this.fromEmail,
        subject: params.subject,
        html: params.html
      };
      
      // Ajouter le texte brut si disponible
      if (params.text) {
        emailData.text = params.text;
      }
      
      // Envoi de l'email
      await mailService.send(emailData);
      console.log(`Email envoyé à ${params.to} depuis ${emailData.from}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return false;
    }
  }

  /**
   * Envoie un email de bienvenue à un nouvel utilisateur
   */
  async sendWelcomeEmail(user: User): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a6ee0;">Bienvenue sur MyFamily!</h1>
        <p>Bonjour ${user.fullName || user.displayName || user.username},</p>
        <p>Nous sommes ravis de vous accueillir sur MyFamily, la plateforme qui rapproche les familles.</p>
        <p>Avec MyFamily, vous pouvez:</p>
        <ul>
          <li>Créer et rejoindre des espaces familiaux</li>
          <li>Partager des photos et des souvenirs</li>
          <li>Organiser des événements familiaux</li>
          <li>Gérer un fonds familial pour les projets communs</li>
          <li>Créer des gazettes mensuelles automatiques</li>
        </ul>
        <p>Pour commencer, <a href="${this.APP_URL}/dashboard">connectez-vous à votre tableau de bord</a> et créez votre première famille ou rejoignez-en une avec un code d'invitation.</p>
        <p>Merci de nous avoir rejoints!</p>
        <p>L'équipe MyFamily</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      from: this.fromEmail,
      subject: 'Bienvenue sur MyFamily!',
      html,
    });
  }

  /**
   * Envoie un email pour la récupération de mot de passe
   */
  async sendPasswordResetEmail(user: User, resetToken: string): Promise<boolean> {
    const resetLink = `${this.APP_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a6ee0;">Réinitialisation de mot de passe</h1>
        <p>Bonjour ${user.fullName || user.displayName || user.username},</p>
        <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte MyFamily.</p>
        <p>Pour réinitialiser votre mot de passe, veuillez cliquer sur le lien ci-dessous:</p>
        <p style="margin: 20px 0;">
          <a href="${resetLink}" style="background-color: #4a6ee0; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Réinitialiser mon mot de passe</a>
        </p>
        <p>Ce lien expirera dans 24 heures.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
        <p>L'équipe MyFamily</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      from: this.fromEmail,
      subject: 'Réinitialisation de votre mot de passe MyFamily',
      html,
    });
  }

  /**
   * Envoie un email de confirmation pour la création d'une famille
   */
  async sendFamilyCreationConfirmation(user: User, family: FamilyInfo): Promise<boolean> {
    const familyLink = `${this.APP_URL}/families/${family.id}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a6ee0;">Votre famille a été créée!</h1>
        <p>Bonjour ${user.fullName || user.displayName || user.username},</p>
        <p>Félicitations! Vous venez de créer la famille <strong>${family.name}</strong> sur MyFamily.</p>
        <p>En tant qu'administrateur, vous pouvez:</p>
        <ul>
          <li>Inviter de nouveaux membres à rejoindre votre famille</li>
          <li>Gérer les paramètres de la famille</li>
          <li>Créer et gérer le fonds familial</li>
          <li>Générer des gazettes mensuelles</li>
        </ul>
        <p>Pour accéder à votre espace familial, cliquez ci-dessous:</p>
        <p style="margin: 20px 0;">
          <a href="${familyLink}" style="background-color: #4a6ee0; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Accéder à ma famille</a>
        </p>
        <p>Nous vous souhaitons de beaux moments en famille!</p>
        <p>L'équipe MyFamily</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      from: this.fromEmail,
      subject: `Votre famille "${family.name}" a été créée!`,
      html,
    });
  }

  /**
   * Envoie un email de confirmation quand un utilisateur rejoint une famille
   */
  async sendFamilyJoinConfirmation(user: User, family: FamilyInfo): Promise<boolean> {
    const familyLink = `${this.APP_URL}/families/${family.id}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a6ee0;">Bienvenue dans votre nouvelle famille!</h1>
        <p>Bonjour ${user.fullName || user.displayName || user.username},</p>
        <p>Vous venez de rejoindre la famille <strong>${family.name}</strong> sur MyFamily.</p>
        <p>Vous pouvez maintenant:</p>
        <ul>
          <li>Partager des photos avec les membres de votre famille</li>
          <li>Participer aux événements familiaux</li>
          <li>Contribuer à la gazette mensuelle</li>
          <li>Participer au fonds familial</li>
        </ul>
        <p>Pour accéder à votre espace familial, cliquez ci-dessous:</p>
        <p style="margin: 20px 0;">
          <a href="${familyLink}" style="background-color: #4a6ee0; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Accéder à ma famille</a>
        </p>
        <p>Nous vous souhaitons de beaux moments en famille!</p>
        <p>L'équipe MyFamily</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      from: this.fromEmail,
      subject: `Bienvenue dans la famille "${family.name}"!`,
      html,
    });
  }

  /**
   * Envoie un email de rappel pour la gazette si pas assez de photos
   */
  async sendGazetteReminderEmail(user: User, familyName: string, familyId: number, photosCount: number, photoTarget: number, closingDate: Date): Promise<boolean> {
    const familyLink = `${this.APP_URL}/families/${familyId}/photos`;
    const formattedDate = closingDate.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a6ee0;">Rappel: Gazette familiale</h1>
        <p>Bonjour ${user.fullName || user.displayName || user.username},</p>
        <p>La gazette de la famille <strong>${familyName}</strong> sera générée le <strong>${formattedDate}</strong>, dans 2 jours.</p>
        <p>Actuellement, il y a <strong>${photosCount} photos</strong> partagées pour ce mois-ci, alors que l'objectif est de <strong>${photoTarget} photos</strong>.</p>
        <p>C'est le moment de partager quelques souvenirs supplémentaires pour enrichir votre gazette familiale!</p>
        <p style="margin: 20px 0;">
          <a href="${familyLink}" style="background-color: #4a6ee0; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Ajouter des photos</a>
        </p>
        <p>Merci de contribuer à la mémoire familiale!</p>
        <p>L'équipe MyFamily</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      from: this.fromEmail,
      subject: `Rappel: La gazette familiale sera générée dans 2 jours`,
      html,
    });
  }

  /**
   * Envoie un email d'invitation à rejoindre une famille
   */
  async sendFamilyInvitationEmail(email: string, inviterName: string, family: FamilyInfo): Promise<boolean> {
    const invitationLink = `${this.APP_URL}/invitation/${family.invitationToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4a6ee0;">Invitation à rejoindre une famille</h1>
        <p>Bonjour,</p>
        <p><strong>${inviterName}</strong> vous invite à rejoindre la famille <strong>${family.name}</strong> sur MyFamily.</p>
        <p>MyFamily est une plateforme qui permet aux familles de rester connectées en partageant des photos, en planifiant des événements et en créant des gazettes mensuelles automatiques.</p>
        <p>Pour accepter cette invitation, cliquez sur le bouton ci-dessous:</p>
        <p style="margin: 20px 0;">
          <a href="${invitationLink}" style="background-color: #4a6ee0; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Rejoindre la famille</a>
        </p>
        <p>Si vous n'avez pas de compte MyFamily, vous pourrez en créer un lors de l'acceptation de l'invitation.</p>
        <p>Cette invitation expirera dans 7 jours.</p>
        <p>L'équipe MyFamily</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      from: this.fromEmail,
      subject: `${inviterName} vous invite à rejoindre la famille "${family.name}" sur MyFamily`,
      html,
    });
  }
}

export const emailService = new EmailService();