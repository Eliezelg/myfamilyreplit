import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import multer from "multer";
import multerS3 from "multer-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { Request } from "express";

/**
 * Service pour gérer le stockage des fichiers sur Cloudflare R2
 */
class R2StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private r2Endpoint: string;

  constructor() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "";
    this.r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

    // Configuration avec options SSL étendues pour résoudre les problèmes de handshake
    this.s3Client = new S3Client({
      region: "auto", // La région est 'auto' pour Cloudflare R2
      endpoint: this.r2Endpoint,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: true,
      tls: true,
      retryMode: "standard", // Utilisation du mode de retry standard du SDK AWS v3
      maxAttempts: 3, // Nombre de tentatives maximum
      requestHandler: {
        httpOptions: {
          timeout: 30000, // Prolonger le délai d'attente pour les requêtes
        }
      }
    });

    // Vérification des credentials
    if (!process.env.CLOUDFLARE_ACCESS_KEY_ID || !process.env.CLOUDFLARE_SECRET_ACCESS_KEY) {
      console.warn("⚠️ Attention: Clés d'accès Cloudflare R2 manquantes dans les variables d'environnement");
    }

    console.log(`R2StorageService initialisé avec le bucket: ${this.bucketName}`);
  }

  /**
   * Configure multer pour l'upload des fichiers vers R2
   */
  public getMulterUpload(folderName: string = "general") {
    // Utiliser R2 dans tous les environnements
    console.log(`[R2Storage] Configuration multer pour ${folderName} avec R2`);
    return multer({
      storage: multerS3({
        s3: this.s3Client,
        bucket: this.bucketName,
        metadata: (req: Request, file: Express.Multer.File, cb: (error: Error | null, metadata?: any) => void) => {
          cb(null, { fieldName: file.fieldname });
        },
        key: (req: Request, file: Express.Multer.File, cb: (error: Error | null, key?: string) => void) => {
          const uniqueFilename = `${folderName}/${uuidv4()}${path.extname(file.originalname)}`;
          cb(null, uniqueFilename);
        }
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        console.log("Vérification du type de fichier:", file.mimetype);
        // Types de fichiers autorisés selon le dossier
        let allowedTypes: string[] = [];

        if (folderName === "gazettes") {
          allowedTypes = ["application/pdf"];
        } else {
          allowedTypes = ["image/jpeg", "image/png"];
        }

        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error(`Seuls les fichiers ${allowedTypes.join(", ")} sont autorisés pour ${folderName}`));
        }
        cb(null, true);
      },
    });
  }

  /**
   * Génère l'URL publique d'un fichier stocké sur R2
   * Note: Cette méthode suppose qu'un Workers R2 Bucket ou un domaine personnalisé soit configuré
   */
  public getPublicUrl(key: string): string {
    // Utiliser une URL directe vers le bucket R2 via le domaine dev
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    
    // Format Cloudflare R2 public endpoint standard
    return `https://${this.bucketName}.${accountId}.r2.dev/${key}`;
  }

  /**
   * Extrait le chemin de clé à partir d'une URL R2 complète
   */
  public getKeyFromUrl(url: string): string | null {
    // Exemple d'URL: https://bucket-name.account-id.r2.dev/photos/abc123.jpg
    try {
      const urlObj = new URL(url);
      // Extrait le chemin sans le / initial
      return urlObj.pathname.substring(1);
    } catch (error) {
      console.error("Erreur d'analyse de l'URL:", error);
      return null;
    }
  }

  /**
   * Supprime un fichier de R2
   */
  public async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      await this.s3Client.send(command);
      console.log(`Fichier supprimé avec succès: ${key}`);
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression du fichier sur R2:", error);
      return false;
    }
  }
  
  /**
   * Télécharge un Buffer sur R2
   * 
   * @param buffer Le buffer contenant les données du fichier
   * @param key La clé (chemin) sous laquelle le fichier sera stocké
   * @param contentType Le type MIME du fichier
   * @returns Promesse résolue à true si le téléchargement a réussi, false sinon
   */
  public async uploadBuffer(buffer: Buffer, key: string, contentType: string = 'application/octet-stream'): Promise<boolean> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });
      
      await this.s3Client.send(command);
      console.log(`Fichier téléchargé avec succès: ${key}`);
      return true;
    } catch (error) {
      console.error("Erreur lors du téléchargement du fichier sur R2:", error);
      return false;
    }
  }
}

// Exporter une instance unique du service
export const r2StorageService = new R2StorageService();