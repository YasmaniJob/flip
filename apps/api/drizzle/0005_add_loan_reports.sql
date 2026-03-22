CREATE TABLE "pedagogical_hours" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_break" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "damage_reports" jsonb;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "suggestion_reports" jsonb;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "missing_resources" jsonb;--> statement-breakpoint
ALTER TABLE "pedagogical_hours" ADD CONSTRAINT "pedagogical_hours_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pedagogical_hour_institution" ON "pedagogical_hours" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_staff_dni" ON "staff" USING btree ("dni");--> statement-breakpoint
CREATE INDEX "idx_staff_email" ON "staff" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_staff_role" ON "staff" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_staff_status" ON "staff" USING btree ("status");