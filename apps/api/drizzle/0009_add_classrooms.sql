-- Create classrooms table
CREATE TABLE IF NOT EXISTS "classrooms" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"is_primary" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "idx_classroom_institution" ON "classrooms" ("institution_id");
CREATE INDEX IF NOT EXISTS "idx_classroom_institution_primary" ON "classrooms" ("institution_id","is_primary");

-- Add foreign key
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE no action ON UPDATE no action;

-- Create default classroom for each existing institution
INSERT INTO "classrooms" ("id", "institution_id", "name", "is_primary", "sort_order", "active")
SELECT 
	gen_random_uuid()::text,
	id,
	'Aula de Innovación Pedagógica',
	true,
	0,
	true
FROM "institutions"
WHERE NOT EXISTS (
	SELECT 1 FROM "classrooms" WHERE "classrooms"."institution_id" = "institutions"."id"
);

-- Add classroom_id to classroom_reservations
ALTER TABLE "classroom_reservations" ADD COLUMN IF NOT EXISTS "classroom_id" text;

-- Populate classroom_id with primary classroom for each institution
UPDATE "classroom_reservations" cr
SET "classroom_id" = (
	SELECT c.id 
	FROM "classrooms" c 
	WHERE c.institution_id = cr.institution_id 
	AND c.is_primary = true 
	LIMIT 1
)
WHERE "classroom_id" IS NULL;

-- Make classroom_id NOT NULL
ALTER TABLE "classroom_reservations" ALTER COLUMN "classroom_id" SET NOT NULL;

-- Add foreign key and index
ALTER TABLE "classroom_reservations" ADD CONSTRAINT "classroom_reservations_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX IF NOT EXISTS "idx_classroom_res_classroom" ON "classroom_reservations" ("classroom_id");

-- Add classroom_id to reservation_slots
ALTER TABLE "reservation_slots" ADD COLUMN IF NOT EXISTS "classroom_id" text;

-- Populate classroom_id from parent reservation
UPDATE "reservation_slots" rs
SET "classroom_id" = (
	SELECT cr.classroom_id 
	FROM "classroom_reservations" cr 
	WHERE cr.id = rs.reservation_id
)
WHERE "classroom_id" IS NULL;

-- Make classroom_id NOT NULL
ALTER TABLE "reservation_slots" ALTER COLUMN "classroom_id" SET NOT NULL;

-- Add foreign key and index
ALTER TABLE "reservation_slots" ADD CONSTRAINT "reservation_slots_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX IF NOT EXISTS "idx_slot_classroom" ON "reservation_slots" ("classroom_id");

-- Drop old unique constraint and create new one with classroom_id
DROP INDEX IF EXISTS "idx_slot_unique";
CREATE UNIQUE INDEX IF NOT EXISTS "idx_slot_unique" ON "reservation_slots" ("classroom_id","date","pedagogical_hour_id");
