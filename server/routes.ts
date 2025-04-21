import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import express from "express";

// Interface étendue pour req.file avec multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req: Express.Request, file: Express.Multer.File, cb: any) {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req: Express.Request, file: Express.Multer.File, cb: any) {
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req: Express.Request, file: Express.Multer.File, cb: any) {
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

  // API Routes
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

  app.post("/api/photos/upload", upload.single("file"), async (req: MulterRequest & Request, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      if (!req.file) {
        return res.status(400).send("No file uploaded");
      }
      
      const familyId = parseInt(req.body.familyId);
      
      // Check if user is a member of this family
      const isMember = await storage.userIsFamilyMember(req.user.id, familyId);
      if (!isMember) {
        return res.status(403).send("Not a member of this family");
      }
      
      // Check if number of photos doesn't exceed the monthly limit
      const monthYear = new Date().toISOString().substring(0, 7); // YYYY-MM format
      const photos = await storage.getFamilyPhotos(familyId, monthYear);
      if (photos.length >= 28) {
        return res.status(400).send("Monthly photo limit reached (28 photos)");
      }
      
      // Save photo info to database
      const photo = await storage.addPhoto({
        familyId,
        userId: req.user.id,
        imageUrl: `/uploads/${req.file.filename}`,
        caption: req.body.caption || "",
        monthYear,
        fileSize: req.file.size,
      });
      
      res.status(201).json(photo);
    } catch (error) {
      next(error);
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
      
      // Check if user is an admin of this family
      const isAdmin = await storage.userIsFamilyAdmin(req.user.id, familyId);
      if (!isAdmin) {
        return res.status(403).send("Only family admins can add recipients");
      }
      
      const recipient = await storage.addRecipient({
        ...req.body,
        familyId,
      });
      
      res.status(201).json(recipient);
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
