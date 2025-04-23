import { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { generateGazetteForFamily, generateGazetteOnDemand } from "./scheduler";
import path from "path";
import fs from "fs";
import axios from "axios";
import { r2GazetteStorage } from "./r2-gazette-storage";

// Middleware pour vérifier si l'utilisateur est admin d'une famille
async function checkFamilyAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const familyId = parseInt(req.params.id);
    
    const isAdmin = await storage.userIsFamilyAdmin(req.user.id, familyId);
    if (!isAdmin) {
      return res.status(403).send("Seuls les administrateurs de famille peuvent gérer les gazettes");
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

// Middleware pour vérifier si l'utilisateur est membre d'une famille
async function checkFamilyMember(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const familyId = parseInt(req.params.id);
    
    const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
    if (!isMember) {
      return res.status(403).send("Vous n'êtes pas membre de cette famille");
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

export function registerGazetteRoutes(app: Express) {
  // Obtenir toutes les gazettes d'une famille
  app.get("/api/families/:id/gazettes", checkFamilyMember, async (req, res, next) => {
    try {
      const familyId = parseInt(req.params.id);
      const gazettes = await storage.getFamilyGazettes(familyId);
      res.json(gazettes);
    } catch (error) {
      next(error);
    }
  });

  // Obtenir une gazette spécifique par ID
  app.get("/api/gazettes/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const gazetteId = parseInt(req.params.id);
      
      const gazette = await storage.getGazette(gazetteId);
      if (!gazette) {
        return res.status(404).send("Gazette non trouvée");
      }
      
      // Vérifier si l'utilisateur est membre de la famille
      const isMember = await storage.userIsFamilyMember(req.user.id, gazette.familyId);
      if (!isMember) {
        return res.status(403).send("Vous n'avez pas accès à cette gazette");
      }
      
      res.json(gazette);
    } catch (error) {
      next(error);
    }
  });

  // Obtenir une gazette spécifique par mois/année pour une famille
  app.get("/api/families/:id/gazettes/:monthYear", checkFamilyMember, async (req, res, next) => {
    try {
      const familyId = parseInt(req.params.id);
      const monthYear = req.params.monthYear;
      
      const gazette = await storage.getFamilyGazetteByMonthYear(familyId, monthYear);
      if (!gazette) {
        return res.status(404).send("Gazette non trouvée pour ce mois");
      }
      
      res.json(gazette);
    } catch (error) {
      next(error);
    }
  });

  // Télécharger un PDF de gazette
  app.get("/api/gazettes/:id/download", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const gazetteId = parseInt(req.params.id);
      
      const gazette = await storage.getGazette(gazetteId);
      if (!gazette) {
        return res.status(404).send("Gazette non trouvée");
      }
      
      // Vérifier si l'utilisateur est membre de la famille
      const isMember = await storage.userIsFamilyMember(req.user.id, gazette.familyId);
      if (!isMember) {
        return res.status(403).send("Vous n'avez pas accès à cette gazette");
      }
      
      // Vérifier si le fichier PDF existe
      if (!gazette.pdfUrl) {
        return res.status(404).send("Le fichier PDF de la gazette n'existe pas");
      }
      
      // Vérifier si l'URL est une URL externe (Cloudflare R2) ou un chemin local
      const pdfUrl = gazette.pdfUrl;
      const isExternalUrl = pdfUrl.startsWith('http');
      
      if (isExternalUrl) {
        try {
          // Pour les URL externes (R2), récupérer le fichier et le transmettre
          const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
          
          // Définir les en-têtes pour le téléchargement
          const filename = `gazette_famille_${gazette.familyId}_${gazette.monthYear}.pdf`;
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          
          // Envoyer le fichier
          res.send(response.data);
        } catch (error) {
          console.error("Erreur lors du téléchargement du PDF depuis R2:", error);
          return res.status(404).send("Impossible d'accéder au fichier PDF de la gazette");
        }
      } else {
        // Pour les fichiers locaux (ancien système), vérifier si le fichier existe
        if (!fs.existsSync(path.join(process.cwd(), pdfUrl))) {
          return res.status(404).send("Le fichier PDF de la gazette n'existe pas");
        }
        
        // Envoyer le fichier local au client
        res.download(path.join(process.cwd(), pdfUrl));
      }
    } catch (error) {
      next(error);
    }
  });

  // Générer une gazette à la demande (manuellement)
  app.post("/api/families/:id/gazettes/generate", checkFamilyAdmin, async (req, res, next) => {
    try {
      const familyId = parseInt(req.params.id);
      const { monthYear } = req.body;
      
      if (!monthYear) {
        return res.status(400).send("Le format mois/année (YYYY-MM) est requis");
      }
      
      // Vérifier si une gazette existe déjà pour ce mois
      const existingGazette = await storage.getFamilyGazetteByMonthYear(familyId, monthYear);
      if (existingGazette && existingGazette.pdfUrl) {
        // Si elle existe et a une URL de PDF
        // Vérifier si c'est une URL R2 ou un chemin local
        const isExternalUrl = existingGazette.pdfUrl.startsWith('http');
        
        if (isExternalUrl) {
          // Si c'est une URL R2, on considère que la gazette existe déjà
          return res.status(400).send("Une gazette existe déjà pour ce mois");
        } else if (fs.existsSync(path.join(process.cwd(), existingGazette.pdfUrl))) {
          // Si c'est un chemin local et que le fichier existe, la gazette existe déjà
          return res.status(400).send("Une gazette existe déjà pour ce mois");
        }
        // Sinon, le fichier n'existe pas, on va régénérer la gazette
      }
      
      // Générer la gazette
      try {
        const result = await generateGazetteOnDemand(familyId, monthYear);
        res.status(201).json(result);
      } catch (error) {
        console.error("Erreur de génération de gazette:", error);
        res.status(500).send("Erreur lors de la génération de la gazette");
      }
    } catch (error) {
      next(error);
    }
  });
}