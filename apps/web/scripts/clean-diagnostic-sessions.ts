/**
 * Clean diagnostic sessions for testing
 * Removes all diagnostic sessions and responses to allow fresh testing
 */

import { db } from '@/lib/db';
import { diagnosticSessions, diagnosticResponses } from '@/lib/db/schema';

async function cleanDiagnosticSessions() {
  try {
    console.log('🧹 Cleaning diagnostic sessions...');
    
    // Delete all responses first (foreign key constraint)
    const deletedResponses = await db.delete(diagnosticResponses);
    console.log('✅ Deleted diagnostic responses');
    
    // Delete all sessions
    const deletedSessions = await db.delete(diagnosticSessions);
    console.log('✅ Deleted diagnostic sessions');
    
    console.log('✨ Cleanup complete! You can now test the diagnostic again.');
  } catch (error) {
    console.error('❌ Error cleaning diagnostic sessions:', error);
    process.exit(1);
  }
}

cleanDiagnosticSessions();
