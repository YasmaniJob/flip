-- Performance Optimization Indexes Migration
-- Created: 2026-01-20
-- Purpose: Add strategic indexes for multi-tenant queries and foreign key relationships

-- Categories table
CREATE INDEX IF NOT EXISTS idx_categories_institution_id 
ON categories(institution_id);

-- Resources table  
CREATE INDEX IF NOT EXISTS idx_resources_institution_id 
ON resources(institution_id);

CREATE INDEX IF NOT EXISTS idx_resources_category_id 
ON resources(category_id);

-- Composite index for common filtered queries
CREATE INDEX IF NOT EXISTS idx_resources_institution_status 
ON resources(institution_id, status) 
WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resources_institution_condition
ON resources(institution_id, condition)
WHERE condition IS NOT NULL;

-- Users table (if not already indexed)
CREATE INDEX IF NOT EXISTS idx_users_institution_id 
ON users(institution_id);

-- Resource templates table
CREATE INDEX IF NOT EXISTS idx_resource_templates_institution_id 
ON resource_templates(institution_id);

CREATE INDEX IF NOT EXISTS idx_resource_templates_category_id
ON resource_templates(category_id);

-- Staff table (if exists)
CREATE INDEX IF NOT EXISTS idx_staff_institution_id 
ON staff(institution_id);

-- Loans table
CREATE INDEX IF NOT EXISTS idx_loans_institution_id
ON loans(institution_id);

CREATE INDEX IF NOT EXISTS idx_loans_staff_id
ON loans(staff_id);

CREATE INDEX IF NOT EXISTS idx_loans_status
ON loans(institution_id, status)
WHERE status IS NOT NULL;

-- Loan resources junction table
CREATE INDEX IF NOT EXISTS idx_loan_resources_loan_id
ON loan_resources(loan_id);

CREATE INDEX IF NOT EXISTS idx_loan_resources_resource_id
ON loan_resources(resource_id);

-- Analyze tables after creating indexes
ANALYZE categories;
ANALYZE resources;
ANALYZE users;
ANALYZE resource_templates;
ANALYZE staff;
ANALYZE loans;
ANALYZE loan_resources;
