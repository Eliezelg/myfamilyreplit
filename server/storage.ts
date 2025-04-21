import { 
  users, type User, type InsertUser,
  families, type Family, type InsertFamily,
  familyMembers, type FamilyMember, type InsertFamilyMember,
  photos, type Photo, type InsertPhoto,
  gazettes, type Gazette, type InsertGazette,
  familyFunds, type FamilyFund, type InsertFamilyFund,
  fundTransactions, type FundTransaction, type InsertFundTransaction,
  recipients, type Recipient, type InsertRecipient,
  invitations, type Invitation, type InsertInvitation,
  events, type Event, type InsertEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gt } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PgSession = connectPgSimple(session);

export interface IStorage {
  // Session store
  sessionStore: any;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Family operations
  getFamily(id: number): Promise<Family | undefined>;
  getFamiliesForUser(userId: number): Promise<Family[]>;
  createFamily(family: InsertFamily, userId: number): Promise<Family>;
  
  // Family member operations
  getFamilyMembers(familyId: number): Promise<FamilyMember[]>;
  addFamilyMember(familyId: number, member: InsertFamilyMember): Promise<FamilyMember>;
  userIsFamilyMember(userId: number, familyId: number): Promise<boolean>;
  userIsFamilyAdmin(userId: number, familyId: number): Promise<boolean>;
  
  // Photo operations
  getFamilyPhotos(familyId: number, monthYear: string): Promise<Photo[]>;
  addPhoto(photo: InsertPhoto): Promise<Photo>;
  
  // Gazette operations
  getGazette(id: number): Promise<Gazette | undefined>;
  getFamilyGazettes(familyId: number): Promise<Gazette[]>;
  createGazette(gazette: InsertGazette): Promise<Gazette>;
  updateGazetteStatus(id: number, status: string): Promise<Gazette>;
  
  // Family fund operations
  getFamilyFund(familyId: number): Promise<FamilyFund | undefined>;
  createFamilyFund(fund: InsertFamilyFund): Promise<FamilyFund>;
  updateFundBalance(id: number, newBalance: number): Promise<FamilyFund>;
  
  // Fund transaction operations
  getFundTransactions(fundId: number): Promise<FundTransaction[]>;
  addFundTransaction(transaction: InsertFundTransaction): Promise<FundTransaction>;
  
  // Recipient operations
  getFamilyRecipients(familyId: number): Promise<Recipient[]>;
  addRecipient(recipient: InsertRecipient): Promise<Recipient>;
  
  // Invitation operations
  getFamilyInvitation(familyId: number): Promise<Invitation | undefined>;
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  getInvitationByToken(token: string): Promise<Invitation | undefined>;
  updateInvitationStatus(id: number, status: string): Promise<Invitation>;
  
  // Event operations
  getFamilyEvents(familyId: number): Promise<Event[]>;
  addEvent(event: InsertEvent): Promise<Event>;
}

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    this.sessionStore = new PgSession({
      pool,
      createTableIfMissing: true,
      tableName: 'session' // Nom de la table pour les sessions
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    // Recherche insensible à la casse en utilisant SQL ILIKE
    const input = username.toLowerCase().trim();
    const allUsers = await db.select().from(users);
    
    // Comparer manuellement sans tenir compte de la casse (username ou email)
    const user = allUsers.find(u => 
      u.username.toLowerCase() === input || 
      u.email.toLowerCase() === input
    );
    return user || undefined;
  }
  
  // Fonction pour vérifier si un email existe déjà
  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalizedEmail = email.toLowerCase().trim();
    const allUsers = await db.select().from(users);
    
    const user = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    return user || undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Family operations
  async getFamily(id: number): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family || undefined;
  }
  
  async getFamiliesForUser(userId: number): Promise<Family[]> {
    const result = await db
      .select({ family: families })
      .from(familyMembers)
      .innerJoin(families, eq(familyMembers.familyId, families.id))
      .where(eq(familyMembers.userId, userId));
    
    return result.map(r => r.family);
  }
  
  async createFamily(family: InsertFamily, userId: number): Promise<Family> {
    // Create family
    const [newFamily] = await db.insert(families).values(family).returning();
    
    // Add creator as admin
    await db.insert(familyMembers).values({
      familyId: newFamily.id,
      userId,
      role: "admin",
    });
    
    // Create family fund
    await db.insert(familyFunds).values({
      familyId: newFamily.id,
      balance: 0,
      currency: "ILS",
    });
    
    return newFamily;
  }
  
  // Family member operations
  async getFamilyMembers(familyId: number): Promise<(FamilyMember & { user?: User })[]> {
    const members = await db.select({
      member: familyMembers,
      user: users
    })
    .from(familyMembers)
    .leftJoin(users, eq(familyMembers.userId, users.id))
    .where(eq(familyMembers.familyId, familyId));
    
    return members.map(m => ({
      ...m.member,
      user: m.user || undefined
    }));
  }
  
  async addFamilyMember(familyId: number, member: InsertFamilyMember): Promise<FamilyMember> {
    const [newMember] = await db.insert(familyMembers).values({
      ...member,
      familyId,
    }).returning();
    
    return newMember;
  }
  
  async userIsFamilyMember(userId: number, familyId: number): Promise<boolean> {
    const [member] = await db.select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.userId, userId),
          eq(familyMembers.familyId, familyId)
        )
      );
    
    return !!member;
  }
  
  async userIsFamilyAdmin(userId: number, familyId: number): Promise<boolean> {
    const [member] = await db.select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.userId, userId),
          eq(familyMembers.familyId, familyId),
          eq(familyMembers.role, "admin")
        )
      );
    
    return !!member;
  }
  
  // Photo operations
  async getFamilyPhotos(familyId: number, monthYear: string): Promise<Photo[]> {
    return db.select()
      .from(photos)
      .where(
        and(
          eq(photos.familyId, familyId),
          eq(photos.monthYear, monthYear)
        )
      )
      .orderBy(desc(photos.uploadedAt));
  }
  
  async addPhoto(photo: InsertPhoto): Promise<Photo> {
    const [newPhoto] = await db.insert(photos).values(photo).returning();
    return newPhoto;
  }
  
  // Gazette operations
  async getGazette(id: number): Promise<Gazette | undefined> {
    const [gazette] = await db.select().from(gazettes).where(eq(gazettes.id, id));
    return gazette || undefined;
  }
  
  async getFamilyGazettes(familyId: number): Promise<Gazette[]> {
    return db.select()
      .from(gazettes)
      .where(eq(gazettes.familyId, familyId))
      .orderBy(desc(gazettes.createdAt));
  }
  
  async createGazette(gazette: InsertGazette): Promise<Gazette> {
    const [newGazette] = await db.insert(gazettes).values(gazette).returning();
    return newGazette;
  }
  
  async updateGazetteStatus(id: number, status: string): Promise<Gazette> {
    const [updatedGazette] = await db.update(gazettes)
      .set({ status })
      .where(eq(gazettes.id, id))
      .returning();
    
    return updatedGazette;
  }
  
  // Family fund operations
  async getFamilyFund(familyId: number): Promise<FamilyFund | undefined> {
    const [fund] = await db.select()
      .from(familyFunds)
      .where(eq(familyFunds.familyId, familyId));
    
    return fund || undefined;
  }
  
  async createFamilyFund(fund: InsertFamilyFund): Promise<FamilyFund> {
    const [newFund] = await db.insert(familyFunds).values(fund).returning();
    return newFund;
  }
  
  async updateFundBalance(id: number, newBalance: number): Promise<FamilyFund> {
    const [updatedFund] = await db.update(familyFunds)
      .set({ balance: newBalance })
      .where(eq(familyFunds.id, id))
      .returning();
    
    return updatedFund;
  }
  
  // Fund transaction operations
  async getFundTransactions(fundId: number): Promise<FundTransaction[]> {
    return db.select()
      .from(fundTransactions)
      .where(eq(fundTransactions.familyFundId, fundId))
      .orderBy(desc(fundTransactions.transactionDate));
  }
  
  async addFundTransaction(transaction: InsertFundTransaction): Promise<FundTransaction> {
    const [newTransaction] = await db.insert(fundTransactions)
      .values(transaction)
      .returning();
    
    return newTransaction;
  }
  
  // Recipient operations
  async getFamilyRecipients(familyId: number): Promise<Recipient[]> {
    return db.select()
      .from(recipients)
      .where(eq(recipients.familyId, familyId));
  }
  
  async addRecipient(recipient: InsertRecipient): Promise<Recipient> {
    const [newRecipient] = await db.insert(recipients)
      .values(recipient)
      .returning();
    
    return newRecipient;
  }
  
  // Invitation operations
  async getFamilyInvitation(familyId: number): Promise<Invitation | undefined> {
    // Get the most recent active invitation (code type) for this family
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.familyId, familyId),
          eq(invitations.type, "code"),
          eq(invitations.status, "pending"),
          gt(invitations.expiresAt, new Date())
        )
      )
      .orderBy(desc(invitations.createdAt))
      .limit(1);
      
    return invitation || undefined;
  }
  
  async createInvitation(invitation: InsertInvitation): Promise<Invitation> {
    const [newInvitation] = await db.insert(invitations)
      .values(invitation)
      .returning();
    
    return newInvitation;
  }
  
  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    const [invitation] = await db.select()
      .from(invitations)
      .where(eq(invitations.token, token));
    
    return invitation || undefined;
  }
  
  async updateInvitationStatus(id: number, status: string): Promise<Invitation> {
    const [updatedInvitation] = await db.update(invitations)
      .set({ status })
      .where(eq(invitations.id, id))
      .returning();
    
    return updatedInvitation;
  }
  
  // Event operations
  async getFamilyEvents(familyId: number): Promise<Event[]> {
    return db.select()
      .from(events)
      .where(eq(events.familyId, familyId))
      .orderBy(events.date);
  }
  
  async addEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events)
      .values(event)
      .returning();
    
    return newEvent;
  }
}

export const storage = new DatabaseStorage();
