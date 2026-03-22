CREATE TABLE "classroom_reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"staff_id" text NOT NULL,
	"grade_id" text,
	"section_id" text,
	"curricular_area_id" text,
	"purpose" text,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"cancelled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reservation_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"reservation_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"pedagogical_hour_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"attended" boolean DEFAULT false,
	"attended_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "classroom_reservations" ADD CONSTRAINT "classroom_reservations_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_reservations" ADD CONSTRAINT "classroom_reservations_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_reservations" ADD CONSTRAINT "classroom_reservations_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_reservations" ADD CONSTRAINT "classroom_reservations_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_reservations" ADD CONSTRAINT "classroom_reservations_curricular_area_id_curricular_areas_id_fk" FOREIGN KEY ("curricular_area_id") REFERENCES "public"."curricular_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_slots" ADD CONSTRAINT "reservation_slots_reservation_id_classroom_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."classroom_reservations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_slots" ADD CONSTRAINT "reservation_slots_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_slots" ADD CONSTRAINT "reservation_slots_pedagogical_hour_id_pedagogical_hours_id_fk" FOREIGN KEY ("pedagogical_hour_id") REFERENCES "public"."pedagogical_hours"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_classroom_res_institution" ON "classroom_reservations" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_classroom_res_staff" ON "classroom_reservations" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "idx_slot_reservation" ON "reservation_slots" USING btree ("reservation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_slot_unique" ON "reservation_slots" USING btree ("institution_id","date","pedagogical_hour_id");