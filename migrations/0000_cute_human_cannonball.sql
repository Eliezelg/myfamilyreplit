-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "family_funds" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_id" integer NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'ILS' NOT NULL,
	CONSTRAINT "family_funds_family_id_unique" UNIQUE("family_id")
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_id" integer NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"street_address" text NOT NULL,
	"city" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_id" integer NOT NULL,
	"invited_by_user_id" integer NOT NULL,
	"email" text,
	"token" text NOT NULL,
	"message" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"type" text DEFAULT 'code' NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "gazettes" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_id" integer NOT NULL,
	"month_year" text NOT NULL,
	"status" text NOT NULL,
	"pdf_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closing_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"family_id" integer NOT NULL,
	"role" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_fund_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"description" text,
	"transaction_date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp(6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"caption" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"month_year" text NOT NULL,
	"file_size" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"profile_image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"display_name" text,
	"birth_date" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "children" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"birth_date" timestamp,
	"gender" text,
	"profile_image" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "family_funds" ADD CONSTRAINT "family_funds_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipients" ADD CONSTRAINT "recipients_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gazettes" ADD CONSTRAINT "gazettes_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_transactions" ADD CONSTRAINT "fund_transactions_family_fund_id_family_funds_id_fk" FOREIGN KEY ("family_fund_id") REFERENCES "public"."family_funds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_transactions" ADD CONSTRAINT "fund_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "session" USING btree ("expire" timestamp_ops);
*/