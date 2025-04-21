import PDFDocument from 'pdfkit';
import fs from 'fs-extra';
import path from 'path';
import { Photo, Gazette, User, Event, Child, Family } from '@shared/schema';
import { storage } from '../storage';

// Définition du type pour les événements d'anniversaire
interface BirthdayEvent {
  name: string;
  date: Date;
  profileImage?: string;
  type: 'user' | 'child';
}

export interface GazetteGenerationResult {
  pdfPath: string;
  monthYear: string;
  photoCount: number;
  birthdayCount: number;
}

// Chemin pour stocker les gazettes générées
const UPLOAD_DIR = path.resolve('./uploads');
const GAZETTE_DIR = path.join(UPLOAD_DIR, 'gazettes');

// Initialiser les dossiers nécessaires
export async function initDirectories() {
  await fs.ensureDir(UPLOAD_DIR);
  await fs.ensureDir(GAZETTE_DIR);
}

// Fonction pour générer le PDF de la gazette
export async function generateGazettePDF(
  familyId: number,
  monthYear: string, // Format: "YYYY-MM"
  photos: (Photo & { user?: User })[],
  upcomingBirthdays: BirthdayEvent[],
  family: Family
): Promise<string> {
  // Créer un nouveau document PDF (A4 avec orientation portrait)
  const doc = new PDFDocument({ size: 'A4', margin: 50, rtl: true }); // RTL pour l'hébreu
  
  // Créer un nom de fichier unique pour cette gazette
  const filename = `gazette_${familyId}_${monthYear.replace('-', '_')}_${Date.now()}.pdf`;
  const pdfPath = path.join(GAZETTE_DIR, filename);
  
  // Créer un flux d'écriture pour le PDF
  const writeStream = fs.createWriteStream(pdfPath);
  
  // Rediriger la sortie du PDF vers le fichier
  doc.pipe(writeStream);
  
  // ====== PREMIÈRE PAGE - PAGE DE COUVERTURE ======
  // Ajouter le titre de la gazette
  const [year, month] = monthYear.split('-');
  const monthNames = {
    '01': 'ינואר', '02': 'פברואר', '03': 'מרץ', '04': 'אפריל',
    '05': 'מאי', '06': 'יוני', '07': 'יולי', '08': 'אוגוסט',
    '09': 'ספטמבר', '10': 'אוקטובר', '11': 'נובמבר', '12': 'דצמבר'
  };
  
  const monthName = monthNames[month as keyof typeof monthNames] || month;
  const titleText = `הגיליון המשפחתי - ${family.name}`;
  const subtitleText = `${monthName} ${year}`;
  
  // Ajouter un titre et sous-titre élégants
  doc.fontSize(30).font('Helvetica-Bold').text(titleText, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(20).font('Helvetica').text(subtitleText, { align: 'center' });
  doc.moveDown(2);
  
  // Si la famille a une image, l'ajouter comme logo sur la couverture
  if (family.imageUrl) {
    try {
      const imagePath = path.resolve(family.imageUrl.replace(/^\//, ''));
      if (await fs.pathExists(imagePath)) {
        doc.image(imagePath, { fit: [300, 300], align: 'center' });
        doc.moveDown(2);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'image de la famille:', error);
    }
  }
  
  // Ajouter du texte en bas de page de la couverture
  doc.fontSize(12).text('מיוצר על ידי MyFamily - חיבור המשפחה', { align: 'center' });
  doc.moveDown(0.5);
  doc.text(`תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}`, { align: 'center' });
  
  // ====== DEUXIÈME PAGE - ANNIVERSAIRES ======
  doc.addPage();
  
  // Titre de la section anniversaires
  doc.fontSize(24).font('Helvetica-Bold').text('ימי הולדת בחודש הבא', { align: 'center' });
  doc.moveDown(1);
  
  // Afficher les anniversaires à venir
  if (upcomingBirthdays.length > 0) {
    upcomingBirthdays.forEach((birthday, index) => {
      const birthdayDate = new Date(birthday.date);
      const dateString = birthdayDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
      
      // Créer une section pour chaque anniversaire
      doc.fontSize(14).font('Helvetica-Bold').text(birthday.name, { continued: true });
      doc.fontSize(14).font('Helvetica').text(` - ${dateString}`);
      doc.moveDown(0.5);
      
      // Ajouter une photo de profil si disponible
      if (birthday.profileImage) {
        try {
          const imagePath = path.resolve(birthday.profileImage.replace(/^\//, ''));
          if (fs.pathExistsSync(imagePath)) {
            doc.image(imagePath, { width: 80, height: 80 });
            doc.moveDown(1);
          }
        } catch (error) {
          console.error('Erreur lors du chargement de l\'image de profil:', error);
        }
      }
      
      // Ajouter un séparateur entre les anniversaires
      if (index < upcomingBirthdays.length - 1) {
        doc.moveDown(0.5);
        doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
        doc.moveDown(0.5);
      }
    });
  } else {
    // Aucun anniversaire à venir
    doc.fontSize(14).text('אין ימי הולדת בחודש הבא', { align: 'center' });
  }
  
  // ====== PAGES SUIVANTES - PHOTOS DU MOIS ======
  if (photos.length > 0) {
    // Organiser les photos en grille (2 photos par page, 14 pages max pour 28 photos)
    for (let i = 0; i < photos.length; i += 2) {
      // Ajouter une nouvelle page pour chaque paire de photos
      doc.addPage();
      
      // Traiter au maximum 2 photos par page
      for (let j = 0; j < 2 && i + j < photos.length; j++) {
        const photo = photos[i + j];
        
        // Calculer le positionnement Y selon la position dans la page
        const yPos = j === 0 ? 50 : doc.page.height / 2;
        
        // Placer la photo et les informations
        doc.y = yPos;
        
        // Afficher le nom de l'utilisateur qui a posté la photo
        if (photo.user) {
          doc.fontSize(14).font('Helvetica-Bold').text(photo.user.displayName || photo.user.username, { align: 'right' });
          doc.moveDown(0.3);
          
          // Afficher la photo de profil de l'utilisateur si disponible
          if (photo.user.profileImage) {
            try {
              const profileImagePath = path.resolve(photo.user.profileImage.replace(/^\//, ''));
              if (fs.pathExistsSync(profileImagePath)) {
                doc.image(profileImagePath, { align: 'right', width: 40, height: 40 });
              }
            } catch (error) {
              console.error('Erreur lors du chargement de l\'image de profil de l\'utilisateur:', error);
            }
          }
        }
        
        doc.moveDown(0.5);
        
        // Afficher la photo
        try {
          const photoPath = path.resolve(photo.imageUrl.replace(/^\//, ''));
          if (fs.pathExistsSync(photoPath)) {
            // Calculer les dimensions pour garder le ratio mais s'assurer que ça rentre dans la page
            const maxWidth = doc.page.width - 100; // marges
            const maxHeight = (doc.page.height / 2) - 100; // moitié de page moins marge
            
            doc.image(photoPath, { fit: [maxWidth, maxHeight], align: 'center' });
            doc.moveDown(0.5);
          }
        } catch (error) {
          console.error('Erreur lors du chargement de l\'image:', error);
          doc.text('[L\'image n\'a pas pu être chargée]', { align: 'center' });
        }
        
        // Afficher la légende de la photo
        if (photo.caption) {
          doc.fontSize(12).font('Helvetica-Oblique').text(photo.caption, { align: 'center' });
        }
      }
    }
  } else {
    // Aucune photo pour ce mois
    doc.addPage();
    doc.fontSize(18).font('Helvetica-Bold').text('אין תמונות לחודש זה', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(14).text('הגיליון הבא יכלול את התמונות שיועלו בחודש הבא', { align: 'center' });
  }
  
  // Finaliser le document
  doc.end();
  
  // Retourner une promesse qui se résout lorsque le fichier est écrit
  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      resolve(pdfPath);
    });
    writeStream.on('error', reject);
  });
}

// Fonction pour obtenir les anniversaires du mois suivant
export async function getUpcomingBirthdays(familyId: number, monthYear: string): Promise<BirthdayEvent[]> {
  const upcomingBirthdays: BirthdayEvent[] = [];
  
  // Diviser le monthYear pour obtenir le mois suivant
  const [year, month] = monthYear.split('-').map(Number);
  
  // Calculer le mois suivant
  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }
  
  // Formater le mois suivant avec un zéro initial si nécessaire
  const nextMonthFormatted = nextMonth.toString().padStart(2, '0');
  
  // Obtenir les membres de la famille
  const familyMembers = await storage.getFamilyMembers(familyId);
  
  // Ajouter les anniversaires des utilisateurs
  for (const member of familyMembers) {
    if (member.user?.birthDate) {
      const birthDate = new Date(member.user.birthDate);
      const birthMonth = birthDate.getMonth() + 1; // getMonth() est basé sur zéro (0-11)
      
      if (birthMonth === nextMonth) {
        upcomingBirthdays.push({
          name: member.user.displayName || member.user.username,
          date: birthDate,
          profileImage: member.user.profileImage,
          type: 'user'
        });
      }
    }
    
    // Obtenir les enfants de cet utilisateur
    const children = await storage.getUserChildren(member.userId);
    
    // Ajouter les anniversaires des enfants
    for (const child of children) {
      if (child.birthDate) {
        const childBirthDate = new Date(child.birthDate);
        const childBirthMonth = childBirthDate.getMonth() + 1;
        
        if (childBirthMonth === nextMonth) {
          upcomingBirthdays.push({
            name: child.name,
            date: childBirthDate,
            profileImage: child.profileImage,
            type: 'child'
          });
        }
      }
    }
  }
  
  // Trier les anniversaires par jour du mois
  upcomingBirthdays.sort((a, b) => a.date.getDate() - b.date.getDate());
  
  return upcomingBirthdays;
}

// Fonction principale pour générer une gazette pour une famille et un mois donnés
export async function generateGazetteForFamily(familyId: number, monthYear: string): Promise<GazetteGenerationResult> {
  await initDirectories();
  
  // Récupérer les informations de la famille
  const family = await storage.getFamily(familyId);
  if (!family) {
    throw new Error(`Famille avec l'ID ${familyId} non trouvée`);
  }
  
  // Récupérer les photos du mois (limitées à 28)
  let photos = await storage.getFamilyPhotos(familyId, monthYear);
  
  // Limiter à 28 photos maximum
  if (photos.length > 28) {
    photos = photos.slice(0, 28);
  }
  
  // Récupérer les utilisateurs pour chaque photo
  const photosWithUsers = await Promise.all(
    photos.map(async (photo) => {
      const user = await storage.getUser(photo.userId);
      return { ...photo, user };
    })
  );
  
  // Récupérer les anniversaires du mois suivant
  const upcomingBirthdays = await getUpcomingBirthdays(familyId, monthYear);
  
  // Générer le PDF
  const pdfPath = await generateGazettePDF(familyId, monthYear, photosWithUsers, upcomingBirthdays, family);
  
  // Mettre à jour ou créer l'entrée de la gazette dans la base de données
  const existingGazette = await storage.getFamilyGazetteByMonthYear(familyId, monthYear);
  
  let gazette: Gazette;
  
  if (existingGazette) {
    // Mettre à jour la gazette existante
    gazette = await storage.updateGazette(existingGazette.id, {
      status: 'finalized',
      pdfUrl: pdfPath,
      closingDate: new Date()
    });
  } else {
    // Créer une nouvelle entrée de gazette
    gazette = await storage.createGazette({
      familyId,
      monthYear,
      status: 'finalized',
      pdfUrl: pdfPath,
      closingDate: new Date()
    });
  }
  
  return {
    pdfPath,
    monthYear,
    photoCount: photos.length,
    birthdayCount: upcomingBirthdays.length
  };
}