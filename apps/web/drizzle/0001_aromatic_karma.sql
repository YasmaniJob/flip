ALTER TABLE "institutions" ADD COLUMN "subscription_plan" text DEFAULT 'trial';--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "subscription_start_date" timestamp;