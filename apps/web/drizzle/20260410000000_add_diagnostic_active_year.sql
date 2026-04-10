-- Migration: Add diagnostic_active_year to institutions table
-- Date: 2026-04-10
-- Description: Allows institutions to manually configure the active diagnostic year

-- Add the new column (nullable, defaults to NULL which means "use current year")
ALTER TABLE institutions 
ADD COLUMN diagnostic_active_year INTEGER;

-- Add a check constraint to ensure valid years (2025-2100)
ALTER TABLE institutions 
ADD CONSTRAINT check_diagnostic_active_year_valid 
CHECK (diagnostic_active_year IS NULL OR (diagnostic_active_year >= 2025 AND diagnostic_active_year <= 2100));

-- Add a comment to document the column
COMMENT ON COLUMN institutions.diagnostic_active_year IS 'Manual override for diagnostic year. NULL means use current year automatically.';
