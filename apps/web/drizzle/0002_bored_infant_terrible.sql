DROP INDEX "idx_staff_dni";--> statement-breakpoint
DROP INDEX "idx_staff_email";--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "active_institution_id" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_institution_id_institutions_id_fk" FOREIGN KEY ("active_institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_staff_institution_dni" ON "staff" USING btree ("institution_id","dni");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_staff_institution_email" ON "staff" USING btree ("institution_id","email");