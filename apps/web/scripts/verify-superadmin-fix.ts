/**
 * Verify Superadmin Fix
 * 
 * Checks that all users with role='superadmin' also have isSuperAdmin=true
 */

import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function verifySuperadminFix() {
  console.log('🔍 Verifying superadmin users...\n');

  const superadmins = await db.query.users.findMany({
    where: eq(users.role, 'superadmin'),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      isSuperAdmin: true,
      institutionId: true,
    },
  });

  console.log(`Found ${superadmins.length} users with role='superadmin'\n`);

  let allCorrect = true;

  superadmins.forEach(user => {
    const status = user.isSuperAdmin ? '✅' : '❌';
    console.log(`${status} ${user.name} (${user.email})`);
    console.log(`   role: '${user.role}', isSuperAdmin: ${user.isSuperAdmin}`);
    console.log(`   Institution: ${user.institutionId}\n`);
    
    if (!user.isSuperAdmin) {
      allCorrect = false;
    }
  });

  if (allCorrect) {
    console.log('✅ All superadmin users have correct flags!');
  } else {
    console.log('❌ Some superadmin users still have incorrect flags!');
    process.exit(1);
  }
}

verifySuperadminFix()
  .then(() => {
    console.log('\n✅ Verification complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
