-- Migration: Ensure users table has dni field and index
-- This migration is idempotent and safe to run multiple times

-- Add dni column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'dni'
    ) THEN
        ALTER TABLE users ADD COLUMN dni TEXT;
    END IF;
END $$;

-- Create index on dni if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'idx_user_dni'
    ) THEN
        CREATE INDEX idx_user_dni ON users(dni);
    END IF;
END $$;
