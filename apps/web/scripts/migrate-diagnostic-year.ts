/**
 * Migration Script: Add year field to diagnostic_sessions
 * 
 * This script applies the annual periodization migration to the diagnostic module.
 * It adds the year field, indexes, and uniqueness constraints.
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in .env.local');
}

async function migrateYearField() {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    console.log('🚀 Starting diagnostic year field migration...');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('');
    
    // Step 1: Add year column (allow NULL temporarily)
    console.log('📦 Adding year column to diagnostic_sessions...');
    await sql`
      ALTER TABLE diagnostic_sessions 
      ADD COLUMN IF NOT EXISTS year INTEGER
    `;
    console.log('✅ Year column added');
    
    // Step 2: Update existing sessions with year 2025
    console.log('📝 Updating existing sessions with year 2025...');
    const updateResult = await sql`
      UPDATE diagnostic_sessions 
      SET year = 2025 
      WHERE year IS NULL
    `;
    console.log(`✅ Updated ${updateResult.length} sessions`);
    
    // Step 3: Make column NOT NULL
    console.log('🔒 Making year column NOT NULL...');
    await sql`
      ALTER TABLE diagnostic_sessions 
      ALTER COLUMN year SET NOT NULL
    `;
    console.log('✅ Year column is now NOT NULL');
    
    // Step 4: Add check constraint
    console.log('✅ Adding check constraint for valid year range...');
    await sql`
      ALTER TABLE diagnostic_sessions 
      DROP CONSTRAINT IF EXISTS check_year_valid
    `;
    await sql`
      ALTER TABLE diagnostic_sessions 
      ADD CONSTRAINT check_year_valid 
      CHECK (year >= 2025 AND year <= 2100)
    `;
    console.log('✅ Check constraint added');
    
    // Step 5: Create indexes
    console.log('📊 Creating indexes...');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_diagnostic_session_year 
      ON diagnostic_sessions(year)
    `;
    console.log('  ✅ idx_diagnostic_session_year');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_diagnostic_session_institution_year 
      ON diagnostic_sessions(institution_id, year)
    `;
    console.log('  ✅ idx_diagnostic_session_institution_year');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_diagnostic_session_staff_year 
      ON diagnostic_sessions(staff_id, year) 
      WHERE staff_id IS NOT NULL
    `;
    console.log('  ✅ idx_diagnostic_session_staff_year');
    
    // Step 6: Create uniqueness constraints
    console.log('🔐 Creating uniqueness constraints...');
    
    await sql`
      ALTER TABLE diagnostic_sessions 
      DROP CONSTRAINT IF EXISTS unique_institution_staff_year
    `;
    await sql`
      ALTER TABLE diagnostic_sessions 
      ADD CONSTRAINT unique_institution_staff_year 
      UNIQUE (institution_id, staff_id, year)
    `;
    console.log('  ✅ unique_institution_staff_year');
    
    await sql`
      ALTER TABLE diagnostic_sessions 
      DROP CONSTRAINT IF EXISTS unique_institution_user_year
    `;
    await sql`
      ALTER TABLE diagnostic_sessions 
      ADD CONSTRAINT unique_institution_user_year 
      UNIQUE (institution_id, user_id, year)
    `;
    console.log('  ✅ unique_institution_user_year');
    
    console.log('');
    console.log('✅ Migration executed successfully');
    console.log('');
    
    // Verification
    console.log('🔍 Verifying migration...');
    
    // Check if year column exists and is NOT NULL
    const columnCheck = await sql`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'diagnostic_sessions' 
      AND column_name = 'year'
    `;
    
    if (columnCheck.length === 1 && columnCheck[0].is_nullable === 'NO') {
      console.log('✅ Year column exists and is NOT NULL');
    } else {
      throw new Error('Year column verification failed');
    }
    
    // Check if all sessions have a year
    const nullYearCheck = await sql`
      SELECT COUNT(*) as count 
      FROM diagnostic_sessions 
      WHERE year IS NULL
    `;
    
    if (nullYearCheck[0].count === '0') {
      console.log('✅ All sessions have a year value');
    } else {
      throw new Error(`Found ${nullYearCheck[0].count} sessions without year`);
    }
    
    // Check indexes
    const indexCheck = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'diagnostic_sessions' 
      AND indexname LIKE '%year%'
    `;
    
    console.log(`✅ Found ${indexCheck.length} year-related indexes`);
    
    // Check constraints
    const constraintCheck = await sql`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'diagnostic_sessions'::regclass 
      AND conname LIKE '%year%'
    `;
    
    console.log(`✅ Found ${constraintCheck.length} year-related constraints`);
    
    console.log('');
    console.log('✅ All verifications passed');
    console.log('🎉 Diagnostic year field migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('');
    console.log('🔄 Some changes may have been applied');
    console.log('💡 Check the database state and fix manually if needed');
    process.exit(1);
  }
}

migrateYearField();
