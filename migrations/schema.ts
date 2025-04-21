import { pgTable, foreignKey, unique, serial, integer, text, timestamp, boolean, index, varchar, json } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const familyFunds = pgTable("family_funds", {
	id: serial().primaryKey().notNull(),
	familyId: integer("family_id").notNull(),
	balance: integer().default(0).notNull(),
	currency: text().default('ILS').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.familyId],
			foreignColumns: [families.id],
			name: "family_funds_family_id_families_id_fk"
		}),
	unique("family_funds_family_id_unique").on(table.familyId),
]);

export const families = pgTable("families", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	imageUrl: text("image_url"),
});

export const recipients = pgTable("recipients", {
	id: serial().primaryKey().notNull(),
	familyId: integer("family_id").notNull(),
	name: text().notNull(),
	imageUrl: text("image_url"),
	streetAddress: text("street_address").notNull(),
	city: text().notNull(),
	postalCode: text("postal_code").notNull(),
	country: text().notNull(),
	active: boolean().default(true).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.familyId],
			foreignColumns: [families.id],
			name: "recipients_family_id_families_id_fk"
		}),
]);

export const invitations = pgTable("invitations", {
	id: serial().primaryKey().notNull(),
	familyId: integer("family_id").notNull(),
	invitedByUserId: integer("invited_by_user_id").notNull(),
	email: text(),
	token: text().notNull(),
	message: text(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	status: text().default('pending').notNull(),
	type: text().default('code').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.familyId],
			foreignColumns: [families.id],
			name: "invitations_family_id_families_id_fk"
		}),
	foreignKey({
			columns: [table.invitedByUserId],
			foreignColumns: [users.id],
			name: "invitations_invited_by_user_id_users_id_fk"
		}),
	unique("invitations_token_unique").on(table.token),
]);

export const gazettes = pgTable("gazettes", {
	id: serial().primaryKey().notNull(),
	familyId: integer("family_id").notNull(),
	monthYear: text("month_year").notNull(),
	status: text().notNull(),
	pdfUrl: text("pdf_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	closingDate: timestamp("closing_date", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.familyId],
			foreignColumns: [families.id],
			name: "gazettes_family_id_families_id_fk"
		}),
]);

export const events = pgTable("events", {
	id: serial().primaryKey().notNull(),
	familyId: integer("family_id").notNull(),
	title: text().notNull(),
	description: text(),
	date: timestamp({ mode: 'string' }).notNull(),
	type: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.familyId],
			foreignColumns: [families.id],
			name: "events_family_id_families_id_fk"
		}),
]);

export const familyMembers = pgTable("family_members", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	familyId: integer("family_id").notNull(),
	role: text().notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "family_members_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.familyId],
			foreignColumns: [families.id],
			name: "family_members_family_id_families_id_fk"
		}),
]);

export const fundTransactions = pgTable("fund_transactions", {
	id: serial().primaryKey().notNull(),
	familyFundId: integer("family_fund_id").notNull(),
	userId: integer("user_id").notNull(),
	amount: integer().notNull(),
	description: text(),
	transactionDate: timestamp("transaction_date", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.familyFundId],
			foreignColumns: [familyFunds.id],
			name: "fund_transactions_family_fund_id_family_funds_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fund_transactions_user_id_users_id_fk"
		}),
]);

export const session = pgTable("session", {
	sid: varchar().primaryKey().notNull(),
	sess: json().notNull(),
	expire: timestamp({ precision: 6, mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const photos = pgTable("photos", {
	id: serial().primaryKey().notNull(),
	familyId: integer("family_id").notNull(),
	userId: integer("user_id").notNull(),
	imageUrl: text("image_url").notNull(),
	caption: text(),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow().notNull(),
	monthYear: text("month_year").notNull(),
	fileSize: integer("file_size"),
}, (table) => [
	foreignKey({
			columns: [table.familyId],
			foreignColumns: [families.id],
			name: "photos_family_id_families_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "photos_user_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	fullName: text("full_name").notNull(),
	email: text().notNull(),
	profileImage: text("profile_image"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	displayName: text("display_name"),
	birthDate: timestamp("birth_date", { mode: 'string' }),
}, (table) => [
	unique("users_username_unique").on(table.username),
]);

export const children = pgTable("children", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	name: text().notNull(),
	birthDate: timestamp("birth_date", { mode: 'string' }),
	gender: text(),
	profileImage: text("profile_image"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "children_user_id_fkey"
		}),
]);
