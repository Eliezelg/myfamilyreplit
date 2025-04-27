import { Request, Response } from 'express';
import { emailInboundService } from '../services/email-inbound-service';
import { log } from '../vite';

/**
 * Contrôleur pour gérer les webhooks d'emails entrants de SendGrid
 */

/**
 * Traite les emails entrants via le webhook SendGrid
 */
export const handleInboundEmail = async (req: Request, res: Response) => {
  try {
    log('Webhook SendGrid reçu:', req.body);

    // SendGrid envoie les données dans un tableau
    if (!req.body || !Array.isArray(req.body)) {
      return res.status(400).json({ message: 'Format de données invalide' });
    }

    // Traiter chaque événement d'email
    for (const event of req.body) {
      // Vérifier que l'événement contient les données nécessaires
      if (!event.email || !event.from || !event.to) {
        log('Événement d\'email incomplet:', event);
        continue;
      }

      // Extraire les informations de l'email
      const inboundEmail = {
        from: String(event.from),
        to: String(event.to),
        subject: event.subject ? String(event.subject) : '',
        text: event.text ? String(event.text) : '',
        html: event.html ? String(event.html) : '',
        attachments: Array.isArray(event.attachments) ? event.attachments : []
      };

      // Traiter l'email
      await emailInboundService.processInboundEmail(inboundEmail);
    }

    // Répondre avec succès, même si certains emails n'ont pas pu être traités
    res.status(200).json({ message: 'Emails traités avec succès' });
  } catch (error) {
    log('Erreur lors du traitement du webhook SendGrid:', error);
    res.status(500).json({ 
      message: 'Erreur lors du traitement des emails entrants',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Génère un alias email pour une famille
 */
export const generateFamilyEmailAlias = async (req: Request, res: Response) => {
  try {
    const familyId = parseInt(req.params.familyId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    // Vérifier que l'utilisateur est administrateur de la famille
    const isAdmin = await storage.userIsFamilyAdmin(userId, familyId);
    if (!isAdmin) {
      return res.status(403).json({ message: 'Vous n\'êtes pas administrateur de cette famille' });
    }

    // Générer ou récupérer l'alias email de la famille
    const emailAlias = await emailInboundService.updateFamilyEmailAlias(familyId);

    if (!emailAlias) {
      return res.status(500).json({ message: 'Impossible de générer un alias email pour cette famille' });
    }

    res.status(200).json({ emailAlias });
  } catch (error) {
    log('Erreur lors de la génération de l\'alias email:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la génération de l\'alias email',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Importer le service de stockage
import { storage } from '../storage';
import { User } from '../../shared/schema';
