CREATE TYPE "public"."handoff_status" AS ENUM('pending', 'accepted', 'declined', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('active', 'completed', 'abandoned', 'handed_off');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'trialing', 'past_due', 'canceled', 'unpaid');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('senior', 'facility_admin', 'super_admin', 'volunteer');--> statement-breakpoint
CREATE TABLE "ai_session_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"contact_email" text,
	"contact_phone" text,
	"stripe_customer_id" text,
	"subscription_status" "subscription_status" DEFAULT 'active' NOT NULL,
	"subscription_plan" "subscription_plan" DEFAULT 'monthly' NOT NULL,
	"price_per_resident" integer DEFAULT 1500 NOT NULL,
	"max_residents" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facility_staff" (
	"id" text PRIMARY KEY NOT NULL,
	"facility_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "handoff_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"resident_id" text NOT NULL,
	"status" "handoff_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"accepted_by" text,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"facility_id" text NOT NULL,
	"stripe_invoice_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"resident_count" integer NOT NULL,
	"pdf_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "residents" (
	"id" text PRIMARY KEY NOT NULL,
	"facility_id" text,
	"user_id" text NOT NULL,
	"preferred_language" text DEFAULT 'en' NOT NULL,
	"accessibility_settings" json,
	"date_of_birth" timestamp,
	"emergency_contact" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"audio_transcript" text
);
--> statement-breakpoint
CREATE TABLE "support_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"resident_id" text NOT NULL,
	"facility_id" text NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"duration" integer,
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"issue_category" text,
	"issue_description" text,
	"resolution" text,
	"transcript" text,
	"recording_url" text,
	"ai_model" text DEFAULT 'gemini-2.5-flash-native-audio-preview-12-2025',
	"handed_off_to" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"facility_id" text NOT NULL,
	"resident_id" text,
	"date" text NOT NULL,
	"total_sessions" integer DEFAULT 0 NOT NULL,
	"total_duration" integer DEFAULT 0 NOT NULL,
	"completed_sessions" integer DEFAULT 0 NOT NULL,
	"abandoned_sessions" integer DEFAULT 0 NOT NULL,
	"handed_off_sessions" integer DEFAULT 0 NOT NULL,
	"common_issues" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" "user_role" DEFAULT 'senior' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "ai_session_tokens" ADD CONSTRAINT "ai_session_tokens_session_id_support_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."support_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_staff" ADD CONSTRAINT "facility_staff_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_staff" ADD CONSTRAINT "facility_staff_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoff_requests" ADD CONSTRAINT "handoff_requests_session_id_support_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."support_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoff_requests" ADD CONSTRAINT "handoff_requests_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoff_requests" ADD CONSTRAINT "handoff_requests_accepted_by_user_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residents" ADD CONSTRAINT "residents_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residents" ADD CONSTRAINT "residents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_messages" ADD CONSTRAINT "session_messages_session_id_support_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."support_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_sessions" ADD CONSTRAINT "support_sessions_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_sessions" ADD CONSTRAINT "support_sessions_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_sessions" ADD CONSTRAINT "support_sessions_handed_off_to_user_id_fk" FOREIGN KEY ("handed_off_to") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_analytics" ADD CONSTRAINT "usage_analytics_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_analytics" ADD CONSTRAINT "usage_analytics_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_session_tokens_session_idx" ON "ai_session_tokens" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "ai_session_tokens_expires_idx" ON "ai_session_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "facilities_stripe_idx" ON "facilities" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "facility_staff_facility_idx" ON "facility_staff" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "facility_staff_user_idx" ON "facility_staff" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "handoff_requests_session_idx" ON "handoff_requests" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "handoff_requests_status_idx" ON "handoff_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoices_facility_idx" ON "invoices" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "invoices_stripe_idx" ON "invoices" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "residents_facility_idx" ON "residents" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "residents_user_idx" ON "residents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_messages_session_idx" ON "session_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "support_sessions_resident_idx" ON "support_sessions" USING btree ("resident_id");--> statement-breakpoint
CREATE INDEX "support_sessions_facility_idx" ON "support_sessions" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "support_sessions_status_idx" ON "support_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "support_sessions_start_time_idx" ON "support_sessions" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "usage_analytics_facility_idx" ON "usage_analytics" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "usage_analytics_date_idx" ON "usage_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "usage_analytics_unique_idx" ON "usage_analytics" USING btree ("facility_id","resident_id","date");--> statement-breakpoint
CREATE INDEX "user_roles_user_idx" ON "user_roles" USING btree ("user_id");