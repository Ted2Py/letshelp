CREATE TYPE "public"."access_code_status" AS ENUM('active', 'used', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."notification_frequency" AS ENUM('immediate', 'daily', 'weekly', 'none');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('session_completed', 'session_summary', 'handoff_request', 'resident_alert', 'weekly_report', 'daily_report');--> statement-breakpoint
CREATE TYPE "public"."resident_status" AS ENUM('active', 'inactive', 'pending_setup');--> statement-breakpoint
CREATE TABLE "access_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"resident_id" text NOT NULL,
	"facility_id" text NOT NULL,
	"status" "access_code_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp,
	"used_at" timestamp,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "access_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "manager_notification_prefs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"facility_id" text NOT NULL,
	"session_completed" "notification_frequency" DEFAULT 'none' NOT NULL,
	"session_summary" "notification_frequency" DEFAULT 'daily' NOT NULL,
	"handoff_request" "notification_frequency" DEFAULT 'immediate' NOT NULL,
	"resident_alert" "notification_frequency" DEFAULT 'daily' NOT NULL,
	"weekly_report" boolean DEFAULT true NOT NULL,
	"weekly_report_day" integer DEFAULT 0,
	"weekly_report_time" text DEFAULT '09:00',
	"daily_report_time" text DEFAULT '18:00',
	"email_enabled" boolean DEFAULT true NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"phone_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "manager_notification_prefs_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"facility_id" text,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"resident_id" text,
	"session_id" text,
	"read" boolean DEFAULT false NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "facilities" ADD COLUMN "facility_settings" json;--> statement-breakpoint
ALTER TABLE "residents" ADD COLUMN "status" "resident_status" DEFAULT 'pending_setup' NOT NULL;--> statement-breakpoint
ALTER TABLE "residents" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "residents" ADD COLUMN "session_count_30_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "residents" ADD COLUMN "last_session_at" timestamp;--> statement-breakpoint
ALTER TABLE "residents" ADD COLUMN "needs_help_with" json;--> statement-breakpoint
ALTER TABLE "residents" ADD COLUMN "preferences_setup_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "residents" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "access_codes" ADD CONSTRAINT "access_codes_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_codes" ADD CONSTRAINT "access_codes_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_codes" ADD CONSTRAINT "access_codes_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_notification_prefs" ADD CONSTRAINT "manager_notification_prefs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_notification_prefs" ADD CONSTRAINT "manager_notification_prefs_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_resident_id_residents_id_fk" FOREIGN KEY ("resident_id") REFERENCES "public"."residents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_session_id_support_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."support_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_codes_code_idx" ON "access_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "access_codes_resident_idx" ON "access_codes" USING btree ("resident_id");--> statement-breakpoint
CREATE INDEX "access_codes_facility_idx" ON "access_codes" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "access_codes_status_idx" ON "access_codes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "manager_notification_prefs_user_idx" ON "manager_notification_prefs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "manager_notification_prefs_facility_idx" ON "manager_notification_prefs" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_facility_idx" ON "notifications" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "notifications_created_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "residents_status_idx" ON "residents" USING btree ("status");