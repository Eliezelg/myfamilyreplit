import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import multer from "multer";
import multerS3 from "multer-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";

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

    // Initialiser le client S3 pour Cloudflare R2
    this.s3Client = new S3Client({
      region: "auto", // La région est 'auto' pour Cloudflare R2
      endpoint: this.r2Endpoint,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "",
      },
    });

    console.log(`R2StorageService initialisé avec le bucket: ${this.bucketName}`);
  }

  /**
   * Configure multer pour l'upload des fichiers vers R2
   */
  public getMulterUpload(folderName: string = "general") {
    return multer({
      storage: multerS3({
        s3: this.s3Client,
        bucket: this.bucketName,
        metadata: (req, file, cb) => {
          cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
          const uniqueFilename = `${folderName}/${uuidv4()}${path.extname(file.originalname)}`;
          cb(null, uniqueFilename);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
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
   */
  public getPublicUrl(key: string): string {
    // Format de l'URL pour accéder au fichier via Cloudflare R2
    // Note: Ceci suppose que vous avez configuré un domaine personnalisé ou Workers R2 Bucket
    // Sinon, vous devrez implémenter une logique pour générer des URL signées
    return `${this.r2Endpoint}/${this.bucketName}/${key}`;
  }

  /**
   * Supprime un fichier de R2
   */
  public async deleteFile(key: string): Promise<boolean> {
    try {
      await this.s3Client.send({
        Bucket: this.bucketName,
        Key: key,
      } as any);
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression du fichier sur R2:", error);
      return false;
    }
  }
}

// Exporter une instance unique du service
export const r2StorageService = new R2StorageService();