/**
 * Check current diagnostic data in database
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { diagnosticCategories, diagnosticQuestions } from '@/lib/db/schema';

async function check() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  
  try {
    console.log('🔍 Checking diagnostic data...\n');
    
    // Check categories
    const categories = await db.select().from(diagnosticCategories);
    console.log(`📊 Categories found: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`   - ${cat.id} | ${cat.code} | ${cat.name}`);
    });
    console.log('');
    
    // Check questions
    const questions = await db.select().from(diagnosticQuestions);
    console.log(`📊 Questions found: ${questions.length}`);
    questions.forEach(q => {
      console.log(`   - ${q.id} | ${q.code} | ${q.categoryId} | ${q.text.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

check();
