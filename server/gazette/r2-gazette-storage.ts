import { r2StorageService } from "../services/r2-storage-service";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import PDFDocument from "pdfkit";
import { Family, Photo, User } from "@shared/schema";
import { 
  BirthdayEvent, 
  GazetteGenerationResult, 
  addHeader, 
  addPhotoSection, 
  addBirthdaySection, 
  addFooter, 
  formatMonthYear 
} from "./pdf-generator";

/**
 * Service pour gérer le stockage des PDFs de gazette sur Cloudflare R2
 */
export class R2GazetteStorage {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "";
    const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

    // Initialiser le client S3 pour Cloudflare R2
    this.s3Client = new S3Client({
      region: "auto",
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "",
      },
    });

    console.log("R2GazetteStorage initialisé avec le bucket:", this.bucketName);
  }

  /**
   * Génère un PDF de gazette et l'enregistre sur R2
   */
  async generateAndUploadPDF(
    photos: (Photo & { user?: User })[],
    family: Family,
    birthdays: BirthdayEvent[] = [],
    monthYear: string
  ): Promise<GazetteGenerationResult> {
    // Créer un nom de fichier unique pour le PDF
    const date = new Date();
    const timestamp = date.getTime();
    const fileName = `gazettes/gazette_${family.id}_${monthYear.replace("-", "_")}_${timestamp}.pdf`;
    
    // Créer un nouveau document PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Gazette Familiale ${family.name}`,
        Author: 'MyFamily App',
        Subject: `Gazette mensuelle de la famille ${family.name}`,
        Keywords: 'famille, gazette, photos',
      }
    });

    // Collecter les morceaux du PDF
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Ajouter le contenu au PDF (à implémenter en fonction de vos besoins)
    this.addContentToPDF(doc, photos, family, birthdays, monthYear);

    // Finaliser le document
    doc.end();

    // Attendre que le document soit généré complètement
    await new Promise<void>((resolve) => doc.on('end', () => resolve()));
    
    // Combiner les morceaux en un seul buffer
    const pdfBuffer = Buffer.concat(chunks);
    
    // Télécharger le PDF sur R2
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    });

    await this.s3Client.send(command);
    console.log(`Gazette téléchargée sur R2: ${fileName}`);

    // Générer l'URL publique du PDF
    const pdfUrl = r2StorageService.getPublicUrl(fileName);

    return {
      pdfPath: pdfUrl,
      monthYear: monthYear
    };
  }

  /**
   * Ajoute le contenu au PDF (en-tête, photos, anniversaires, etc.)
   * Utilise les fonctions existantes de mise en page du module pdf-generator
   */
  private addContentToPDF(
    doc: PDFKit.PDFDocument,
    photos: (Photo & { user?: User })[],
    family: Family,
    birthdays: BirthdayEvent[],
    monthYear: string
  ): void {
    // Utiliser les fonctions existantes pour générer le contenu du PDF
    addHeader(doc, family, monthYear);
    
    // Ajouter la section des photos si des photos sont disponibles
    if (photos.length > 0) {
      addPhotoSection(doc, photos);
    }
    
    // Ajouter la section des anniversaires si des anniversaires sont disponibles
    if (birthdays.length > 0) {
      addBirthdaySection(doc, birthdays, monthYear);
    }
    
    // Ajouter le pied de page
    addFooter(doc);
  }

  /**
   * Supprime un PDF de gazette de R2
   */
  async deletePDF(pdfUrl: string): Promise<boolean> {
    try {
      const key = r2StorageService.getKeyFromUrl(pdfUrl);
      if (!key) {
        console.error("Impossible d'extraire la clé de l'URL:", pdfUrl);
        return false;
      }

      return await r2StorageService.deleteFile(key);
    } catch (error) {
      console.error("Erreur lors de la suppression du PDF:", error);
      return false;
    }
  }
}

export const r2GazetteStorage = new R2GazetteStorage();