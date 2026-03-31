/**
 * Fix Diagnostic Sessions Status
 * 
 * This script updates existing diagnostic sessions to properly handle the approval workflow:
 * 1. Sessions with staffId should be marked as 'approved'
 * 2. Sessions without staffId should remain as 'completed' (pending approval)
 * 
 * Run with: npx tsx apps/web/scripts/fix-diagnostic-sessions-status.ts
 */

import { db } from '../src/lib/db';
import { diagnosticSessions, institutions, staff } from '../src/lib/db/schema';
import { eq, and, isNotNull, isNull, or } from 'drizzle-orm';

async function fixDiagnosticSessionsStatus() {
  console.log('🔍 Starting diagnostic sessions status fix...\n');

  try {
    // Get all sessions with status 'completed'
    const completedSessions = await db.query.diagnosticSessions.findMany({
      where: eq(diagnosticSessions.status, 'completed'),
    });

    console.log(`📊 Found ${completedSessions.length} sessions with status 'completed'\n`);

    if (completedSessions.length === 0) {
      console.log('✅ No sessions to fix');
      return;
    }

    let approvedCount = 0;
    let pendingCount = 0;

    for (const session of completedSessions) {
      // Get institution settings
      const institution = await db.query.institutions.findFirst({
        where: eq(institutions.id, session.institutionId),
      });

      if (!institution) {
        console.log(`⚠️  Institution not found for session ${session.id}`);
        continue;
      }

      // Check if staff exists for this session
      const existingStaff = await db.query.staff.findFirst({
        where: and(
          eq(staff.institutionId, session.institutionId),
          or(
            session.dni ? eq(staff.dni, session.dni) : undefined,
            session.email ? eq(staff.email, session.email) : undefined
          )
        ),
      });

      if (existingStaff) {
        // Staff exists → mark as approved and link
        await db.update(diagnosticSessions)
          .set({
            status: 'approved',
            staffId: existingStaff.id,
            updatedAt: new Date(),
          })
          .where(eq(diagnosticSessions.id, session.id));

        console.log(`✅ Session ${session.id} (${session.name}) → approved (linked to staff ${existingStaff.id})`);
        approvedCount++;
      } else if (!institution.diagnosticRequiresApproval) {
        // No approval required → create staff and approve
        const [newStaff] = await db.insert(staff)
          .values({
            id: crypto.randomUUID(),
            institutionId: session.institutionId,
            name: session.name,
            dni: session.dni,
            email: session.email,
            role: 'docente',
            status: 'active',
          })
          .returning();

        await db.update(diagnosticSessions)
          .set({
            status: 'approved',
            staffId: newStaff.id,
            updatedAt: new Date(),
          })
          .where(eq(diagnosticSessions.id, session.id));

        console.log(`✅ Session ${session.id} (${session.name}) → approved (created staff ${newStaff.id})`);
        approvedCount++;
      } else {
        // Requires approval and no staff → leave as pending
        console.log(`⏳ Session ${session.id} (${session.name}) → pending approval`);
        pendingCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   - Approved: ${approvedCount}`);
    console.log(`   - Pending: ${pendingCount}`);
    console.log(`   - Total processed: ${completedSessions.length}`);
    console.log('\n✅ Fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing diagnostic sessions:', error);
    throw error;
  }
}

// Run the fix
fixDiagnosticSessionsStatus()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
