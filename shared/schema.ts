import { pgTable, text, serial, integer, boolean, timestamp, json, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  displayName: text("display_name"),
  email: text("email").notNull(),
  profileImage: text("profile_image"),
  birthDate: timestamp("birth_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Family model
export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  imageUrl: text("image_url"),
});

export const insertFamilySchema = createInsertSchema(families).omit({
  id: true,
  createdAt: true,
});

// FamilyMembers model (joining users and families)
export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  familyId: integer("family_id").notNull().references(() => families.id),
  role: text("role").notNull(), // admin, editor, member
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
  joinedAt: true,
});

// Photos model
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  userId: integer("user_id").notNull().references(() => users.id),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  monthYear: text("month_year").notNull(), // Format: "YYYY-MM"
  fileSize: integer("file_size"),
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  uploadedAt: true,
});

// Gazettes model
export const gazettes = pgTable("gazettes", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  monthYear: text("month_year").notNull(), // Format: "YYYY-MM"
  status: text("status").notNull(), // pending, complete, error, printed, sent
  pdfUrl: text("pdf_url"), // URL du fichier PDF généré
  photoCount: integer("photo_count").default(0), // Nombre de photos dans la gazette
  birthdayCount: integer("birthday_count").default(0), // Nombre d'anniversaires dans la gazette
  errorMessage: text("error_message"), // Message d'erreur éventuel
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closingDate: timestamp("closing_date"),
});

export const insertGazetteSchema = createInsertSchema(gazettes).omit({
  id: true,
  createdAt: true,
});

// FamilyFund model
export const familyFunds = pgTable("family_funds", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id).unique(),
  balance: integer("balance").notNull().default(0), // In cents
  currency: text("currency").notNull().default("ILS"),
});

export const insertFamilyFundSchema = createInsertSchema(familyFunds).omit({
  id: true,
});

// FundTransactions model
export const fundTransactions = pgTable("fund_transactions", {
  id: serial("id").primaryKey(),
  familyFundId: integer("family_fund_id").notNull().references(() => familyFunds.id),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // In cents
  description: text("description"),
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
});

export const insertFundTransactionSchema = createInsertSchema(fundTransactions).omit({
  id: true,
  transactionDate: true,
});

// Recipients model
export const recipients = pgTable("recipients", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  streetAddress: text("street_address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
  active: boolean("active").notNull().default(true),
});

export const insertRecipientSchema = createInsertSchema(recipients).omit({
  id: true,
});

// Invitations model
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  invitedByUserId: integer("invited_by_user_id").notNull().references(() => users.id),
  email: text("email"),
  token: text("token").notNull().unique(),
  message: text("message"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, expired
  type: text("type").notNull().default("code"), // code, email
});

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  createdAt: true,
});

// Events model
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // birthday, anniversary, custom
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

// Children model
export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  birthDate: timestamp("birth_date"),
  gender: text("gender"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
});

// Define relationships between models
export const usersRelations = relations(users, ({ many }) => ({
  familyMembers: many(familyMembers),
  photos: many(photos),
  fundTransactions: many(fundTransactions),
  invitations: many(invitations),
  children: many(children),
}));

export const familiesRelations = relations(families, ({ many, one }) => ({
  members: many(familyMembers),
  photos: many(photos),
  gazettes: many(gazettes),
  fund: one(familyFunds, { fields: [families.id], references: [familyFunds.familyId] }),
  recipients: many(recipients),
  invitations: many(invitations),
  events: many(events),
}));

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  user: one(users, { fields: [familyMembers.userId], references: [users.id] }),
  family: one(families, { fields: [familyMembers.familyId], references: [families.id] }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  user: one(users, { fields: [photos.userId], references: [users.id] }),
  family: one(families, { fields: [photos.familyId], references: [families.id] }),
}));

export const gazettesRelations = relations(gazettes, ({ one }) => ({
  family: one(families, { fields: [gazettes.familyId], references: [families.id] }),
}));

export const familyFundsRelations = relations(familyFunds, ({ one, many }) => ({
  family: one(families, { fields: [familyFunds.familyId], references: [families.id] }),
  transactions: many(fundTransactions),
}));

export const fundTransactionsRelations = relations(fundTransactions, ({ one }) => ({
  fund: one(familyFunds, { fields: [fundTransactions.familyFundId], references: [familyFunds.id] }),
  user: one(users, { fields: [fundTransactions.userId], references: [users.id] }),
}));

export const recipientsRelations = relations(recipients, ({ one }) => ({
  family: one(families, { fields: [recipients.familyId], references: [families.id] }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  family: one(families, { fields: [invitations.familyId], references: [families.id] }),
  invitedBy: one(users, { fields: [invitations.invitedByUserId], references: [users.id] }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  family: one(families, { fields: [events.familyId], references: [families.id] }),
}));

export const childrenRelations = relations(children, ({ one }) => ({
  parent: one(users, { fields: [children.userId], references: [users.id] }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;

export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type Gazette = typeof gazettes.$inferSelect;
export type InsertGazette = z.infer<typeof insertGazetteSchema>;

export type FamilyFund = typeof familyFunds.$inferSelect;
export type InsertFamilyFund = z.infer<typeof insertFamilyFundSchema>;

export type FundTransaction = typeof fundTransactions.$inferSelect;
export type InsertFundTransaction = z.infer<typeof insertFundTransactionSchema>;

export type Recipient = typeof recipients.$inferSelect;
export type InsertRecipient = z.infer<typeof insertRecipientSchema>;

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
