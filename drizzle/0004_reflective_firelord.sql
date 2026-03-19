ALTER TABLE "residents" ADD COLUMN "family_email" text;--> statement-breakpoint
ALTER TABLE "residents" ADD COLUMN "email_summaries" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "support_sessions" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "support_sessions" ADD COLUMN "summary_email_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "support_sessions" ADD COLUMN "summary_email_to" text;