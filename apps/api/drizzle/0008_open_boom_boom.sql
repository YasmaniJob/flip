-- Create new reservation_attendance table
CREATE TABLE IF NOT EXISTS "reservation_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"reservation_id" text NOT NULL,
	"staff_id" text NOT NULL,
	"status" text DEFAULT 'presente',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
-- Create new reservation_tasks table
CREATE TABLE IF NOT EXISTS "reservation_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"reservation_id" text NOT NULL,
	"description" text NOT NULL,
	"assigned_staff_id" text,
	"status" text DEFAULT 'pending',
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
-- Add title column to classroom_reservations
ALTER TABLE "classroom_reservations" ADD COLUMN IF NOT EXISTS "title" text;
--> statement-breakpoint
-- Add foreign keys for reservation_attendance
ALTER TABLE "reservation_attendance" ADD CONSTRAINT "reservation_attendance_reservation_id_classroom_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."classroom_reservations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reservation_attendance" ADD CONSTRAINT "reservation_attendance_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
-- Add foreign keys for reservation_tasks
ALTER TABLE "reservation_tasks" ADD CONSTRAINT "reservation_tasks_reservation_id_classroom_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."classroom_reservations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reservation_tasks" ADD CONSTRAINT "reservation_tasks_assigned_staff_id_staff_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
-- Add indexes for reservation_attendance
CREATE INDEX IF NOT EXISTS "idx_res_attendance_reservation" ON "reservation_attendance" USING btree ("reservation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_res_attendance_staff" ON "reservation_attendance" USING btree ("staff_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_res_attendance_unique" ON "reservation_attendance" USING btree ("reservation_id","staff_id");
--> statement-breakpoint
-- Add indexes for reservation_tasks
CREATE INDEX IF NOT EXISTS "idx_res_task_reservation" ON "reservation_tasks" USING btree ("reservation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_res_task_staff" ON "reservation_tasks" USING btree ("assigned_staff_id");
--> statement-breakpoint
-- Drop meetingId FK and index from classroom_reservations
DROP INDEX IF EXISTS "idx_classroom_res_meeting";
--> statement-breakpoint
ALTER TABLE "classroom_reservations" DROP CONSTRAINT IF EXISTS "classroom_reservations_meeting_id_meetings_id_fk";
--> statement-breakpoint
ALTER TABLE "classroom_reservations" DROP COLUMN IF EXISTS "meeting_id";