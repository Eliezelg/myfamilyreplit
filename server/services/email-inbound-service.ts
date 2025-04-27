import { storage } from '../storage';
import { photoService } from './photo-service';
import { Family } from '../../shared/schema';
import { emailService } from './email-service';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fallbackStorageService } from './fallback-storage';

interface InboundEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
}

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

/**
 * Service pour gérer la réception des emails et l'extraction des photos
 */
export class EmailInboundService {
  private domain: string = 'inbound.atrehitim.co.il';
  
  constructor() {
    console.log('Service de réception d\'emails initialisé');
  }

  /**
   * Génère un alias email unique pour une famille
   */
  async generateFamilyEmailAlias(familyId: number, familyName: string): Promise<string> {
    // Nettoyer le nom de famille pour créer un alias valide
    let baseAlias = familyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Supprimer les caractères spéciaux
      .substring(0, 20); // Limiter la longueur
    
    // Ajouter un identifiant unique court
    const uniqueId = familyId.toString().padStart(4, '0');
    const emailAlias = `${baseAlias}${uniqueId}@${this.domain}`;
    
    return emailAlias;
  }

  /**
   * Met à jour l'alias email d'une famille
   */
  async updateFamilyEmailAlias(familyId: number): Promise<string | null> {
    try {
      // Récupérer les informations de la famille
      const family = await storage.getFamilyById(familyId);
      
      if (!family) {
        console.error(`Famille avec ID ${familyId} non trouvée`);
        return null;
      }
      
      // Si la famille a déjà un alias email, le retourner
      if (family.emailAlias) {
        return family.emailAlias;
      }
      
      // Générer un nouvel alias email
      const emailAlias = await this.generateFamilyEmailAlias(familyId, family.name);
      
      // Mettre à jour la famille avec le nouvel alias
      await storage.updateFamilyEmailAlias(familyId, emailAlias);
      
      // Notifier les membres de la famille de leur nouvelle adresse email
      await this.notifyFamilyMembersOfNewEmail(family, emailAlias);
      
      return emailAlias;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'alias email de la famille:', error);
      return null;
    }
  }

  /**
   * Notifie les membres d'une famille de leur nouvelle adresse email
   */
  private async notifyFamilyMembersOfNewEmail(family: Family, emailAlias: string): Promise<void> {
    try {
      // Récupérer tous les membres de la famille
      const familyMembers = await storage.getFamilyMembers(family.id);
      
      // Pour chaque membre, envoyer un email de notification
      for (const member of familyMembers) {
        const user = await storage.getUserById(member.userId);
        
        if (user && user.email) {
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #4a5568; text-align: center;">Nouvelle fonctionnalité pour ${family.name}</h1>
              <p>Bonjour ${user.firstName},</p>
              <p>Nous sommes heureux de vous annoncer que votre famille "${family.name}" dispose maintenant d'une adresse email dédiée :</p>
              <div style="text-align: center; margin: 20px 0; padding: 10px; background-color: #f7fafc; border-radius: 5px;">
                <strong style="font-size: 1.2em;">${emailAlias}</strong>
              </div>
              <p>Vous pouvez désormais envoyer des photos à cette adresse et elles seront automatiquement ajoutées à votre galerie familiale.</p>
              <p><strong>Comment ça marche :</strong></p>
              <ul>
                <li>Envoyez un email avec des photos en pièces jointes à l'adresse ci-dessus</li>
                <li>Ajoutez une légende dans l'objet ou le corps de l'email</li>
                <li>Les photos seront automatiquement ajoutées à votre galerie du mois en cours</li>
                <li>Le nom de l'expéditeur et la légende seront associés à chaque photo</li>
              </ul>
              <p>Essayez dès maintenant en envoyant votre première photo !</p>
              <p style="margin-top: 30px; font-size: 0.8em; color: #718096; text-align: center;">Si vous avez des questions, n'hésitez pas à nous contacter à info@atrehitim.co.il</p>
            </div>
          `;
          
          const textContent = `
            Nouvelle fonctionnalité pour ${family.name}
            
            Bonjour ${user.firstName},
            
            Nous sommes heureux de vous annoncer que votre famille "${family.name}" dispose maintenant d'une adresse email dédiée :
            
            ${emailAlias}
            
            Vous pouvez désormais envoyer des photos à cette adresse et elles seront automatiquement ajoutées à votre galerie familiale.
            
            Comment ça marche :
            - Envoyez un email avec des photos en pièces jointes à l'adresse ci-dessus
            - Ajoutez une légende dans l'objet ou le corps de l'email
            - Les photos seront automatiquement ajoutées à votre galerie du mois en cours
            - Le nom de l'expéditeur et la légende seront associés à chaque photo
            
            Essayez dès maintenant en envoyant votre première photo !
          `;
          
          await emailService.sendEmail({
            to: user.email,
            subject: `Nouvelle adresse email pour votre famille "${family.name}"`,
            text: textContent,
            html: htmlContent
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la notification des membres de la famille:', error);
    }
  }

  /**
   * Traite un email entrant
   */
  async processInboundEmail(email: InboundEmail): Promise<boolean> {
    try {
      console.log(`Traitement d'un email entrant de ${email.from} à ${email.to}`);
      
      // Extraire l'alias email de l'adresse destinataire
      const toAddress = email.to.toLowerCase();
      const emailAliasParts = toAddress.split('@');
      
      if (emailAliasParts.length !== 2 || emailAliasParts[1] !== this.domain) {
        console.error(`Adresse email destinataire invalide: ${toAddress}`);
        return false;
      }
      
      const emailAlias = toAddress;
      
      // Trouver la famille correspondant à cet alias
      const family = await storage.getFamilyByEmailAlias(emailAlias);
      
      if (!family) {
        console.error(`Aucune famille trouvée pour l'alias email: ${emailAlias}`);
        return false;
      }
      
      // Extraire l'adresse email de l'expéditeur
      const fromEmail = this.extractEmailAddress(email.from);
      
      if (!fromEmail) {
        console.error(`Impossible d'extraire l'adresse email de l'expéditeur: ${email.from}`);
        return false;
      }
      
      // Trouver l'utilisateur correspondant à cette adresse email
      const user = await storage.getUserByEmail(fromEmail);
      
      if (!user) {
        console.error(`Aucun utilisateur trouvé pour l'adresse email: ${fromEmail}`);
        return false;
      }
      
      // Vérifier que l'utilisateur est membre de la famille
      const isMember = await photoService.checkUserIsFamilyMember(user.id, family.id);
      
      if (!isMember) {
        console.error(`L'utilisateur ${user.id} n'est pas membre de la famille ${family.id}`);
        return false;
      }
      
      // Extraire la légende (de l'objet ou du corps de l'email)
      const caption = email.subject || email.text || '';
      
      // Traiter les pièces jointes (photos)
      if (email.attachments && email.attachments.length > 0) {
        for (const attachment of email.attachments) {
          // Vérifier si la pièce jointe est une image
          if (this.isImageAttachment(attachment)) {
            await this.processImageAttachment(attachment, family.id, user.id, caption);
          }
        }
        return true;
      } else {
        console.log('Aucune pièce jointe trouvée dans l\'email');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors du traitement de l\'email entrant:', error);
      return false;
    }
  }

  /**
   * Extrait l'adresse email d'une chaîne au format "Nom <email@example.com>"
   */
  private extractEmailAddress(fromString: string): string | null {
    const emailRegex = /<([^>]+)>/;
    const match = fromString.match(emailRegex);
    
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
    
    // Si le format n'est pas "Nom <email>", essayer de trouver directement une adresse email
    const simpleEmailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const simpleMatch = fromString.match(simpleEmailRegex);
    
    if (simpleMatch && simpleMatch[1]) {
      return simpleMatch[1].toLowerCase();
    }
    
    return null;
  }

  /**
   * Vérifie si une pièce jointe est une image
   */
  private isImageAttachment(attachment: EmailAttachment): boolean {
    const imageContentTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return imageContentTypes.includes(attachment.contentType);
  }

  /**
   * Traite une pièce jointe image
   */
  private async processImageAttachment(
    attachment: EmailAttachment,
    familyId: number,
    userId: number,
    caption: string
  ): Promise<void> {
    try {
      // Créer un nom de fichier unique
      const fileExt = path.extname(attachment.filename) || '.jpg';
      const fileName = `${uuidv4()}${fileExt}`;
      const folderName = 'photos';
      const localFilePath = path.join(folderName, fileName);
      
      // Sauvegarder le fichier localement
      const uploadDir = path.join(process.cwd(), 'uploads', folderName);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      fs.writeFileSync(path.join(uploadDir, fileName), attachment.content);
      
      // Utiliser l'URL locale
      const imageUrl = fallbackStorageService.getPublicUrl(localFilePath);
      
      // Créer la photo dans la base de données
      await photoService.addPhoto({
        familyId,
        userId,
        imageUrl,
        caption,
        monthYear: photoService.getCurrentMonthYear(),
        fileSize: attachment.content.length
      });
      
      console.log(`Photo ajoutée avec succès pour la famille ${familyId} par l'utilisateur ${userId}`);
    } catch (error) {
      console.error('Erreur lors du traitement de la pièce jointe image:', error);
    }
  }
}

// Export d'une instance singleton du service
export const emailInboundService = new EmailInboundService();
