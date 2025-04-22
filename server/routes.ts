import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import express from "express";
import { registerGazetteRoutes } from "./gazette/routes";
import { scheduleGazetteGeneration } from "./gazette/scheduler";
import { registerPaymentRoutes } from "./payment/routes";
import { ZCreditAPI } from "./payment/zcredit-api";
import { PaymentService } from "./payment/payment-service";
import { registerUserRoutes } from "./routes/user-routes";
import { registerChildRoutes } from "./routes/child-routes";

// Interface étendue pour req.file avec multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// S'assurer que le dossier d'uploads existe
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Dossier d'uploads créé:", uploadDir);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req: Express.Request, file: Express.Multer.File, cb: any) {
      // Logs de débogage
      console.log("Upload destination dir:", uploadDir);
      console.log("Directory exists:", fs.existsSync(uploadDir));
      try {
        // Vérifier les permissions
        fs.accessSync(uploadDir, fs.constants.W_OK);
        console.log("Directory is writable");
      } catch (err) {
        console.error("Directory is not writable:", err);
        // Tentative de correction des permissions
        try {
          fs.chmodSync(uploadDir, 0o777);
          console.log("Changed directory permissions to 777");
        } catch (chmodErr) {
          console.error("Failed to change permissions:", chmodErr);
        }
      }
      cb(null, uploadDir);
    },
    filename: function (req: Express.Request, file: Express.Multer.File, cb: any) {
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      console.log("Generated filename:", uniqueFilename);
      cb(null, uniqueFilename);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req: Express.Request, file: Express.Multer.File, cb: any) {
    console.log("File filter checking:", file.mimetype);
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG and PNG files are allowed'));
    }
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Enregistrer les routes avec la nouvelle architecture MVC
  registerUserRoutes(app);
  registerChildRoutes(app);

  // Families
  app.get("/api/families", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const families = await storage.getFamiliesForUser(req.user.id);
      res.json(families);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/families", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const family = await storage.createFamily(req.body, req.user.id);
      res.status(201).json(family);
    } catch (error) {
      next(error);
    }
  });
  
  // Route pour créer une famille avec paiement (La famille est créée seulement si le paiement réussit)
  app.post("/api/families/create-with-payment", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: "Unauthorized" });
      
      const { familyData, paymentToken, recipientData, addRecipientLater } = req.body;
      
      if (!familyData || !paymentToken) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request. Required: familyData, paymentToken" 
        });
      }
      
      // Traitement du paiement en premier
      const paymentService = new PaymentService(new ZCreditAPI(), storage);
      const SUBSCRIPTION_PRICE = 7000; // 70 shekels
      
      const paymentResult = await paymentService.processPaymentWithToken({
        userId: req.user.id,
        familyId: -1, // Pas encore de famille créée
        amount: SUBSCRIPTION_PRICE,
        description: "דמי מנוי שנתי למשפחה",
        token: paymentToken
      });
      
      // Si le paiement a échoué, on arrête là
      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          message: paymentResult.message || "Le paiement a échoué",
          paymentError: true
        });
      }
      
      // Le paiement a réussi, on crée la famille
      const family = await storage.createFamily(familyData, req.user.id);
      
      // Création du fonds familial
      const familyFund = await storage.createFamilyFund({
        familyId: family.id,
        balance: 0,
        currency: "ILS"
      });
      
      // Si l'utilisateur a fourni des informations de destinataire et n'a pas choisi "ajouter plus tard"
      if (recipientData && !addRecipientLater) {
        try {
          // On s'assure que les données du destinataire sont complètes
          if (recipientData.name && recipientData.streetAddress && recipientData.city && recipientData.postalCode && recipientData.country) {
            await storage.addRecipient({
              ...recipientData,
              familyId: family.id
            });
          }
        } catch (recipientError) {
          console.error("Erreur lors de la création du destinataire:", recipientError);
          // On ne bloque pas le processus si l'ajout du destinataire échoue
        }
      }
      
      // On enregistre la transaction du paiement
      await storage.addFundTransaction({
        familyFundId: familyFund.id,
        amount: -SUBSCRIPTION_PRICE, // Négatif car c'est une dépense
        userId: req.user.id,
        description: "תשלום דמי מנוי שנתי",
        type: "subscription_payment",
        referenceNumber: paymentResult.referenceNumber || ""
      });
      
      res.status(201).json({
        success: true,
        family,
        payment: {
          amount: SUBSCRIPTION_PRICE,
          referenceNumber: paymentResult.referenceNumber
        }
      });
    } catch (error) {
      console.error("Error in create-with-payment:", error);
      next(error);
    }
  });

  app.get("/api/families/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);
      const family = await storage.getFamily(familyId);
      
      if (!family) {
        return res.status(404).send("Family not found");
      }
      
      // Check if user is a member of this family
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Not a member of this family");
      }
      
      res.json(family);
    } catch (error) {
      next(error);
    }
  });

  // Family Members
  app.get("/api/families/:id/members", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);
      
      // Check if user is a member of this family
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Not a member of this family");
      }
      
      const members = await storage.getFamilyMembers(familyId);
      res.json(members);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/families/:id/members", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);
      
      // Check if user is an admin of this family
      const isAdmin = await storage.userIsFamilyAdmin(req.user.id, familyId);
      if (!isAdmin) {
        return res.status(403).send("Only family admins can add members");
      }
      
      const member = await storage.addFamilyMember(familyId, req.body);
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  });

  // Photos
  app.get("/api/families/:id/photos", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);
      
      // Check if user is a member of this family
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Not a member of this family");
      }
      
      const monthYear = req.query.monthYear as string || new Date().toISOString().substring(0, 7); // YYYY-MM format
      const photos = await storage.getFamilyPhotos(familyId, monthYear);
      res.json(photos);
    } catch (error) {
      next(error);
    }
  });

  // Route de débogage pour tester les uploads - version simplifiée
  app.post("/api/test-upload", upload.single("file"), (req: MulterRequest, res) => {
    try {
      console.log("TEST Upload received:", {
        authenticated: req.isAuthenticated(),
        hasFile: !!req.file,
        body: req.body,
      });
      
      if (req.file) {
        console.log("File details:", {
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          path: req.file.path
        });
        
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(JSON.stringify({
          success: true,
          file: req.file.filename,
          message: "Test upload successful"
        }));
      } else {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).send(JSON.stringify({
          success: false,
          message: "No file received"
        }));
      }
    } catch (error: any) {
      console.error("TEST Upload error:", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).send(JSON.stringify({
        success: false,
        message: error.message || "Unknown error occurred"
      }));
    }
  });

  app.post("/api/photos/upload", upload.single("file"), async (req: MulterRequest, res, next) => {
    try {
      console.log("UPLOAD START - Auth:", req.isAuthenticated());
      
      if (!req.isAuthenticated()) {
        console.log("UPLOAD AUTH FAIL");
        res.setHeader('Content-Type', 'application/json');
        return res.status(401).send(JSON.stringify({ 
          success: false,
          message: "Unauthorized" 
        }));
      }
      
      console.log("UPLOAD FILE CHECK:", !!req.file);
      if (!req.file) {
        console.log("UPLOAD NO FILE");
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).send(JSON.stringify({ 
          success: false,
          message: "No file uploaded" 
        }));
      }
      
      // Log what we received
      console.log("Photo upload received:", { 
        file: req.file.filename,
        body: req.body,
        user: req.user?.id
      });
      
      const familyId = parseInt(req.body.familyId);
      console.log("UPLOAD FAMILY ID:", familyId);
      if (isNaN(familyId)) {
        console.log("UPLOAD INVALID FAMILY ID");
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).send(JSON.stringify({ 
          success: false,
          message: "Invalid family ID" 
        }));
      }
      
      // Check if user is a member of this family
      console.log("UPLOAD CHECKING MEMBERSHIP");
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      console.log("UPLOAD IS MEMBER:", isMember);
      if (!isMember) {
        console.log("UPLOAD NOT A MEMBER");
        res.setHeader('Content-Type', 'application/json');
        return res.status(403).send(JSON.stringify({ 
          success: false,
          message: "Not a member of this family" 
        }));
      }
      
      // Check if number of photos doesn't exceed the monthly limit
      console.log("UPLOAD CHECKING PHOTO LIMIT");
      const monthYear = new Date().toISOString().substring(0, 7); // YYYY-MM format
      const photos = await storage.getFamilyPhotos(familyId, monthYear);
      console.log("UPLOAD CURRENT PHOTOS:", photos.length);
      if (photos.length >= 28) {
        console.log("UPLOAD LIMIT REACHED");
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).send(JSON.stringify({ 
          success: false,
          message: "Monthly photo limit reached (28 photos)" 
        }));
      }
      
      // Log la caption reçue pour le débogage
      console.log("CAPTION RECEIVED:", {
        caption: req.body.caption,
        type: typeof req.body.caption,
        length: req.body.caption ? req.body.caption.length : 0
      });
      
      // Save photo info to database
      console.log("UPLOAD SAVING TO DB");
      const photo = await storage.addPhoto({
        familyId,
        userId: req.user.id,
        imageUrl: `/uploads/${req.file.filename}`, // Nom correct conforme au schéma
        caption: req.body.caption || null, // Gestion propre des nulls
        monthYear,
        fileSize: req.file.size,
      });
      
      console.log("UPLOAD SUCCESS:", photo.id);
      
      // Utiliser res.json au lieu de res.send(JSON.stringify())
      return res.status(201).json({
        success: true,
        photo
      });
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      return res.status(500).json({ 
        success: false,
        message: error.message || "An unknown error occurred" 
      });
    }
  });

  // Family Fund
  app.get("/api/families/:id/fund", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);
      
      // Check if user is a member of this family
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Not a member of this family");
      }
      
      const fund = await storage.getFamilyFund(familyId);
      res.json(fund);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/families/:id/fund/transactions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);
      
      // Check if user is a member of this family
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Not a member of this family");
      }
      
      const fund = await storage.getFamilyFund(familyId);
      if (!fund) {
        return res.status(404).send("Family fund not found");
      }
      
      const transaction = await storage.addFundTransaction({
        familyFundId: fund.id,
        userId: req.user.id,
        amount: req.body.amount,
        description: req.body.description || "Fund contribution",
      });
      
      // Update fund balance
      await storage.updateFundBalance(fund.id, fund.balance + req.body.amount);
      
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/families/:id/fund/transactions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);
      
      // Check if user is a member of this family
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Not a member of this family");
      }
      
      const fund = await storage.getFamilyFund(familyId);
      if (!fund) {
        return res.status(404).send("Family fund not found");
      }
      
      const transactions = await storage.getFundTransactions(fund.id);
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });

  // Recipients
  app.get("/api/families/:id/recipients", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);
      
      // Check if user is a member of this family
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Not a member of this family");
      }
      
      const recipients = await storage.getFamilyRecipients(familyId);
      res.json(recipients);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/families/:id/recipients", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);
      
      // Check if user is a member of this family
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Not a member of this family");
      }
      
      const recipient = await storage.addRecipient({
        ...req.body,
        familyId
      });
      
      res.status(201).json(recipient);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/families/:id/recipients/:recipientId", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);
      const recipientId = parseInt(req.params.recipientId);
      
      // Check if user is a member of this family
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Not a member of this family");
      }
      
      // Vérifier si le destinataire appartient à cette famille
      const recipients = await storage.getFamilyRecipients(familyId);
      const recipient = recipients.find(r => r.id === recipientId);
      
      if (!recipient) {
        return res.status(404).send("Recipient not found");
      }
      
      // Mettre à jour les informations tout en maintenant familyId
      const updatedRecipient = await storage.updateRecipient(recipientId, {
        ...req.body,
        familyId
      });
      
      res.json(updatedRecipient);
    } catch (error) {
      next(error);
    }
  });



  // Invitations
  app.get("/api/families/:id/invitation", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);
      
      // Check if user is a member of this family
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Not a member of this family");
      }
      
      // Get or create invitation code
      const invitation = await storage.getFamilyInvitation(familyId);
      if (!invitation) {
        return res.status(404).send("No invitation found");
      }
      
      res.json(invitation);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/families/:id/invitation", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);
      
      // Check if user is an admin of this family
      const isAdmin = await storage.userIsFamilyAdmin(req.user.id, familyId);
      if (!isAdmin) {
        return res.status(403).send("Only family admins can create invitation codes");
      }
      
      // Create a unique random token
      const token = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      // Create or update invitation
      const invitation = await storage.createInvitation({
        familyId,
        invitedByUserId: req.user.id,
        token,
        expiresAt,
        type: "code",
      });
      
      res.status(201).json(invitation);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/families/:id/invite-email", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).send("Email is required");
      }
      
      // Check if user is an admin of this family
      const isAdmin = await storage.userIsFamilyAdmin(req.user.id, familyId);
      if (!isAdmin) {
        return res.status(403).send("Only family admins can send email invitations");
      }
      
      // Create a unique random token
      const token = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Create invitation
      const invitation = await storage.createInvitation({
        familyId,
        invitedByUserId: req.user.id,
        email,
        token,
        expiresAt,
        message: req.body.message || "",
        type: "email",
      });
      
      // TODO: Actually send the email with a link 
      // to join/register using the token
      
      res.status(201).json(invitation);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/invitations/:token/validate", async (req, res, next) => {
    try {
      const token = req.params.token;
      
      // Get invitation by token
      const invitation = await storage.getInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).send("Invalid invitation code");
      }
      
      // Check if invitation is expired
      if (new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).send("Invitation code has expired");
      }
      
      // Check if invitation is already used
      if (invitation.status !== "pending") {
        return res.status(400).send("Invitation code has already been used");
      }
      
      // Get family info
      const family = await storage.getFamily(invitation.familyId);
      
      res.json({
        valid: true,
        familyId: invitation.familyId,
        familyName: family?.name,
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/invitations/:token/join", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const token = req.params.token;
      
      // Get invitation by token
      const invitation = await storage.getInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).send("Invalid invitation code");
      }
      
      // Check if invitation is expired
      if (new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).send("Invitation code has expired");
      }
      
      // Check if invitation is already used
      if (invitation.status !== "pending") {
        return res.status(400).send("Invitation code has already been used");
      }
      
      // Check if user is already a member of this family
      const isMember = await storage.userIsFamilyMember(req.user.id, invitation.familyId);
      if (isMember) {
        return res.status(400).send("You are already a member of this family");
      }
      
      // Add user as member to the family
      const familyMember = await storage.addFamilyMember(invitation.familyId, {
        userId: req.user.id,
        familyId: invitation.familyId,
        role: "member",
      });
      
      // Update invitation status
      await storage.updateInvitationStatus(invitation.id, "accepted");
      
      // Get family name
      const family = await storage.getFamily(invitation.familyId);
      
      res.status(201).json({
        success: true,
        familyMember,
        familyId: invitation.familyId,
        familyName: family?.name,
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Join family with invitation code (from request body)
  app.post("/api/join-family", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).send("Invitation code is required");
      }
      
      // Get invitation by token
      const invitation = await storage.getInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).send("Invalid invitation code");
      }
      
      // Check if invitation is expired
      if (new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).send("Invitation code has expired");
      }
      
      // Check if invitation is already used
      if (invitation.status !== "pending") {
        return res.status(400).send("Invitation code has already been used");
      }
      
      // Check if user is already a member of this family
      const isMember = await storage.userIsFamilyMember(req.user.id, invitation.familyId);
      if (isMember) {
        return res.status(400).send("You are already a member of this family");
      }
      
      // Add user as member to the family
      const familyMember = await storage.addFamilyMember(invitation.familyId, {
        userId: req.user.id,
        familyId: invitation.familyId,
        role: "member",
      });
      
      // Update invitation status
      await storage.updateInvitationStatus(invitation.id, "accepted");
      
      // Get family name
      const family = await storage.getFamily(invitation.familyId);
      
      res.status(201).json({
        success: true,
        familyId: invitation.familyId,
        name: family?.name,
        member: familyMember
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Events
  app.get("/api/families/:id/events", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);
      
      // Check if user is a member of this family
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Not a member of this family");
      }
      
      const events = await storage.getFamilyEvents(familyId);
      res.json(events);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/families/:id/events", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const familyId = parseInt(req.params.id);
      
      // Check if user is a member of this family
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Not a member of this family");
      }
      
      const event = await storage.addEvent({
        ...req.body,
        familyId,
      });
      
      res.status(201).json(event);
    } catch (error) {
      next(error);
    }
  });

  // Register gazette routes
  registerGazetteRoutes(app);
  
  // Register payment routes
  registerPaymentRoutes(app);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Schedule gazette generation
  scheduleGazetteGeneration();

  return httpServer;
}
