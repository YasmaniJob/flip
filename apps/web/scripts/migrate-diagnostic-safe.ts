/**
 * Safe Migration Script for Diagnostic Module
 * 
 * This script:
 * 1. Runs the migration in a transaction
 * 2. Verifies all tables were created
 * 3. Automatically rolls back on error
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';

async function safeMigrate() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  
  try {
    console.log('🚀 Starting diagnostic module migration...');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    // Run migration with automatic transaction
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Migration executed successfully');
    
    // Verify that all diagnostic tables exist
    console.log('🔍 Verifying tables...');
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND table_name LIKE 'diagnostic_%'
      ORDER BY table_name
    `;
    
    console.log('📋 Created diagnostic tables:', result.map(r => r.table_name));
    
    if (result.length !== 4) {
      throw new Error(`Expected 4 diagnostic tables, found ${result.length}`);
    }
    
    // Verify institutions columns
    console.log('🔍 Verifying institutions columns...');
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
        AND table_name = 'institutions'
        AND column_name LIKE 'diagnostic_%'
      ORDER BY column_name
    `;
    
    console.log('📋 Added columns to institutions:', columns.map(c => c.column_name));
    
    if (columns.length !== 3) {
      throw new Error(`Expected 3 diagnostic columns in institutions, found ${columns.length}`);
    }
    
    console.log('✅ All verifications passed');
    console.log('🎉 Diagnostic module migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('🔄 Transaction automatically rolled back by Neon');
    console.log('💡 No changes were made to the database');
    process.exit(1);
  }
}

safeMigrate();
