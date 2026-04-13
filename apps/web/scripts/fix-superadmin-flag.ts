/**
 * Fix Superadmin Flag Migration
 * 
 * Problem: Users with role='superadmin' but isSuperAdmin=false
 * This script fixes the inconsistent state by setting isSuperAdmin=true
 * for all users with role='superadmin'
 */

import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function fixSuperadminFlag() {
  console.log('🔍 Finding users with role=superadmin but isSuperAdmin=false...\n');

  // Find all users with inconsistent state
  const brokenUsers = await db.query.users.findMany({
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

  console.log(`Found ${brokenUsers.length} users with role='superadmin'\n`);

  if (brokenUsers.length === 0) {
    console.log('✅ No users need fixing. All superadmins have correct flags.');
    return;
  }

  // Show users that need fixing
  const needsFix = brokenUsers.filter(u => !u.isSuperAdmin);
  console.log(`❌ ${needsFix.length} users need fixing:\n`);
  
  needsFix.forEach(user => {
    console.log(`  - ${user.name} (${user.email})`);
    console.log(`    ID: ${user.id}`);
    console.log(`    Institution: ${user.institutionId}`);
    console.log(`    Current: role='${user.role}', isSuperAdmin=${user.isSuperAdmin}`);
    console.log('');
  });

  // Fix the users
  console.log('🔧 Fixing users...\n');

  for (const user of needsFix) {
    await db
      .update(users)
      .set({ isSuperAdmin: true })
      .where(eq(users.id, user.id));
    
    console.log(`✅ Fixed: ${user.name} (${user.email})`);
  }

  console.log(`\n✅ Migration complete! Fixed ${needsFix.length} users.`);
  
  // Show users that were already correct
  const alreadyCorrect = brokenUsers.filter(u => u.isSuperAdmin);
  if (alreadyCorrect.length > 0) {
    console.log(`\n✅ ${alreadyCorrect.length} users already had correct flags (no action needed).`);
  }
}

fixSuperadminFlag()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
