/**
 * Verification Script for Diagnostic Module
 * 
 * Verifies that all data was loaded correctly
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { diagnosticCategories, diagnosticQuestions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function verify() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  
  try {
    console.log('🔍 Verifying diagnostic data...');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('');
    
    // Verify categories
    const categories = await db.select().from(diagnosticCategories);
    console.log(`📊 Categories found: ${categories.length}`);
    
    for (const cat of categories) {
      const questions = await db.select()
        .from(diagnosticQuestions)
        .where(eq(diagnosticQuestions.categoryId, cat.id));
      
      console.log(`   ${cat.order}. ${cat.name} (${cat.code}): ${questions.length} questions`);
    }
    
    console.log('');
    console.log('✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verify();
