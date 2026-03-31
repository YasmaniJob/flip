-- Migration: Add year field to diagnostic_sessions table
-- This enables annual periodization of diagnostic sessions

-- Step 1: Add year column (allow NULL temporarily for existing data)
ALTER TABLE diagnostic_sessions 
ADD COLUMN year INTEGER;

-- Step 2: Update existing sessions with year 2025 (year 0 - clean data assumption)
UPDATE diagnostic_sessions 
SET year = 2025 
WHERE year IS NULL;

-- Step 3: Make column NOT NULL
ALTER TABLE diagnostic_sessions 
ALTER COLUMN year SET NOT NULL;

-- Step 4: Add check constraint to ensure valid year range
ALTER TABLE diagnostic_sessions 
ADD CONSTRAINT check_year_valid 
CHECK (year >= 2025 AND year <= 2100);

-- Step 5: Create indexes for performance
CREATE INDEX idx_diagnostic_session_year 
ON diagnostic_sessions(year);

CREATE INDEX idx_diagnostic_session_institution_year 
ON diagnostic_sessions(institution_id, year);

CREATE INDEX idx_diagnostic_session_staff_year 
ON diagnostic_sessions(staff_id, year) 
WHERE staff_id IS NOT NULL;

-- Step 6: Create uniqueness constraints (one diagnostic per teacher per year)
ALTER TABLE diagnostic_sessions 
ADD CONSTRAINT unique_institution_staff_year 
UNIQUE (institution_id, staff_id, year);

ALTER TABLE diagnostic_sessions 
ADD CONSTRAINT unique_institution_user_year 
UNIQUE (institution_id, user_id, year);
