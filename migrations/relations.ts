import { relations } from "drizzle-orm/relations";
import { families, familyFunds, recipients, invitations, users, gazettes, events, familyMembers, fundTransactions, photos, children } from "./schema";

export const familyFundsRelations = relations(familyFunds, ({one, many}) => ({
	family: one(families, {
		fields: [familyFunds.familyId],
		references: [families.id]
	}),
	fundTransactions: many(fundTransactions),
}));

export const familiesRelations = relations(families, ({many}) => ({
	familyFunds: many(familyFunds),
	recipients: many(recipients),
	invitations: many(invitations),
	gazettes: many(gazettes),
	events: many(events),
	familyMembers: many(familyMembers),
	photos: many(photos),
}));

export const recipientsRelations = relations(recipients, ({one}) => ({
	family: one(families, {
		fields: [recipients.familyId],
		references: [families.id]
	}),
}));

export const invitationsRelations = relations(invitations, ({one}) => ({
	family: one(families, {
		fields: [invitations.familyId],
		references: [families.id]
	}),
	user: one(users, {
		fields: [invitations.invitedByUserId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	invitations: many(invitations),
	familyMembers: many(familyMembers),
	fundTransactions: many(fundTransactions),
	photos: many(photos),
	children: many(children),
}));

export const gazettesRelations = relations(gazettes, ({one}) => ({
	family: one(families, {
		fields: [gazettes.familyId],
		references: [families.id]
	}),
}));

export const eventsRelations = relations(events, ({one}) => ({
	family: one(families, {
		fields: [events.familyId],
		references: [families.id]
	}),
}));

export const familyMembersRelations = relations(familyMembers, ({one}) => ({
	user: one(users, {
		fields: [familyMembers.userId],
		references: [users.id]
	}),
	family: one(families, {
		fields: [familyMembers.familyId],
		references: [families.id]
	}),
}));

export const fundTransactionsRelations = relations(fundTransactions, ({one}) => ({
	familyFund: one(familyFunds, {
		fields: [fundTransactions.familyFundId],
		references: [familyFunds.id]
	}),
	user: one(users, {
		fields: [fundTransactions.userId],
		references: [users.id]
	}),
}));

export const photosRelations = relations(photos, ({one}) => ({
	family: one(families, {
		fields: [photos.familyId],
		references: [families.id]
	}),
	user: one(users, {
		fields: [photos.userId],
		references: [users.id]
	}),
}));

export const childrenRelations = relations(children, ({one}) => ({
	user: one(users, {
		fields: [children.userId],
		references: [users.id]
	}),
}));