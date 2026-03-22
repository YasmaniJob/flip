CREATE TABLE "classrooms" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"is_primary" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP INDEX "idx_slot_unique";--> statement-breakpoint
ALTER TABLE "classroom_reservations" ADD COLUMN "classroom_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "requested_by_user_id" text;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "approval_status" text DEFAULT 'approved';--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "student_pickup_note" text;--> statement-breakpoint
ALTER TABLE "reservation_slots" ADD COLUMN "classroom_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "settings" jsonb;--> statement-breakpoint
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_classroom_institution" ON "classrooms" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_classroom_institution_primary" ON "classrooms" USING btree ("institution_id","is_primary");--> statement-breakpoint
ALTER TABLE "classroom_reservations" ADD CONSTRAINT "classroom_reservations_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_slots" ADD CONSTRAINT "reservation_slots_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_classroom_res_classroom" ON "classroom_reservations" USING btree ("classroom_id");--> statement-breakpoint
CREATE INDEX "idx_loan_requested_by" ON "loans" USING btree ("requested_by_user_id");--> statement-breakpoint
CREATE INDEX "idx_slot_classroom" ON "reservation_slots" USING btree ("classroom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_slot_unique" ON "reservation_slots" USING btree ("classroom_id","date","pedagogical_hour_id");