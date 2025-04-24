import { MailService } from '@sendgrid/mail';

// Type pour les paramètres d'email
interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Service pour gérer l'envoi d'emails via SendGrid
 */
export class EmailService {
  private mailService: MailService;
  private fromEmail: string = 'info@atrehitim.co.il';
  
  constructor() {
    // Vérifier que la clé API est définie
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY non définie. L\'envoi d\'emails ne fonctionnera pas.');
    } else {
      console.log('SENDGRID_API_KEY est définie. Longueur de la clé:', process.env.SENDGRID_API_KEY.length);
    }
    
    this.mailService = new MailService();
    
    // Initialiser SendGrid avec la clé API
    if (process.env.SENDGRID_API_KEY) {
      try {
        this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
        console.log('Service d\'email initialisé avec succès.');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du service d\'email:', error);
      }
    }
  }
  
  /**
   * Envoie un email avec les paramètres spécifiés
   */
  async sendEmail(params: EmailParams): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('Tentative d\'envoi d\'email sans clé API SendGrid');
      return false;
    }
    
    console.log(`Préparation de l'envoi d'email à ${params.to} avec sujet: "${params.subject}"`);
    
    try {
      const emailData = {
        to: params.to,
        from: this.fromEmail,
        subject: params.subject,
        text: params.text || '',
        html: params.html || '',
      };
      
      console.log(`Email préparé pour ${params.to}, envoi en cours...`);
      console.log(`Adresse d'expédition: ${this.fromEmail}`);
      
      await this.mailService.send(emailData);
      
      console.log(`Email envoyé avec succès à ${params.to}`);
      return true;
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de l\'email:', error.message);
      console.error('Type d\'erreur:', typeof error);
      console.error('Stack trace:', error.stack);
      
      if (error.response) {
        console.error('Détails de l\'erreur SendGrid:', error.response.body);
      }
      return false;
    }
  }
  
  /**
   * Envoie un email de test
   */
  async sendTestEmail(to: string): Promise<boolean> {
    const textContent = 'Ceci est un email de test depuis la plateforme MyFamily.';
    const htmlContent = '<h1>Test d\'email MyFamily</h1><p>Ceci est un email de test depuis la plateforme MyFamily.</p>';
    
    return this.sendEmail({
      to,
      subject: 'Test d\'email MyFamily',
      text: textContent,
      html: htmlContent
    });
  }
  
  /**
   * Envoie un email de bienvenue après l'inscription
   */
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4a5568; text-align: center;">Bienvenue sur MyFamily, ${name}!</h1>
        <p>Nous sommes ravis de vous accueillir sur notre plateforme dédiée aux familles.</p>
        <p>Avec MyFamily, vous pouvez:</p>
        <ul>
          <li>Créer ou rejoindre des cercles familiaux</li>
          <li>Partager des photos et créer des gazettes</li>
          <li>Organiser des événements familiaux</li>
          <li>Gérer un fond familial commun</li>
        </ul>
        <p>Pour commencer, connectez-vous à votre compte et créez votre première famille ou rejoignez-en une existante.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://myfamily.replit.app" style="background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accéder à MyFamily</a>
        </div>
        <p style="margin-top: 30px; font-size: 0.8em; color: #718096; text-align: center;">Si vous avez des questions, n'hésitez pas à nous contacter à info@atrehitim.co.il</p>
      </div>
    `;
    
    const textContent = `
      Bienvenue sur MyFamily, ${name}!
      
      Nous sommes ravis de vous accueillir sur notre plateforme dédiée aux familles.
      
      Avec MyFamily, vous pouvez:
      - Créer ou rejoindre des cercles familiaux
      - Partager des photos et créer des gazettes
      - Organiser des événements familiaux
      - Gérer un fond familial commun
      
      Pour commencer, connectez-vous à votre compte et créez votre première famille ou rejoignez-en une existante.
      
      Accéder à MyFamily: https://myfamily.replit.app
    `;
    
    return this.sendEmail({
      to,
      subject: 'Bienvenue sur MyFamily!',
      text: textContent,
      html: htmlContent
    });
  }
  
  /**
   * Envoie un email de récupération de mot de passe
   */
  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const resetLink = `https://myfamily.replit.app/reset-password?token=${resetToken}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4a5568; text-align: center;">Réinitialisation de mot de passe</h1>
        <p>Vous avez demandé à réinitialiser votre mot de passe sur MyFamily.</p>
        <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a>
        </div>
        <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
        <p>Ce lien expirera dans 24 heures.</p>
        <p style="margin-top: 30px; font-size: 0.8em; color: #718096; text-align: center;">Si vous avez des questions, n'hésitez pas à nous contacter à info@atrehitim.co.il</p>
      </div>
    `;
    
    const textContent = `
      Réinitialisation de mot de passe MyFamily
      
      Vous avez demandé à réinitialiser votre mot de passe sur MyFamily.
      
      Pour créer un nouveau mot de passe, visitez le lien suivant:
      ${resetLink}
      
      Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.
      Ce lien expirera dans 24 heures.
    `;
    
    return this.sendEmail({
      to,
      subject: 'Réinitialisation de votre mot de passe MyFamily',
      text: textContent,
      html: htmlContent
    });
  }
  
  /**
   * Envoie un email de confirmation pour la création d'une famille
   */
  async sendFamilyCreationConfirmation(to: string, userName: string, familyName: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Votre famille "${familyName}" a été créée sur MyFamily`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4a5568; text-align: center;">Félicitations, ${userName}!</h1>
          <p>Votre famille "${familyName}" a été créée avec succès sur MyFamily.</p>
          <p>Vous êtes maintenant l'administrateur de cette famille et pouvez:</p>
          <ul>
            <li>Inviter des membres de votre famille</li>
            <li>Gérer le fond familial</li>
            <li>Créer des événements</li>
            <li>Partager des photos et créer des gazettes mensuelles</li>
          </ul>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://myfamily.replit.app/family/${familyName}" style="background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accéder à ma famille</a>
          </div>
          <p style="margin-top: 30px; font-size: 0.8em; color: #718096; text-align: center;">Si vous avez des questions, n'hésitez pas à nous contacter à info@atrehitim.co.il</p>
        </div>
      `
    });
  }
  
  /**
   * Envoie un email de confirmation quand un utilisateur rejoint une famille
   */
  async sendFamilyJoinConfirmation(to: string, userName: string, familyName: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Vous avez rejoint la famille "${familyName}" sur MyFamily`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4a5568; text-align: center;">Bienvenue dans votre nouvelle famille, ${userName}!</h1>
          <p>Vous avez rejoint la famille "${familyName}" sur MyFamily avec succès.</p>
          <p>Vous pouvez maintenant:</p>
          <ul>
            <li>Voir les membres de votre famille</li>
            <li>Participer au fond familial</li>
            <li>Consulter et créer des événements</li>
            <li>Partager des photos pour les gazettes mensuelles</li>
          </ul>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://myfamily.replit.app/family/${familyName}" style="background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accéder à ma famille</a>
          </div>
          <p style="margin-top: 30px; font-size: 0.8em; color: #718096; text-align: center;">Si vous avez des questions, n'hésitez pas à nous contacter à info@atrehitim.co.il</p>
        </div>
      `
    });
  }
  
  /**
   * Envoie un email d'invitation à rejoindre une famille
   */
  async sendFamilyInvitation(to: string, inviterName: string, invitationToken: string, familyName: string): Promise<boolean> {
    const invitationLink = `https://myfamily.replit.app/invitation?token=${invitationToken}`;
    
    return this.sendEmail({
      to,
      subject: `${inviterName} vous invite à rejoindre sa famille sur MyFamily`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4a5568; text-align: center;">Invitation à rejoindre une famille</h1>
          <p>${inviterName} vous invite à rejoindre la famille "${familyName}" sur la plateforme MyFamily.</p>
          <p>MyFamily est une plateforme qui permet aux familles de:</p>
          <ul>
            <li>Partager des photos et créer des gazettes mensuelles</li>
            <li>Organiser des événements familiaux</li>
            <li>Gérer un fond familial commun</li>
            <li>Rester en contact facilement</li>
          </ul>
          <p>Pour accepter cette invitation, cliquez sur le lien ci-dessous:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" style="background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Rejoindre la famille</a>
          </div>
          <p>Cette invitation expirera dans 7 jours.</p>
          <p style="margin-top: 30px; font-size: 0.8em; color: #718096; text-align: center;">Si vous avez des questions, n'hésitez pas à nous contacter à info@atrehitim.co.il</p>
        </div>
      `
    });
  }
  
  /**
   * Envoie un email de rappel pour la gazette si pas assez de photos
   */
  async sendGazetteReminder(to: string, familyName: string, photosCount: number, photoTarget: number = 10): Promise<boolean> {
    const photosNeeded = photoTarget - photosCount;
    
    return this.sendEmail({
      to,
      subject: `Rappel: Ajoutez des photos pour la gazette de ${familyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4a5568; text-align: center;">Rappel pour votre gazette familiale</h1>
          <p>La date de clôture pour la gazette de la famille "${familyName}" approche.</p>
          <p>Actuellement, il y a <strong>${photosCount} photos</strong> dans la gazette, mais l'objectif est d'en avoir au moins ${photoTarget}.</p>
          <p>Il manque encore <strong>${photosNeeded} photos</strong> pour atteindre l'objectif.</p>
          <p>N'hésitez pas à ajouter vos photos de famille pour enrichir la gazette de ce mois-ci!</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://myfamily.replit.app/family/${familyName}/photos" style="background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ajouter des photos</a>
          </div>
          <p style="margin-top: 30px; font-size: 0.8em; color: #718096; text-align: center;">Si vous avez des questions, n'hésitez pas à nous contacter à info@atrehitim.co.il</p>
        </div>
      `
    });
  }
}

// Export d'une instance singleton du service
export const emailService = new EmailService();