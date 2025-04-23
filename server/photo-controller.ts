import { Request, Response } from 'express';
import { photoService } from '../services/photo-service';
import { log } from '../vite';
import { fallbackStorageService } from '../services/fallback-storage';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const uploadPhoto = async (req: Request, res: Response) => {
  try {
    const familyId = parseInt(req.params.familyId);
    const userId = req.user?.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été téléchargé' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    let imageUrl = '';

    try {
      // Essayer d'utiliser l'URL R2 normalement
      imageUrl = req.file.path || req.file.location;

      // Vérifier si l'URL est valide, sinon lever une erreur
      if (!imageUrl || imageUrl === 'undefined') {
        throw new Error('URL de fichier non valide');
      }
    } catch (r2Error) {
      // En cas d'échec avec R2, utiliser le stockage de secours
      console.warn('Échec du stockage R2, utilisation du stockage de secours:', r2Error);

      // Créer un nom de fichier unique pour le stockage local
      const fileExt = path.extname(req.file.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      const folderName = 'photos';
      const localFilePath = path.join(folderName, fileName);

      // Sauvegarder le fichier localement
      const uploadDir = path.join(process.cwd(), 'uploads', folderName);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(uploadDir, fileName), 
        req.file.buffer || fs.readFileSync(req.file.path)
      );

      // Utiliser l'URL locale
      imageUrl = fallbackStorageService.getPublicUrl(localFilePath);
    }

    const photo = await photoService.createPhoto({
      familyId,
      userId,
      imageUrl: imageUrl,
      caption: req.body.caption || '',
      fileSize: req.file.size
    });

    res.status(201).json(photo);
  } catch (error) {
    log('Erreur lors du téléchargement de la photo:', error);
    res.status(500).json({ 
      message: 'Erreur lors du téléchargement de la photo',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};