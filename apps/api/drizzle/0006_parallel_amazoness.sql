ALTER TABLE "resources" ADD COLUMN "maintenance_progress" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "maintenance_state" jsonb;