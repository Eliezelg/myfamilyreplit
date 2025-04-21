import { Express, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { generateGazetteOnDemand } from './scheduler';
import path from 'path';
import fs from 'fs-extra';

// Vérifier si l'utilisateur est admin d'une famille
async function checkFamilyAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Vous devez être connecté' });
  }

  const familyId = parseInt(req.params.familyId, 10);
  if (isNaN(familyId)) {
    return res.status(400).json({ error: 'ID de famille invalide' });
  }

  const isAdmin = await storage.userIsFamilyAdmin(req.user!.id, familyId);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Vous devez être administrateur de cette famille' });
  }

  next();
}

// Vérifier si l'utilisateur est membre d'une famille
async function checkFamilyMember(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Vous devez être connecté' });
  }

  const familyId = parseInt(req.params.familyId, 10);
  if (isNaN(familyId)) {
    return res.status(400).json({ error: 'ID de famille invalide' });
  }

  const isMember = await storage.userIsFamilyMember(req.user!.id, familyId);
  if (!isMember) {
    return res.status(403).json({ error: 'Vous devez être membre de cette famille' });
  }

  next();
}

export function registerGazetteRoutes(app: Express) {
  // Obtenir toutes les gazettes d'une famille
  app.get('/api/families/:familyId/gazettes', checkFamilyMember, async (req, res) => {
    try {
      const familyId = parseInt(req.params.familyId, 10);
      const gazettes = await storage.getFamilyGazettes(familyId);
      res.status(200).json(gazettes);
    } catch (error) {
      console.error('Erreur lors de la récupération des gazettes:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des gazettes' });
    }
  });

  // Obtenir une gazette spécifique
  app.get('/api/gazettes/:id', async (req, res) => {
    try {
      const gazetteId = parseInt(req.params.id, 10);
      const gazette = await storage.getGazette(gazetteId);
      
      if (!gazette) {
        return res.status(404).json({ error: 'Gazette non trouvée' });
      }
      
      // Vérifier que l'utilisateur est membre de la famille
      const isMember = await storage.userIsFamilyMember(req.user!.id, gazette.familyId);
      if (!isMember) {
        return res.status(403).json({ error: 'Vous devez être membre de cette famille' });
      }
      
      res.status(200).json(gazette);
    } catch (error) {
      console.error('Erreur lors de la récupération de la gazette:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de la gazette' });
    }
  });

  // Télécharger le PDF d'une gazette
  app.get('/api/gazettes/:id/download', async (req, res) => {
    try {
      const gazetteId = parseInt(req.params.id, 10);
      const gazette = await storage.getGazette(gazetteId);
      
      if (!gazette) {
        return res.status(404).json({ error: 'Gazette non trouvée' });
      }
      
      // Vérifier que l'utilisateur est membre de la famille
      const isMember = await storage.userIsFamilyMember(req.user!.id, gazette.familyId);
      if (!isMember) {
        return res.status(403).json({ error: 'Vous devez être membre de cette famille' });
      }
      
      if (!gazette.pdfUrl) {
        return res.status(404).json({ error: 'PDF non disponible pour cette gazette' });
      }
      
      // Vérifier que le fichier existe
      if (!await fs.pathExists(gazette.pdfUrl)) {
        return res.status(404).json({ error: 'Le fichier PDF n\'est pas disponible' });
      }
      
      // Le chemin est valide, envoyer le fichier
      const fileName = path.basename(gazette.pdfUrl);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      const fileStream = fs.createReadStream(gazette.pdfUrl);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Erreur lors du téléchargement de la gazette:', error);
      res.status(500).json({ error: 'Erreur lors du téléchargement de la gazette' });
    }
  });

  // Générer une nouvelle gazette à la demande (admin uniquement)
  app.post('/api/families/:familyId/gazettes/generate', checkFamilyAdmin, async (req, res) => {
    try {
      const familyId = parseInt(req.params.familyId, 10);
      const { monthYear } = req.body;
      
      if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
        return res.status(400).json({ error: 'Format de mois-année invalide. Utilisez YYYY-MM' });
      }
      
      // Vérifier si une gazette existe déjà pour ce mois
      const existingGazette = await storage.getFamilyGazetteByMonthYear(familyId, monthYear);
      if (existingGazette) {
        return res.status(409).json({ 
          message: 'Une gazette existe déjà pour ce mois',
          existingGazette
        });
      }
      
      // Générer la gazette de manière asynchrone
      res.status(202).json({ message: 'Génération de la gazette en cours' });
      
      // Continuer le traitement après avoir répondu au client
      try {
        const result = await generateGazetteOnDemand(familyId, monthYear);
        console.log(`Gazette générée avec succès: ${result.photoCount} photos, ${result.birthdayCount} anniversaires`);
      } catch (error) {
        console.error('Erreur lors de la génération de la gazette:', error);
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la gazette:', error);
      res.status(500).json({ error: 'Erreur lors de la génération de la gazette' });
    }
  });
}