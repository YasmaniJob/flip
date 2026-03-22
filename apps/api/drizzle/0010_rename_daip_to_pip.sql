-- Rename DAIP role to PIP (Promotor de Innovación Pedagógica)
-- This migration updates all references from 'daip' to 'pip'

-- Update users table
UPDATE "users" 
SET "role" = 'pip' 
WHERE "role" = 'daip';

-- Update staff table
UPDATE "staff" 
SET "role" = 'pip' 
WHERE "role" = 'daip';

-- Add comment for documentation
COMMENT ON COLUMN "users"."role" IS 'User role: admin, pip (Promotor de Innovación Pedagógica), docente';
COMMENT ON COLUMN "staff"."role" IS 'Staff role: admin, pip (Promotor de Innovación Pedagógica), docente';
