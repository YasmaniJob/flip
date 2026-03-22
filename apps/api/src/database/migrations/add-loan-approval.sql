-- Migration: Add approval workflow and student pickup note to loans
-- Run this once against the database

ALTER TABLE loans
    ADD COLUMN IF NOT EXISTS requested_by_user_id TEXT,
    ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved',
    ADD COLUMN IF NOT EXISTS student_pickup_note TEXT;

CREATE INDEX IF NOT EXISTS idx_loan_requested_by ON loans(requested_by_user_id);
CREATE INDEX IF NOT EXISTS idx_loan_approval_status ON loans(approval_status);
