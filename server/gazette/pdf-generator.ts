import PDFDocument from "pdfkit";
import fs from "fs-extra";
import path from "path";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { storage } from "../storage";
import { Family, Photo, User, Child } from "@shared/schema";

// Structure pour les événements d'anniversaire
interface BirthdayEvent {
  name: string;
  date: Date;
  profileImage?: string;
  type: 'user' | 'child';
}

// Structure pour le résultat de la génération
export interface GazetteGenerationResult {
  pdfPath: string;
  monthYear: string;
}

// Constantes pour les chemins de fichiers
const UPLOADS_DIR = path.resolve("./uploads");
const GAZETTES_DIR = path.join(UPLOADS_DIR, "gazettes");

/**
 * Initialise les répertoires nécessaires
 */
export async function initDirectories() {
  await fs.ensureDir(UPLOADS_DIR);
  await fs.ensureDir(GAZETTES_DIR);
}

/**
 * Génère un PDF de gazette à partir des photos et des données de la famille
 */
export async function generateGazettePDF(
  photos: (Photo & { user?: User })[],
  family: Family,
  birthdays: BirthdayEvent[] = [],
  monthYear: string
): Promise<GazetteGenerationResult> {
  // Initialiser les répertoires
  await initDirectories();

  // Créer un nom de fichier unique pour le PDF
  const date = new Date();
  const timestamp = date.getTime();
  const fileName = `gazette_${family.id}_${monthYear.replace("-", "_")}_${timestamp}.pdf`;
  const filePath = path.join(GAZETTES_DIR, fileName);
  const relativePath = `/uploads/gazettes/${fileName}`;

  // Créer un nouveau document PDF
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: `Gazette Familiale ${family.name} - ${formatMonthYear(monthYear)}`,
      Author: 'MyFamily App',
      Subject: `Gazette mensuelle de la famille ${family.name} pour ${formatMonthYear(monthYear)}`,
      Keywords: 'famille, gazette, photos',
    }
  });

  // Créer un flux pour écrire le PDF dans un fichier
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Ajouter l'en-tête de la gazette
  addHeader(doc, family, monthYear);

  // Section des photos
  addPhotoSection(doc, photos);

  // Section des anniversaires du mois
  if (birthdays.length > 0) {
    addBirthdaySection(doc, birthdays, monthYear);
  }

  // Ajouter le pied de page
  addFooter(doc);

  // Finaliser le document
  doc.end();

  // Attendre que le flux soit terminé
  await new Promise<void>((resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });

  return {
    pdfPath: relativePath,
    monthYear
  };
}

/**
 * Récupère les anniversaires à venir pour une famille
 */
export async function getUpcomingBirthdays(familyId: number, monthYear: string): Promise<BirthdayEvent[]> {
  const events: BirthdayEvent[] = [];
  const [year, month] = monthYear.split('-').map(Number);

  // Récupérer les membres de la famille
  const familyMembers = await storage.getFamilyMembers(familyId);

  // Pour chaque membre, récupérer l'utilisateur et vérifier son anniversaire
  for (const member of familyMembers) {
    if (!member.user) continue;

    const user = member.user;
    
    if (user.birthDate) {
      const birthDate = new Date(user.birthDate);
      
      // Si le mois de naissance correspond au mois de la gazette
      if (birthDate.getMonth() + 1 === month) {
        events.push({
          name: user.fullName,
          date: birthDate,
          profileImage: user.profileImage,
          type: 'user'
        });
      }
    }

    // Récupérer les enfants de cet utilisateur
    const children = await storage.getUserChildren(user.id);
    
    // Pour chaque enfant, vérifier son anniversaire
    for (const child of children) {
      if (child.birthDate) {
        const childBirthDate = new Date(child.birthDate);
        
        // Si le mois de naissance correspond au mois de la gazette
        if (childBirthDate.getMonth() + 1 === month) {
          events.push({
            name: child.name,
            date: childBirthDate,
            profileImage: child.profileImage,
            type: 'child'
          });
        }
      }
    }
  }

  // Trier les événements par jour du mois
  return events.sort((a, b) => a.date.getDate() - b.date.getDate());
}

/**
 * Génère une gazette pour une famille donnée
 */
export async function generateGazetteForFamily(familyId: number, monthYear: string): Promise<GazetteGenerationResult> {
  // Récupérer les informations de la famille
  const family = await storage.getFamily(familyId);
  if (!family) {
    throw new Error(`Famille ${familyId} non trouvée`);
  }

  // Récupérer les photos du mois pour cette famille
  const photos = await storage.getFamilyPhotos(familyId, monthYear);
  
  // Vérifier s'il y a des photos
  if (photos.length === 0) {
    throw new Error(`Aucune photo disponible pour la famille ${familyId} au mois ${monthYear}`);
  }

  // Enrichir les photos avec les infos utilisateur
  const photosWithUser = await Promise.all(
    photos.map(async (photo) => {
      const user = await storage.getUser(photo.userId);
      return { ...photo, user };
    })
  );

  // Récupérer les anniversaires du mois
  const birthdays = await getUpcomingBirthdays(familyId, monthYear);

  // Générer le PDF
  let result: GazetteGenerationResult;
  let gazette;

  try {
    result = await generateGazettePDF(photosWithUser, family, birthdays, monthYear);
    
    // Vérifier si une gazette existe déjà pour ce mois
    gazette = await storage.getFamilyGazetteByMonthYear(familyId, monthYear);
    
    if (gazette) {
      // Mettre à jour la gazette existante
      // Adapter aux champs existants dans la base de données
      await storage.updateGazette(gazette.id, {
        pdfUrl: result.pdfPath,
        status: 'complete'
      });
    } else {
      // Créer une nouvelle gazette
      // Créer une nouvelle gazette avec les champs existants
      gazette = await storage.createGazette({
        familyId,
        monthYear,
        pdfUrl: result.pdfPath,
        status: 'complete'
      });
    }

    return result;
  } catch (error) {
    console.error(`Erreur lors de la génération du PDF pour la famille ${familyId}:`, error);
    
    // En cas d'erreur, créer ou mettre à jour la gazette avec un statut d'erreur
    if (gazette) {
      await storage.updateGazette(gazette.id, {
        status: 'error'
      });
    } else {
      await storage.createGazette({
        familyId,
        monthYear,
        status: 'error'
      });
    }
    
    throw error;
  }
}

// ---- Fonctions d'aide pour la génération du PDF ----

/**
 * Ajoute l'en-tête au document PDF
 */
function addHeader(doc: PDFKit.PDFDocument, family: Family, monthYear: string) {
  // Logo et titre
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text(`Gazette de la Famille ${family.name}`, { align: 'center' });
  
  doc.moveDown(0.5);
  
  // Mois et année
  doc.fontSize(18)
     .font('Helvetica')
     .text(formatMonthYear(monthYear), { align: 'center' });
  
  doc.moveDown(1);
  
  // Ligne de séparation
  doc.moveTo(50, doc.y)
     .lineTo(doc.page.width - 50, doc.y)
     .stroke();
  
  doc.moveDown(1);
}

/**
 * Ajoute la section des photos au document PDF
 */
function addPhotoSection(doc: PDFKit.PDFDocument, photos: (Photo & { user?: User })[]) {
  // Titre de la section
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('Nos moments partagés', { align: 'center' });
  
  doc.moveDown(1);

  // Organiser les photos en grille (2 colonnes)
  const pageWidth = doc.page.width - 100; // Largeur disponible
  const photoWidth = pageWidth / 2 - 15; // Largeur de chaque photo (2 colonnes avec marge)
  
  // Parcourir toutes les photos
  let x = 50;
  let y = doc.y;
  
  photos.forEach((photo, index) => {
    const filePath = path.join(process.cwd(), photo.imageUrl);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.warn(`Le fichier ${filePath} n'existe pas, la photo sera ignorée`);
      return;
    }
    
    // Vérifier s'il reste assez d'espace sur la page
    if (y + photoWidth > doc.page.height - 100) {
      doc.addPage();
      y = 50;
    }
    
    // Calculer la position x (alterné entre gauche et droite)
    x = index % 2 === 0 ? 50 : 50 + photoWidth + 30;
    
    // Si on commence une nouvelle ligne
    if (index % 2 === 0 && index > 0) {
      y += photoWidth + 60; // Hauteur photo + espace pour la légende
    }
    
    try {
      // Ajouter l'image
      doc.image(filePath, x, y, {
        width: photoWidth,
        height: photoWidth,
        fit: [photoWidth, photoWidth]
      });
      
      // Ajouter la légende
      doc.fontSize(10)
         .font('Helvetica')
         .text(photo.caption || 'Sans description', 
               x, y + photoWidth + 5,
               { width: photoWidth, align: 'center' });
      
      // Ajouter le nom de l'utilisateur
      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .text(`Par: ${photo.user?.fullName || 'Membre'}`, 
               x, y + photoWidth + 25,
               { width: photoWidth, align: 'center' });
      
    } catch (error) {
      console.error(`Erreur lors de l'ajout de l'image ${filePath}:`, error);
    }
  });
  
  // Avancer à la position après la dernière photo
  doc.y = y + photoWidth + 50;
}

/**
 * Ajoute la section des anniversaires au document PDF
 */
function addBirthdaySection(doc: PDFKit.PDFDocument, birthdays: BirthdayEvent[], monthYear: string) {
  // Ajouter une nouvelle page pour les anniversaires
  doc.addPage();
  
  // Titre de la section
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text(`Anniversaires - ${formatMonthYear(monthYear)}`, { align: 'center' });
  
  doc.moveDown(1);
  
  // Tableau des anniversaires
  const tableTop = doc.y;
  const tableLeft = 100;
  const tableWidth = doc.page.width - 200;
  const rowHeight = 30;
  
  // En-tête du tableau
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('Date', tableLeft, tableTop, { width: 100 })
     .text('Nom', tableLeft + 100, tableTop, { width: 200 })
     .text('Âge', tableLeft + 300, tableTop, { width: 100 });
  
  doc.moveTo(tableLeft, tableTop + 20)
     .lineTo(tableLeft + tableWidth, tableTop + 20)
     .stroke();
  
  // Lignes du tableau
  let currentY = tableTop + 30;
  
  birthdays.forEach((birthday, index) => {
    const [year] = monthYear.split('-').map(Number);
    const age = year - birthday.date.getFullYear();
    const birthdayDate = birthday.date.getDate();
    
    // Formater la date d'anniversaire
    const formattedDate = format(birthday.date, 'd MMMM', { locale: fr });
    
    // Ajouter les informations
    doc.fontSize(11)
       .font('Helvetica')
       .text(formattedDate, tableLeft, currentY, { width: 100 })
       .text(birthday.name, tableLeft + 100, currentY, { width: 200 })
       .text(`${age} ans`, tableLeft + 300, currentY, { width: 100 });
    
    // Ligne de séparation
    if (index < birthdays.length - 1) {
      doc.moveTo(tableLeft, currentY + rowHeight - 5)
         .lineTo(tableLeft + tableWidth, currentY + rowHeight - 5)
         .stroke();
    }
    
    currentY += rowHeight;
  });
  
  // Encadrer le tableau
  doc.rect(tableLeft - 10, tableTop - 10, tableWidth + 20, currentY - tableTop + 10)
     .stroke();
}

/**
 * Ajoute le pied de page au document PDF
 */
function addFooter(doc: PDFKit.PDFDocument) {
  const pageCount = doc.bufferedPageRange().count;
  
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    
    // Ligne de séparation
    doc.moveTo(50, doc.page.height - 50)
       .lineTo(doc.page.width - 50, doc.page.height - 50)
       .stroke();
    
    // Texte du pied de page
    doc.fontSize(8)
       .font('Helvetica')
       .text(`Généré par MyFamily App - ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 
             50, doc.page.height - 30, 
             { align: 'left' });
    
    // Numéro de page
    doc.text(`Page ${i + 1} / ${pageCount}`, 
             0, doc.page.height - 30, 
             { align: 'right' });
  }
}

/**
 * Formate une chaîne de caractères au format YYYY-MM en un format lisible (Mois Année)
 */
function formatMonthYear(monthYear: string): string {
  try {
    const date = parse(monthYear, 'yyyy-MM', new Date());
    return format(date, 'MMMM yyyy', { locale: fr });
  } catch (error) {
    return monthYear;
  }
}