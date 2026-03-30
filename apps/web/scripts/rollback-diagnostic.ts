/**
 * Rollback Script for Diagnostic Module
 * 
 * WARNING: This will DELETE all diagnostic data!
 * Only use this if something went wrong with the migration.
 * 
 * Usage: pnpm tsx scripts/rollback-diagnostic.ts
 */

import { neon } from '@neondatabase/serverless';

async function rollback() {
  const sql = neon(process.env.DATABASE_URL!);
  
  console.log('⚠️  WARNING: This will delete all diagnostic tables and data!');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('');
  
  try {
    console.log('🔄 Rolling back diagnostic module...');
    
    // Drop tables in reverse order (respecting foreign keys)
    console.log('📦 Dropping diagnostic_responses...');
    await sql`DROP TABLE IF EXISTS diagnostic_responses CASCADE`;
    
    console.log('📦 Dropping diagnostic_sessions...');
    await sql`DROP TABLE IF EXISTS diagnostic_sessions CASCADE`;
    
    console.log('📦 Dropping diagnostic_questions...');
    await sql`DROP TABLE IF EXISTS diagnostic_questions CASCADE`;
    
    console.log('📦 Dropping diagnostic_categories...');
    await sql`DROP TABLE IF EXISTS diagnostic_categories CASCADE`;
    
    // Remove columns from institutions
    console.log('📦 Removing diagnostic columns from institutions...');
    await sql`ALTER TABLE institutions DROP COLUMN IF EXISTS diagnostic_enabled CASCADE`;
    await sql`ALTER TABLE institutions DROP COLUMN IF EXISTS diagnostic_requires_approval CASCADE`;
    await sql`ALTER TABLE institutions DROP COLUMN IF EXISTS diagnostic_custom_message CASCADE`;
    
    console.log('✅ Rollback completed successfully');
    console.log('💡 All diagnostic tables and columns have been removed');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    console.log('💡 You may need to manually clean up the database');
    process.exit(1);
  }
}

rollback();
